package com.cinebook.booking.controller.dto;

import com.cinebook.booking.service.BookingPaymentStatus;
import com.cinebook.booking.service.PaymentConfirmationOutcome;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InternalPaymentResponse(UUID bookingId, UUID userId, BigDecimal amount,
                                      String currency, String status, UUID paymentId,
                                      Instant expiresAt, PaymentConfirmationOutcome outcome) {
    public static InternalPaymentResponse from(BookingPaymentStatus status, PaymentConfirmationOutcome outcome) {
        return new InternalPaymentResponse(status.bookingId(), status.userId(), status.amount(), status.currency(),
            status.status(), status.paymentId(), status.expiresAt(), outcome);
    }
}
