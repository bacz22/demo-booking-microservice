package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.Theater;
import com.cinebook.theater.domain.model.TheaterStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TheaterDetailResponse(
    UUID id,
    String name,
    String address,
    String city,
    String hotline,
    String openingHours,
    List<String> features,
    String imageUrl,
    TheaterStatus status,
    int totalRooms,
    int totalSeats,
    List<AuditoriumResponse> auditoriums,
    Instant createdAt,
    Instant updatedAt
) {
    public static TheaterDetailResponse from(Theater theater) {
        return of(theater, theater.getAuditoriums());
    }

    public static TheaterDetailResponse of(Theater theater, List<Auditorium> auditoriums) {
        List<AuditoriumResponse> auditoriumResponses = auditoriums != null
            ? auditoriums.stream().map(AuditoriumResponse::from).toList()
            : List.of();
        int totalRooms = auditoriums != null ? auditoriums.size() : 0;
        int totalSeats = auditoriums != null ? auditoriums.stream().mapToInt(Auditorium::getTotalSeats).sum() : 0;

        return new TheaterDetailResponse(
            theater.getId(),
            theater.getName(),
            theater.getAddress(),
            theater.getCity(),
            theater.getHotline(),
            theater.getOpeningHours(),
            theater.getFeatures(),
            theater.getImageUrl(),
            theater.getStatus(),
            totalRooms,
            totalSeats,
            auditoriumResponses,
            theater.getCreatedAt(),
            theater.getUpdatedAt()
        );
    }
}
