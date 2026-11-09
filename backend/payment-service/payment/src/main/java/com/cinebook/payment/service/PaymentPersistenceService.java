package com.cinebook.payment.service;

import com.cinebook.payment.domain.entity.Payment;
import com.cinebook.payment.kafka.KafkaEvents;
import com.cinebook.payment.kafka.outbox.OutboxWriter;
import com.cinebook.payment.repository.ClaimedPayment;
import com.cinebook.payment.repository.PaymentClaimRepository;
import com.cinebook.payment.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentPersistenceService {
    private final PaymentRepository payments;
    private final PaymentClaimRepository claims;
    private final OutboxWriter outbox;
    private final String paymentTopic;

    public PaymentPersistenceService(PaymentRepository payments, PaymentClaimRepository claims, OutboxWriter outbox,
                                     @Value("${app.kafka.topics.payment-events:payment.events}") String paymentTopic) {
        this.payments = payments;
        this.claims = claims;
        this.outbox = outbox;
        this.paymentTopic = paymentTopic;
    }

    @Transactional
    public Payment create(Payment payment) {
        return payments.saveAndFlush(payment);
    }

    @Transactional(readOnly = true)
    public Payment get(UUID id) {
        return payments.findById(id).orElseThrow(PaymentNotFoundException::new);
    }

    @Transactional(readOnly = true)
    public Payment findByRequestId(UUID requestId) {
        return payments.findByRequestId(requestId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Payment findByBookingId(UUID bookingId) {
        return payments.findByBookingId(bookingId).orElse(null);
    }

    @Transactional
    public long nextCode() { return payments.nextPaymentCodeSequence(); }

    @Transactional(readOnly = true)
    public Page<Payment> findMine(UUID userId, Pageable pageable) {
        return payments.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional
    public Optional<ClaimedPayment> claim(UUID paymentId, UUID token, Instant now, Instant leaseExpiredBefore) {
        Optional<ClaimedPayment> claimed = claims.claim(paymentId, token, now, leaseExpiredBefore);
        if (claimed.isEmpty()) return Optional.empty();
        claims.abandonActiveAttempt(paymentId, now);
        claims.insertProcessingAttempt(paymentId, claimed.get().attemptNumber(), token, now);
        return claimed;
    }

    /**
     * Claim payment sang PROCESSING và ghi PaymentSucceeded vào outbox trong cùng transaction.
     * Booking-service sẽ trả lời bằng BookingConfirmed / BookingPaymentRejected trên booking.events.
     */
    @Transactional
    public Optional<ClaimedPayment> claimAndRequestConfirmation(Payment payment, UUID token, Instant now,
                                                                Instant leaseExpiredBefore) {
        Optional<ClaimedPayment> claimed = claim(payment.getId(), token, now, leaseExpiredBefore);
        claimed.ifPresent(c -> outbox.write(paymentTopic, payment.getBookingId(), KafkaEvents.PAYMENT_SUCCEEDED,
            new KafkaEvents.PaymentSucceeded(payment.getId(), payment.getBookingId(), payment.getUserId(),
                payment.getAmount(), payment.getCurrency())));
        return claimed;
    }

    @Transactional
    public Optional<ClaimedPayment> failPending(Payment payment, String code, String message, Instant now) {
        Optional<ClaimedPayment> failed = claims.failPending(payment.getId(), UUID.randomUUID(), code, message, now);
        failed.ifPresent(f -> emitFailed(payment, code, message));
        return failed;
    }

    @Transactional
    public boolean succeed(UUID paymentId, UUID token, String providerRef, Instant now) {
        return claims.resolveSuccess(paymentId, token, providerRef, now);
    }

    @Transactional
    public boolean fail(Payment payment, UUID token, String code, String message, Instant now) {
        boolean failed = claims.resolveFailure(payment.getId(), token, code, message, now);
        if (failed) emitFailed(payment, code, message);
        return failed;
    }

    /** Booking-service đã xác nhận booking cho payment này. */
    @Transactional
    public boolean succeedFromBooking(UUID paymentId, String providerRef, Instant now) {
        return claims.resolveSuccessFromBooking(paymentId, providerRef, now);
    }

    /**
     * Bù trừ (compensation) của Saga: booking từ chối payment đã thu tiền
     * → hoàn tiền (mock) + phát PaymentRefunded, cùng một transaction.
     */
    @Transactional
    public boolean refundFromBooking(UUID paymentId, String code, String message, Instant now) {
        if (!claims.refundFromBooking(paymentId, code, message, now)) return false;
        Payment payment = get(paymentId);
        outbox.write(paymentTopic, payment.getBookingId(), KafkaEvents.PAYMENT_REFUNDED,
            new KafkaEvents.PaymentRefunded(payment.getId(), payment.getBookingId(), payment.getUserId(),
                payment.getAmount(), payment.getCurrency(), code));
        return true;
    }

    private void emitFailed(Payment payment, String code, String message) {
        outbox.write(paymentTopic, payment.getBookingId(), KafkaEvents.PAYMENT_FAILED,
            new KafkaEvents.PaymentFailed(payment.getId(), payment.getBookingId(), payment.getUserId(), code, message));
    }

    @Transactional(readOnly = true)
    public List<UUID> findStuckIds(Instant leaseExpiredBefore, int limit) {
        return claims.findStuckIds(leaseExpiredBefore, limit);
    }

    @Transactional(readOnly = true)
    public long countAttempts(UUID paymentId) {
        return claims.countAttempts(paymentId);
    }
}
