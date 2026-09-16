package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.Theater;
import com.cinebook.theater.domain.model.TheaterStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TheaterResponse(
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
    Instant createdAt,
    Instant updatedAt
) {
    public static TheaterResponse from(Theater theater) {
        return new TheaterResponse(
            theater.getId(),
            theater.getName(),
            theater.getAddress(),
            theater.getCity(),
            theater.getHotline(),
            theater.getOpeningHours(),
            theater.getFeatures(),
            theater.getImageUrl(),
            theater.getStatus(),
            theater.getTotalRooms(),
            theater.getTotalSeats(),
            theater.getCreatedAt(),
            theater.getUpdatedAt()
        );
    }
}
