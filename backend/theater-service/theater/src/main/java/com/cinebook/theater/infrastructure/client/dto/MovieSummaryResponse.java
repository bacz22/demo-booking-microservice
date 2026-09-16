package com.cinebook.theater.infrastructure.client.dto;

import java.util.UUID;

public record MovieSummaryResponse(
    UUID id,
    String title,
    Integer durationMin,
    String ageRating,
    String status
) {
}
