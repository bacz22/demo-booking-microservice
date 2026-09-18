package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class SeatAlreadyHeldException extends BookingException { public SeatAlreadyHeldException() { super("SEAT_ALREADY_HELD", "Một hoặc nhiều ghế đang được giữ bởi người khác", HttpStatus.CONFLICT); } }
