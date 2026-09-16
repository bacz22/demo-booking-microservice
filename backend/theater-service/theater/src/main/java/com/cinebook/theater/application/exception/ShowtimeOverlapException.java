package com.cinebook.theater.application.exception;

import java.time.Instant;
import java.util.UUID;

public class ShowtimeOverlapException extends RuntimeException {

    private final UUID auditoriumId;
    private final Instant startTime;
    private final Instant endTime;

    public ShowtimeOverlapException(UUID auditoriumId, Instant startTime, Instant endTime) {
        super(String.format("Phòng chiếu %s đã có suất chiếu khác trong khoảng thời gian từ %s đến %s",
            auditoriumId, startTime, endTime));
        this.auditoriumId = auditoriumId;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public UUID getAuditoriumId() {
        return auditoriumId;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }
}
