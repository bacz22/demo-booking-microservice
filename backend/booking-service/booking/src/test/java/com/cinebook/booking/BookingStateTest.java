package com.cinebook.booking;

import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.domain.enums.BookingStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BookingStateTest {
    @Test
    void bookingTransitionsKeepFinalStateAndTimestamps() {
        Instant now = Instant.parse("2026-09-17T08:00:00Z");
        Booking booking = new Booking(UUID.randomUUID(), "CB-00000001", UUID.randomUUID(), "hash",
            UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
            BigDecimal.ZERO, now.plusSeconds(300), now);

        booking.confirm(now.plusSeconds(1));
        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());
        assertEquals(now.plusSeconds(1), booking.getConfirmedAt());
    }
}
