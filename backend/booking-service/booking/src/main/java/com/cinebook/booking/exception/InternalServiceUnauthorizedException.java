package com.cinebook.booking.exception;

import org.springframework.http.HttpStatus;

public class InternalServiceUnauthorizedException extends BookingException {
    public InternalServiceUnauthorizedException() {
        super("INTERNAL_SERVICE_UNAUTHORIZED", "Service key không hợp lệ", HttpStatus.UNAUTHORIZED);
    }
}
