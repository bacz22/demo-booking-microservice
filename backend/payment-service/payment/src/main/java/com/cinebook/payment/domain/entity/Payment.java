package com.cinebook.payment.domain.entity;

import com.cinebook.payment.domain.enums.PaymentMethod;
import com.cinebook.payment.domain.enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {
    @Id private UUID id;
    @Column(name = "payment_code", nullable = false, unique = true, length = 32) private String paymentCode;
    @Column(name = "booking_id", nullable = false, unique = true) private UUID bookingId;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "request_id", nullable = false, unique = true) private UUID requestId;
    @Column(name = "request_hash", nullable = false, length = 64) private String requestHash;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amount;
    @Column(nullable = false, length = 3) private String currency;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private PaymentMethod method;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private PaymentStatus status;
    @Column(name = "provider_ref", length = 128) private String providerRef;
    @Column(name = "failure_code", length = 64) private String failureCode;
    @Column(name = "failure_message", length = 255) private String failureMessage;
    @Column(name = "booking_expires_at", nullable = false) private Instant bookingExpiresAt;
    @Column(name = "processing_token") private UUID processingToken;
    @Column(name = "processing_started_at") private Instant processingStartedAt;
    @Column(name = "next_attempt_number", nullable = false) private int nextAttemptNumber;
    @Column(name = "paid_at") private Instant paidAt;
    @Column(name = "failed_at") private Instant failedAt;
    @Version private long version;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected Payment() { }

    public Payment(UUID id, String paymentCode, UUID bookingId, UUID userId, UUID requestId,
                   String requestHash, BigDecimal amount, String currency, PaymentMethod method,
                   Instant bookingExpiresAt, Instant now) {
        this.id = id; this.paymentCode = paymentCode; this.bookingId = bookingId; this.userId = userId;
        this.requestId = requestId; this.requestHash = requestHash; this.amount = amount;
        this.currency = currency; this.method = method; this.status = PaymentStatus.PENDING;
        this.bookingExpiresAt = bookingExpiresAt; this.createdAt = now; this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public String getPaymentCode() { return paymentCode; }
    public UUID getBookingId() { return bookingId; }
    public UUID getUserId() { return userId; }
    public UUID getRequestId() { return requestId; }
    public String getRequestHash() { return requestHash; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public PaymentMethod getMethod() { return method; }
    public PaymentStatus getStatus() { return status; }
    public String getProviderRef() { return providerRef; }
    public String getFailureCode() { return failureCode; }
    public String getFailureMessage() { return failureMessage; }
    public Instant getBookingExpiresAt() { return bookingExpiresAt; }
    public UUID getProcessingToken() { return processingToken; }
    public Instant getProcessingStartedAt() { return processingStartedAt; }
    public int getNextAttemptNumber() { return nextAttemptNumber; }
    public Instant getPaidAt() { return paidAt; }
    public Instant getFailedAt() { return failedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
