package com.cinebook.booking.exception;

import java.time.Instant;

public record ApiError(String code, String message, String traceId, Instant timestamp, String path) {}
