package com.cinebook.payment.exception;

import org.springframework.http.HttpStatus;

public class PaymentAccessDeniedException extends PaymentException {
    public PaymentAccessDeniedException() { super("FORBIDDEN_ACCESS", "Bạn không có quyền truy cập payment này", HttpStatus.FORBIDDEN); }
}
