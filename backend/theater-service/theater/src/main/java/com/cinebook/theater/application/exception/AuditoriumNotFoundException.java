package com.cinebook.theater.application.exception;

import java.util.UUID;

public class AuditoriumNotFoundException extends RuntimeException {

    private final UUID auditoriumId;

    public AuditoriumNotFoundException(UUID auditoriumId) {
        super("Không tìm thấy phòng chiếu với mã ID: " + auditoriumId);
        this.auditoriumId = auditoriumId;
    }

    public UUID getAuditoriumId() {
        return auditoriumId;
    }
}
