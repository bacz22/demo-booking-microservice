package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class SeatNotFoundException extends BookingException { public SeatNotFoundException() { super("SEAT_NOT_FOUND", "Ghế không thuộc phòng chiếu của suất chiếu", HttpStatus.BAD_REQUEST); } }
