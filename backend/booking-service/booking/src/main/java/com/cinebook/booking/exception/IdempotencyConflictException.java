package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class IdempotencyConflictException extends BookingException { public IdempotencyConflictException() { super("IDEMPOTENCY_CONFLICT", "Idempotency-Key đã được dùng với payload khác", HttpStatus.UNPROCESSABLE_ENTITY); } }
