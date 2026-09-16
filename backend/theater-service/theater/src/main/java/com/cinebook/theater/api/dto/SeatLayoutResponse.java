package com.cinebook.theater.api.dto;

import java.util.List;
import java.util.UUID;

public record SeatLayoutResponse(
    UUID auditoriumId,
    String auditoriumName,
    int totalSeats,
    List<SeatResponse> seats
) {
}
