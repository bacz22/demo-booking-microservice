package com.cinebook.payment.client.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BookingConfirmPaymentResponseDto(UUID bookingId, UUID userId, BigDecimal amount,
                                               String currency, String status, UUID paymentId,
                                               Instant expiresAt, String outcome) {
}
