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

import java.util.UUID;

@Component
public class TheaterServiceClient {
    private final RestClient restClient;

    public TheaterServiceClient(RestClient theaterRestClient) {
        this.restClient = theaterRestClient;
    }

    public TheaterShowtimeDto getShowtime(UUID showtimeId) {
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

    @Cacheable(cacheNames = "theaterSeatMaps", key = "#showtimeId")
    public TheaterSeatMapDto getSeatMap(UUID showtimeId) {
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
