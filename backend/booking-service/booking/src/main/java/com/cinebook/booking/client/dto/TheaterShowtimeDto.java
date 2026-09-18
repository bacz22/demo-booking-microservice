package com.cinebook.booking.client.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TheaterShowtimeDto(
    UUID id, UUID auditoriumId, String auditoriumName, String auditoriumFormat,
    UUID theaterId, String theaterName, String theaterAddress, String theaterCity,
    UUID movieId, Instant startTime, Instant endTime, int movieDurationMin,
    int cleaningDurationMin, BigDecimal priceStandard, BigDecimal priceVip,
    BigDecimal priceCouple, String status, Instant createdAt, Instant updatedAt
) {}
