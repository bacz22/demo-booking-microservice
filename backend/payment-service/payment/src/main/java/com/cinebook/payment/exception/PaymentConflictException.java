package com.cinebook.payment.exception;

import org.springframework.http.HttpStatus;

public class PaymentConflictException extends PaymentException {
    public PaymentConflictException(String code, String message) { super(code, message, HttpStatus.CONFLICT); }
}
