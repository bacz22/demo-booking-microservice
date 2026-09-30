package com.cinebook.booking.exception;

import org.springframework.http.HttpStatus;

public class ShowtimeNotFoundException extends BookingException {
    public ShowtimeNotFoundException() {
        super("SHOWTIME_NOT_FOUND", "Không tìm thấy suất chiếu", HttpStatus.NOT_FOUND);
    }
}
