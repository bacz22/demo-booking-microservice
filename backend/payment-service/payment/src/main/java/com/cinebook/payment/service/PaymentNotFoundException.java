package com.cinebook.payment.service;

import com.cinebook.payment.exception.PaymentException;
import org.springframework.http.HttpStatus;

public class PaymentNotFoundException extends PaymentException {
    public PaymentNotFoundException() { super("PAYMENT_NOT_FOUND", "Không tìm thấy payment", HttpStatus.NOT_FOUND); }
}
