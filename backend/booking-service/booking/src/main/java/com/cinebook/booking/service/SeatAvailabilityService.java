package com.cinebook.booking.service;

import com.cinebook.booking.client.TheaterServiceClient;
import com.cinebook.booking.client.dto.TheaterSeatDto;
import com.cinebook.booking.controller.dto.SeatAvailabilityResponse;
import com.cinebook.booking.controller.dto.SeatStatusDto;
import com.cinebook.booking.repository.BookingSeatRepository;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SeatAvailabilityService {
    private final TheaterServiceClient theater;
    private final BookingSeatRepository seats;

    public SeatAvailabilityService(TheaterServiceClient theater, BookingSeatRepository seats) {
        this.theater = theater;
        this.seats = seats;
    }

    public SeatAvailabilityResponse get(UUID showtimeId, UUID userId) {
        Instant now = Instant.now();
        Map<UUID, ActiveState> active = new HashMap<>();
        for (Object[] row : seats.findActiveSeatStates(showtimeId)) {
            UUID seatId = (UUID) row[0];
            String status = String.valueOf(row[1]);
            UUID owner = (UUID) row[2];
            Instant expiresAt = toInstant(row[3]);
            active.put(seatId, new ActiveState(status, owner, expiresAt));
        }
        List<SeatStatusDto> result = theater.getSeatMap(showtimeId).seats().stream()
            .map(seat -> toResponse(seat, active.get(seat.id()), userId, now)).toList();
        return new SeatAvailabilityResponse(showtimeId, now, result);
    }

    private SeatStatusDto toResponse(TheaterSeatDto seat, ActiveState state, UUID userId, Instant now) {
        if (state == null) return new SeatStatusDto(seat.id(), seat.rowLabel(), seat.seatNumber(), seat.seatType(), seat.displayName(), "AVAILABLE", null);
        if ("SOLD".equals(state.status())) return new SeatStatusDto(seat.id(), seat.rowLabel(), seat.seatNumber(), seat.seatType(), seat.displayName(), "SOLD", null);
        if (!state.expiresAt().isAfter(now)) {
            return new SeatStatusDto(seat.id(), seat.rowLabel(), seat.seatNumber(), seat.seatType(), seat.displayName(), "AVAILABLE", null);
        }
        long remaining = Math.max(1, Duration.between(now, state.expiresAt()).getSeconds());
        boolean mine = userId != null && userId.equals(state.owner());
        return new SeatStatusDto(seat.id(), seat.rowLabel(), seat.seatNumber(), seat.seatType(), seat.displayName(), mine ? "HELD_BY_ME" : "HELD", mine ? remaining : null);
    }

    private Instant toInstant(Object value) {
        if (value instanceof Instant instant) return instant;
        if (value instanceof Timestamp timestamp) return timestamp.toInstant();
        if (value instanceof java.time.OffsetDateTime dateTime) return dateTime.toInstant();
        return Instant.parse(String.valueOf(value));
    }
    private record ActiveState(String status, UUID owner, Instant expiresAt) {}
}
