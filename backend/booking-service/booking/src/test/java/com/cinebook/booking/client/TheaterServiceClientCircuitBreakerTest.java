package com.cinebook.booking.client;

import com.cinebook.booking.exception.TheaterServiceUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TheaterServiceClientCircuitBreakerTest {

    @Test
    void circuitOpensAfterRepeatedConnectionFailures() {
        // Port 1 không có service → connection refused ngay
        TheaterServiceClient client = new TheaterServiceClient(RestClient.builder().baseUrl("http://localhost:1").build());

        for (int i = 0; i < 5; i++) {
            TheaterServiceUnavailableException ex = assertThrows(TheaterServiceUnavailableException.class,
                () -> client.getShowtime(UUID.randomUUID()));
            assertTrue(ex.getMessage().contains("kết nối"), ex.getMessage());
        }

        TheaterServiceUnavailableException open = assertThrows(TheaterServiceUnavailableException.class,
            () -> client.getShowtime(UUID.randomUUID()));
        assertTrue(open.getMessage().contains("circuit breaker"), open.getMessage());
    }
}
