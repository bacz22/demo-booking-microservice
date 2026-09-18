package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class ShowtimeNotSellingException extends BookingException { public ShowtimeNotSellingException() { super("SHOWTIME_NOT_SELLING", "Suất chiếu không mở bán", HttpStatus.CONFLICT); } }
