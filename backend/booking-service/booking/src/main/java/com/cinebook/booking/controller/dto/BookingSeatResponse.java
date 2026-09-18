package com.cinebook.booking.controller.dto;

import com.cinebook.booking.domain.entity.BookingSeat;

import java.math.BigDecimal;
import java.util.UUID;

public record BookingSeatResponse(UUID seatId, String rowLabel, int seatNumber, String seatType,
                                  BigDecimal price, String status) {
    public static BookingSeatResponse from(BookingSeat seat) {
        return new BookingSeatResponse(seat.getSeatId(), seat.getRowLabel(), seat.getSeatNumber(),
            seat.getSeatType(), seat.getPrice(), seat.getStatus().name());
    }
}
