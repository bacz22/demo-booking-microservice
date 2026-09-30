package com.cinebook.payment.controller.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePaymentRequest(@NotNull UUID bookingId,
                                   @NotNull @DecimalMin(value = "0.00") BigDecimal amount,
                                   @NotBlank String currency,
                                   @NotBlank String method) {
}
