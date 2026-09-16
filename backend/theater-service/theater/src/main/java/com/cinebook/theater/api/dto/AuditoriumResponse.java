package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.AuditoriumFormat;
import com.cinebook.theater.domain.model.AuditoriumStatus;

import java.time.Instant;
import java.util.UUID;

public record AuditoriumResponse(
    UUID id,
    UUID theaterId,
    String name,
    AuditoriumFormat format,
    int totalSeats,
    AuditoriumStatus status,
    Instant createdAt,
    Instant updatedAt
) {
    public static AuditoriumResponse from(Auditorium auditorium) {
        return new AuditoriumResponse(
            auditorium.getId(),
            auditorium.getTheater() != null ? auditorium.getTheater().getId() : null,
            auditorium.getName(),
            auditorium.getFormat(),
            auditorium.getTotalSeats(),
            auditorium.getStatus(),
            auditorium.getCreatedAt(),
            auditorium.getUpdatedAt()
        );
    }
}
