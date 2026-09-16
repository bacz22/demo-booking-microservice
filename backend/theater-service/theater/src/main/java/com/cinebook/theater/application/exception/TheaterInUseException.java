package com.cinebook.theater.application.exception;

import java.util.UUID;

public class TheaterInUseException extends RuntimeException {

    private final UUID theaterId;

    public TheaterInUseException(UUID theaterId, String message) {
        super(message);
        this.theaterId = theaterId;
    }

    public UUID getTheaterId() {
        return theaterId;
    }
}
