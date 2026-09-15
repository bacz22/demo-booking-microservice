package com.cinebook.movie.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MovieResponse(
    UUID id,
    String title,
    String originalTitle,
    String description,
    Integer durationMin,
    String ageRating,
    LocalDate releaseDate,
    String posterUrl,
    String backdropUrl,
    String trailerUrl,
    BigDecimal rating,
    String director,
    String status,
    List<String> genres,
    Instant createdAt
) {
}
