package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class IdempotencyInProgressException extends BookingException { public IdempotencyInProgressException() { super("IDEMPOTENCY_IN_PROGRESS", "Request cùng Idempotency-Key đang được xử lý", HttpStatus.CONFLICT); } }
