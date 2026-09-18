package com.cinebook.booking.client.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record TheaterSeatMapDto(
    UUID showtimeId, UUID auditoriumId, String auditoriumName, String format,
    Map<String, BigDecimal> prices, int totalSeats, List<TheaterSeatDto> seats
) {}
