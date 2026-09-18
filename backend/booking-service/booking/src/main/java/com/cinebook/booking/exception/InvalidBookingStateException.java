package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class InvalidBookingStateException extends BookingException { public InvalidBookingStateException(String m) { super("INVALID_BOOKING_STATE", m, HttpStatus.CONFLICT); } }
