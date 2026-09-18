package com.cinebook.booking.client.dto;

import java.util.UUID;

public record TheaterSeatDto(
    UUID id, UUID auditoriumId, String rowLabel, int seatNumber, String seatType, String displayName
) {}
