package com.cinebook.payment.exception;

import org.springframework.http.HttpStatus;

public class PaymentInProgressException extends PaymentException {
    public PaymentInProgressException() { super("PAYMENT_IN_PROGRESS", "Payment đang được xử lý", HttpStatus.CONFLICT); }
}
