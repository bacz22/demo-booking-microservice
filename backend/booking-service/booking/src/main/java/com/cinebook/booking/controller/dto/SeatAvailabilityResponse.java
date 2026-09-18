package com.cinebook.booking.controller.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SeatAvailabilityResponse(UUID showtimeId, Instant serverTime, List<SeatStatusDto> seats) {}
