package com.cinebook.booking.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BookingServiceHashTest {
    @Test
    void requestHashIsStableRegardlessOfSeatOrder() {
        UUID user = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID showtime = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        UUID first = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID second = UUID.fromString("22222222-2222-2222-2222-222222222222");

        assertEquals(BookingService.hash(user, showtime, List.of(first, second)),
            BookingService.hash(user, showtime, List.of(second, first)));
    }
}
