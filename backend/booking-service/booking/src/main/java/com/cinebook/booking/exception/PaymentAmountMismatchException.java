package com.cinebook.booking.exception;

import org.springframework.http.HttpStatus;

public class PaymentAmountMismatchException extends BookingException {
    public PaymentAmountMismatchException() {
        super("PAYMENT_AMOUNT_MISMATCH", "Số tiền thanh toán không khớp booking", HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
