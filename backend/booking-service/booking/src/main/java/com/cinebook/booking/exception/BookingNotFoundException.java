package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class BookingNotFoundException extends BookingException { public BookingNotFoundException() { super("BOOKING_NOT_FOUND", "Không tìm thấy booking", HttpStatus.NOT_FOUND); } }
