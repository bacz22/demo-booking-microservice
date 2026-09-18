package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class TheaterServiceUnavailableException extends BookingException { public TheaterServiceUnavailableException(String m) { super("THEATER_SERVICE_UNAVAILABLE", m, HttpStatus.SERVICE_UNAVAILABLE); } }
