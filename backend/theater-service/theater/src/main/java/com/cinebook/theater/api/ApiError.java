package com.cinebook.theater.api;

import java.time.Instant;

public record ApiError(
    String code,
    String message,
    String traceId,
    Instant timestamp,
    String path
) {
}
