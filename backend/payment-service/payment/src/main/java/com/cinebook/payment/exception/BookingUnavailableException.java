package com.cinebook.payment.exception;

import org.springframework.http.HttpStatus;

public class BookingUnavailableException extends PaymentException {
    public BookingUnavailableException(String message) { super("BOOKING_UNAVAILABLE", message, HttpStatus.SERVICE_UNAVAILABLE); }
}
