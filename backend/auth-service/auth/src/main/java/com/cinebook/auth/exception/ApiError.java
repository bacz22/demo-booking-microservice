package com.cinebook.auth.exception;

import java.time.Instant;

public record ApiError(String code, String message, String correlationId, Instant timestamp, String path) {
}
