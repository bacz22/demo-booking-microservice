package com.cinebook.payment.service;

import com.cinebook.payment.domain.entity.Payment;
import com.cinebook.payment.repository.ClaimedPayment;
import com.cinebook.payment.repository.PaymentClaimRepository;
import com.cinebook.payment.repository.PaymentRepository;
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

    public PaymentPersistenceService(PaymentRepository payments, PaymentClaimRepository claims) {
        this.payments = payments;
        this.claims = claims;
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

    @Transactional
    public Optional<ClaimedPayment> failPending(UUID paymentId, String code, String message, Instant now) {
        return claims.failPending(paymentId, UUID.randomUUID(), code, message, now);
    }

    @Transactional
    public boolean succeed(UUID paymentId, UUID token, String providerRef, Instant now) {
        return claims.resolveSuccess(paymentId, token, providerRef, now);
    }

    @Transactional
    public boolean fail(UUID paymentId, UUID token, String code, String message, Instant now) {
        return claims.resolveFailure(paymentId, token, code, message, now);
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
