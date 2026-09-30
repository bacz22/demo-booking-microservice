package com.cinebook.payment.exception;

import org.springframework.http.HttpStatus;

public class BookingClientException extends PaymentException {
    public BookingClientException(String code, String message, HttpStatus status) {
        super(code, message, status);
    }
}
