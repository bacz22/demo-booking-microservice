package com.cinebook.payment.exception;

import org.springframework.http.HttpStatus;

public class PaymentBadRequestException extends PaymentException {
    public PaymentBadRequestException(String message) { super("BAD_REQUEST", message, HttpStatus.BAD_REQUEST); }
}
