package com.cinebook.booking.controller.dto;

import java.time.Instant;
import java.util.UUID;

public record SeatStatusDto(UUID seatId, String rowLabel, int seatNumber, String seatType,
                            String displayName, String status, Long remainingSeconds) {}
