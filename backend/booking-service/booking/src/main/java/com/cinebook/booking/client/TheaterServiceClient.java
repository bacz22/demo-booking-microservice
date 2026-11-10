package com.cinebook.booking.client;

import com.cinebook.booking.client.dto.TheaterSeatMapDto;
import com.cinebook.booking.client.dto.TheaterShowtimeDto;
import com.cinebook.booking.exception.TheaterServiceUnavailableException;
import com.cinebook.booking.exception.ShowtimeNotFoundException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;

import java.time.Duration;
import java.util.UUID;
import java.util.function.Supplier;

@Component
public class TheaterServiceClient {
    private final RestClient restClient;
    private final CircuitBreaker circuitBreaker;

    public TheaterServiceClient(RestClient theaterRestClient) {
        this.restClient = theaterRestClient;
        // Chỉ lỗi hạ tầng (theater down/5xx/timeout) mới tính vào circuit; 404 là lỗi nghiệp vụ.
        this.circuitBreaker = CircuitBreaker.of("theater-service", CircuitBreakerConfig.custom()
            .slidingWindowSize(10)
            .minimumNumberOfCalls(5)
            .failureRateThreshold(50)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .permittedNumberOfCallsInHalfOpenState(2)
            .recordExceptions(TheaterServiceUnavailableException.class)
            .build());
    }

    public TheaterShowtimeDto getShowtime(UUID showtimeId) {
        return protect(() -> fetchShowtime(showtimeId));
    }

    @Cacheable(cacheNames = "theaterSeatMaps", key = "#showtimeId")
    public TheaterSeatMapDto getSeatMap(UUID showtimeId) {
        return protect(() -> fetchSeatMap(showtimeId));
    }

    /** Circuit đang mở → báo lỗi ngay (503) thay vì chờ timeout từng request. */
    private <T> T protect(Supplier<T> call) {
        try {
            return circuitBreaker.executeSupplier(call);
        } catch (CallNotPermittedException ex) {
            throw new TheaterServiceUnavailableException("theater-service đang tạm ngắt (circuit breaker mở)");
        }
    }

    private TheaterShowtimeDto fetchShowtime(UUID showtimeId) {
        try {
            TheaterShowtimeDto result = restClient.get().uri("/api/showtimes/{id}", showtimeId)
                .retrieve().body(TheaterShowtimeDto.class);
            if (result == null) throw new TheaterServiceUnavailableException("Theater trả về response rỗng");
            return result;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().equals(HttpStatusCode.valueOf(404))) {
                throw new ShowtimeNotFoundException();
            }
            throw new TheaterServiceUnavailableException("Theater service trả về HTTP " + ex.getStatusCode().value());
        } catch (ResourceAccessException ex) {
            throw new TheaterServiceUnavailableException("Không thể kết nối theater-service");
        }
    }

    private TheaterSeatMapDto fetchSeatMap(UUID showtimeId) {
        try {
            TheaterSeatMapDto result = restClient.get().uri("/api/showtimes/{id}/seats", showtimeId)
                .retrieve().body(TheaterSeatMapDto.class);
            if (result == null) throw new TheaterServiceUnavailableException("Theater trả về seat map rỗng");
            return result;
        } catch (RestClientResponseException | ResourceAccessException ex) {
            throw new TheaterServiceUnavailableException("Không thể tải seat map từ theater-service");
        }
    }
}
