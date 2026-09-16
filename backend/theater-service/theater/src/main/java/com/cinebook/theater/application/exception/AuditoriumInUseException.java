package com.cinebook.theater.application.exception;

import java.util.UUID;

public class AuditoriumInUseException extends RuntimeException {

    private final UUID auditoriumId;

    public AuditoriumInUseException(UUID auditoriumId, String message) {
        super(message);
        this.auditoriumId = auditoriumId;
    }

    public UUID getAuditoriumId() {
        return auditoriumId;
    }
}
