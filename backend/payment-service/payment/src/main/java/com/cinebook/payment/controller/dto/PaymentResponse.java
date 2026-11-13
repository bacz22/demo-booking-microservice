package com.cinebook.payment.controller.dto;

import com.cinebook.payment.domain.entity.Payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(UUID id, String paymentCode, UUID bookingId, UUID userId,
                              BigDecimal amount, String currency, String method, String status,
                              String providerRef, String failureCode, String failureMessage,
                              Instant bookingExpiresAt, Instant paidAt, Instant failedAt,
                              Instant createdAt, Instant updatedAt) {
    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(p.getId(), p.getPaymentCode(), p.getBookingId(), p.getUserId(),
            p.getAmount(), p.getCurrency(), p.getMethod().name(), p.getStatus().name(),
            p.getProviderRef(), p.getFailureCode(), p.getFailureMessage(), p.getBookingExpiresAt(),
            p.getPaidAt(), p.getFailedAt(), p.getCreatedAt(), p.getUpdatedAt());
    }
}
