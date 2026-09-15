package com.cinebook.movie.api.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public record CreateMovieRequest(
    @NotBlank @Size(max = 255) String title,
    @Size(max = 255) String originalTitle,
    String description,
    @NotNull @Min(1) @Max(600) Integer durationMin,
    @NotBlank @Size(max = 10) String ageRating,
    LocalDate releaseDate,
    String posterUrl,
    String backdropUrl,
    String trailerUrl,
    @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal rating,
    @Size(max = 255) String director,
    String status,
    Set<@NotBlank @Size(max = 100) String> genres
) {
}
