package com.cinebook.payment.exception;

import org.springframework.http.HttpStatus;

public class PaymentUnprocessableException extends PaymentException {
    public PaymentUnprocessableException(String code, String message) { super(code, message, HttpStatus.UNPROCESSABLE_ENTITY); }
}
