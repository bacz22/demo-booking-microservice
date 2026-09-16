package com.cinebook.theater.application.exception;

import java.util.UUID;

public class TheaterNotFoundException extends RuntimeException {

    private final UUID theaterId;

    public TheaterNotFoundException(UUID theaterId) {
        super("Không tìm thấy cụm rạp với mã ID: " + theaterId);
        this.theaterId = theaterId;
    }

    public UUID getTheaterId() {
        return theaterId;
    }
}
