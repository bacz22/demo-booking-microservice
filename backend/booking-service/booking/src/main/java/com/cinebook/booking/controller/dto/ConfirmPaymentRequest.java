package com.cinebook.booking.controller.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record ConfirmPaymentRequest(@NotNull UUID paymentId,
                                    @NotNull @DecimalMin(value = "0.00") BigDecimal amount,
                                    @NotBlank String currency) {
}
