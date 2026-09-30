package com.cinebook.payment.controller.dto;

import jakarta.validation.constraints.NotNull;

public record CompletePaymentRequest(@NotNull Boolean success,
                                     String providerRef,
                                     String failureCode,
                                     String failureMessage) {
}
