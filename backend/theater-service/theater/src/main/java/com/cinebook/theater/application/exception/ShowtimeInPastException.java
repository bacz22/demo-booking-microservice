package com.cinebook.theater.application.exception;

import java.time.Instant;

public class ShowtimeInPastException extends RuntimeException {

    private final Instant startTime;

    public ShowtimeInPastException(Instant startTime) {
        super("Thời gian bắt đầu suất chiếu (" + startTime + ") không được nằm trong quá khứ");
        this.startTime = startTime;
    }

    public Instant getStartTime() {
        return startTime;
    }
}
