package com.cinebook.payment.service;

import com.cinebook.payment.client.BookingServiceClient;
import com.cinebook.payment.client.dto.BookingConfirmPaymentResponseDto;
import com.cinebook.payment.client.dto.BookingPaymentStatusDto;
import com.cinebook.payment.controller.dto.CompletePaymentRequest;
import com.cinebook.payment.controller.dto.CreatePaymentRequest;
import com.cinebook.payment.controller.dto.PaymentResponse;
import com.cinebook.payment.domain.entity.Payment;
import com.cinebook.payment.domain.enums.PaymentMethod;
import com.cinebook.payment.domain.enums.PaymentStatus;
import com.cinebook.payment.exception.BookingClientException;
import com.cinebook.payment.exception.BookingUnavailableException;
import com.cinebook.payment.exception.IdempotencyConflictException;
import com.cinebook.payment.exception.PaymentBadRequestException;
import com.cinebook.payment.exception.PaymentAccessDeniedException;
import com.cinebook.payment.exception.PaymentConflictException;
import com.cinebook.payment.exception.PaymentInProgressException;
import com.cinebook.payment.exception.PaymentUnprocessableException;
import com.cinebook.payment.repository.ClaimedPayment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {
    private final PaymentPersistenceService persistence;
    private final BookingServiceClient booking;
    private final Clock clock;
    private final String currency;
    private final long leaseSeconds;

    public PaymentService(PaymentPersistenceService persistence, BookingServiceClient booking, Clock clock,
                          @Value("${payment.currency:VND}") String currency,
                          @Value("${payment.processing.lease-seconds:60}") long leaseSeconds) {
        this.persistence = persistence;
        this.booking = booking;
        this.clock = clock;
        this.currency = currency;
        this.leaseSeconds = leaseSeconds;
    }

    public PaymentCreateResult create(CreatePaymentRequest request, UUID userId, UUID requestId) {
        String normalizedCurrency = normalizeCurrency(request.currency());
        if (!currency.equalsIgnoreCase(normalizedCurrency)) throw new PaymentUnprocessableException("CURRENCY_NOT_SUPPORTED", "Chỉ hỗ trợ currency " + currency);
        PaymentMethod method = parseMethod(request.method());
        String hash = hash(userId, request.bookingId(), request.amount(), normalizedCurrency, method);
        Payment existing = persistence.findByRequestId(requestId);
        if (existing != null) {
            if (!existing.getRequestHash().equals(hash)) throw new IdempotencyConflictException();
            return new PaymentCreateResult(PaymentResponse.from(existing), false);
        }
        Payment existingBooking = persistence.findByBookingId(request.bookingId());
        if (existingBooking != null) {
            throw new PaymentConflictException("PAYMENT_ALREADY_EXISTS", "Booking đã có payment");
        }

        BookingPaymentStatusDto bookingStatus = booking.getPaymentStatus(request.bookingId(), userId);
        if (!userId.equals(bookingStatus.userId())) throw new PaymentAccessDeniedException();
        if (!"PENDING_PAYMENT".equals(bookingStatus.status())) throw new PaymentConflictException("BOOKING_NOT_PAYABLE", "Booking không ở trạng thái chờ thanh toán");
        if (!currency.equalsIgnoreCase(bookingStatus.currency()) || bookingStatus.amount().compareTo(request.amount()) != 0) {
            throw new PaymentUnprocessableException("PAYMENT_DATA_MISMATCH", "Amount/currency không khớp booking");
        }
        Instant now = Instant.now(clock);
        String code = "CP-" + String.format("%08d", persistence.nextCode());
        Payment payment = new Payment(UUID.randomUUID(), code, request.bookingId(), userId, requestId,
            hash, request.amount(), normalizedCurrency, method, bookingStatus.expiresAt(), now);
        try {
            return new PaymentCreateResult(PaymentResponse.from(persistence.create(payment)), true);
        } catch (DataIntegrityViolationException ex) {
            Payment winner = persistence.findByRequestId(requestId);
            if (winner != null && winner.getRequestHash().equals(hash)) return new PaymentCreateResult(PaymentResponse.from(winner), false);
            Payment bookingWinner = persistence.findByBookingId(request.bookingId());
            if (bookingWinner != null) throw new PaymentConflictException("PAYMENT_ALREADY_EXISTS", "Booking đã có payment");
            throw ex;
        }
    }

    public PaymentResponse get(UUID id, UUID userId) {
        return PaymentResponse.from(requireOwner(persistence.get(id), userId));
    }

    public Page<PaymentResponse> findMine(UUID userId, Pageable pageable) {
        return persistence.findMine(userId, pageable).map(PaymentResponse::from);
    }

    public PaymentResponse complete(UUID id, UUID userId, CompletePaymentRequest request) {
        Payment current = requireOwner(persistence.get(id), userId);
        if (current.getStatus() == PaymentStatus.SUCCEEDED || current.getStatus() == PaymentStatus.FAILED) {
            return PaymentResponse.from(current);
        }
        if (!request.success()) return fail(current, request);
        return processSuccess(current);
    }

    public PaymentResponse retry(UUID id, UUID userId) {
        Payment current = requireOwner(persistence.get(id), userId);
        if (current.getStatus() == PaymentStatus.SUCCEEDED || current.getStatus() == PaymentStatus.FAILED) return PaymentResponse.from(current);
        return processSuccess(current);
    }

    public PaymentResponse reconcile(UUID id) {
        return processSuccess(persistence.get(id));
    }

    public void reconcileStuck(int batchSize) {
        Instant leaseExpiredBefore = Instant.now(clock).minus(leaseSeconds, ChronoUnit.SECONDS);
        List<UUID> ids = persistence.findStuckIds(leaseExpiredBefore, batchSize);
        for (UUID id : ids) {
            try {
                reconcile(id);
            } catch (PaymentInProgressException | BookingUnavailableException ex) {
                // Another worker may have won the claim, or booking-service may still be unavailable.
            } catch (RuntimeException ex) {
                // One bad payment must not abort the whole reconciliation batch.
            }
        }
    }

    private PaymentResponse fail(Payment current, CompletePaymentRequest request) {
        Instant now = Instant.now(clock);
        String code = request.failureCode() == null || request.failureCode().isBlank() ? "MOCK_PAYMENT_FAILED" : request.failureCode();
        String message = request.failureMessage() == null || request.failureMessage().isBlank() ? "Mock payment thất bại" : request.failureMessage();
        if (current.getStatus() == PaymentStatus.PENDING) {
            Optional<ClaimedPayment> failed = persistence.failPending(current.getId(), code, message, now);
            if (failed.isEmpty()) return settleAfterRace(current.getId(), current.getUserId());
            return PaymentResponse.from(persistence.get(current.getId()));
        }
        Optional<ClaimedPayment> claimed = claim(current);
        if (claimed.isEmpty()) throw new PaymentInProgressException();
        if (!persistence.fail(current.getId(), claimed.get().processingToken(), code, message, now)) {
            throw new PaymentConflictException("PAYMENT_FENCED_OUT", "Payment đã được worker khác xử lý");
        }
        return PaymentResponse.from(persistence.get(current.getId()));
    }

    private PaymentResponse processSuccess(Payment current) {
        Instant now = Instant.now(clock);
        if (current.getStatus() == PaymentStatus.SUCCEEDED || current.getStatus() == PaymentStatus.FAILED) return PaymentResponse.from(current);
        Optional<ClaimedPayment> claimed = claim(current);
        if (claimed.isEmpty()) {
            Payment latest = persistence.get(current.getId());
            if (latest.getStatus() == PaymentStatus.SUCCEEDED || latest.getStatus() == PaymentStatus.FAILED) return PaymentResponse.from(latest);
            throw new PaymentInProgressException();
        }
        try {
            BookingConfirmPaymentResponseDto result = booking.confirmPayment(current.getBookingId(), current.getUserId(),
                current.getId(), current.getAmount(), current.getCurrency());
            if ("NEWLY_CONFIRMED".equals(result.outcome()) || "ALREADY_CONFIRMED_SAME_PAYMENT".equals(result.outcome())) {
                if (!persistence.succeed(current.getId(), claimed.get().processingToken(), "MOCK-" + current.getId(), now)) {
                    throw new PaymentConflictException("PAYMENT_FENCED_OUT", "Payment đã bị worker khác thay thế");
                }
            } else {
                if (!persistence.fail(current.getId(), claimed.get().processingToken(), "BOOKING_ALREADY_PAID", "Booking đã gắn với payment khác", now)) {
                    throw new PaymentConflictException("PAYMENT_FENCED_OUT", "Payment đã bị worker khác thay thế");
                }
            }
            return PaymentResponse.from(persistence.get(current.getId()));
        } catch (BookingUnavailableException ex) {
            throw ex; // Keep PROCESSING; reconciliation can claim after the lease expires.
        } catch (BookingClientException ex) {
            persistence.fail(current.getId(), claimed.get().processingToken(), ex.getCode(), ex.getMessage(), now);
            return PaymentResponse.from(persistence.get(current.getId()));
        }
    }

    private Optional<ClaimedPayment> claim(Payment payment) {
        Instant now = Instant.now(clock);
        return persistence.claim(payment.getId(), UUID.randomUUID(), now, now.minus(leaseSeconds, ChronoUnit.SECONDS));
    }

    private PaymentResponse settleAfterRace(UUID id, UUID userId) {
        Payment latest = requireOwner(persistence.get(id), userId);
        if (latest.getStatus() == PaymentStatus.FAILED || latest.getStatus() == PaymentStatus.SUCCEEDED) return PaymentResponse.from(latest);
        throw new PaymentInProgressException();
    }

    private Payment requireOwner(Payment payment, UUID userId) {
        if (!payment.getUserId().equals(userId)) throw new PaymentAccessDeniedException();
        return payment;
    }

    private String normalizeCurrency(String value) { return value == null ? "" : value.trim().toUpperCase(); }

    private PaymentMethod parseMethod(String value) {
        try { return PaymentMethod.valueOf(value.trim().toUpperCase()); }
        catch (Exception ex) { throw new PaymentBadRequestException("method chỉ hỗ trợ MOCK"); }
    }

    long nextCode() { return persistence.nextCode(); }

    static String hash(UUID userId, UUID bookingId, BigDecimal amount, String currency, PaymentMethod method) {
        String canonical = userId + "|" + bookingId + "|" + amount.stripTrailingZeros().toPlainString() + "|" + currency + "|" + method;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder(64);
            for (byte b : digest) out.append(String.format("%02x", b));
            return out.toString();
        } catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
}
