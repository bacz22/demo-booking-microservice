package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class BookingExpiredException extends BookingException { public BookingExpiredException() { super("BOOKING_EXPIRED", "Booking đã hết hạn", HttpStatus.GONE); } }
