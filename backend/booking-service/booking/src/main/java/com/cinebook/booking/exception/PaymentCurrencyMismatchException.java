package com.cinebook.booking.exception;

import org.springframework.http.HttpStatus;

public class PaymentCurrencyMismatchException extends BookingException {
    public PaymentCurrencyMismatchException() {
        super("PAYMENT_CURRENCY_MISMATCH", "Currency thanh toán phải là VND", HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
