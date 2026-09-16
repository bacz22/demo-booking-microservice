package com.cinebook.theater.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ShowtimeSeatMapResponse(
    UUID showtimeId,
    UUID auditoriumId,
    String auditoriumName,
    String format,
    Map<String, BigDecimal> prices,
    int totalSeats,
    List<SeatResponse> seats
) {
}
