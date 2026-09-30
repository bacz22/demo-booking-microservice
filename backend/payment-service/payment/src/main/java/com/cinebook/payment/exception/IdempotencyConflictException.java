package com.cinebook.payment.exception;

import org.springframework.http.HttpStatus;

public class IdempotencyConflictException extends PaymentException {
    public IdempotencyConflictException() { super("IDEMPOTENCY_CONFLICT", "Idempotency-Key đã được dùng với payload khác", HttpStatus.UNPROCESSABLE_ENTITY); }
}
