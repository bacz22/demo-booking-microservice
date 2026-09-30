package com.cinebook.payment.domain.entity;

import com.cinebook.payment.domain.enums.PaymentAttemptStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_attempts")
public class PaymentAttempt {
    @Id private UUID id;
    @Column(name = "payment_id", nullable = false) private UUID paymentId;
    @Column(name = "attempt_number", nullable = false) private int attemptNumber;
    @Column(name = "processing_token", nullable = false) private UUID processingToken;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private PaymentAttemptStatus status;
    @Column(name = "provider_ref", length = 128) private String providerRef;
    @Column(name = "failure_code", length = 64) private String failureCode;
    @Column(name = "failure_message", length = 255) private String failureMessage;
    @Column(name = "started_at", nullable = false) private Instant startedAt;
    @Column(name = "ended_at") private Instant endedAt;

    protected PaymentAttempt() { }

    public PaymentAttempt(UUID id, UUID paymentId, int attemptNumber, UUID processingToken, Instant startedAt) {
        this.id = id; this.paymentId = paymentId; this.attemptNumber = attemptNumber;
        this.processingToken = processingToken; this.status = PaymentAttemptStatus.PROCESSING; this.startedAt = startedAt;
    }
    public UUID getId() { return id; }
    public UUID getPaymentId() { return paymentId; }
    public int getAttemptNumber() { return attemptNumber; }
    public UUID getProcessingToken() { return processingToken; }
    public PaymentAttemptStatus getStatus() { return status; }
    public String getProviderRef() { return providerRef; }
    public String getFailureCode() { return failureCode; }
    public String getFailureMessage() { return failureMessage; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getEndedAt() { return endedAt; }
}
