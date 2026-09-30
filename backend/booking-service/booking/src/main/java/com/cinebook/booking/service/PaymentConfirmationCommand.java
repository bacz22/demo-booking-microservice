package com.cinebook.booking.service;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentConfirmationCommand(UUID bookingId, UUID userId, UUID paymentId,
                                         BigDecimal amount, String currency) {
}
