package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class BadRequestException extends BookingException { public BadRequestException(String m) { super("BAD_REQUEST", m, HttpStatus.BAD_REQUEST); } }
