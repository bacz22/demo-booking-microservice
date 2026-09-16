package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.Seat;
import com.cinebook.theater.domain.model.SeatType;

import java.util.UUID;

public record SeatResponse(
    UUID id,
    UUID auditoriumId,
    String rowLabel,
    int seatNumber,
    SeatType seatType,
    String displayName
) {
    public static SeatResponse from(Seat seat) {
        return new SeatResponse(
            seat.getId(),
            seat.getAuditorium() != null ? seat.getAuditorium().getId() : null,
            seat.getRowLabel(),
            seat.getSeatNumber(),
            seat.getSeatType(),
            seat.getDisplayName()
        );
    }
}
