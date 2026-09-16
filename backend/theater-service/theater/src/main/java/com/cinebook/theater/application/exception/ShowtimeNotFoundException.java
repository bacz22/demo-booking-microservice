package com.cinebook.theater.application.exception;

import java.util.UUID;

public class ShowtimeNotFoundException extends RuntimeException {

    private final UUID showtimeId;

    public ShowtimeNotFoundException(UUID showtimeId) {
        super("Không tìm thấy suất chiếu với mã ID: " + showtimeId);
        this.showtimeId = showtimeId;
    }

    public UUID getShowtimeId() {
        return showtimeId;
    }
}
