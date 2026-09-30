package com.cinebook.payment.service;

import com.cinebook.payment.controller.dto.PaymentResponse;

public record PaymentCreateResult(PaymentResponse response, boolean created) {
}
