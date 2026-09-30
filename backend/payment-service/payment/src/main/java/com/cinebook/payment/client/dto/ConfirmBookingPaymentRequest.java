package com.cinebook.payment.client.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ConfirmBookingPaymentRequest(UUID paymentId, BigDecimal amount, String currency) {
}
