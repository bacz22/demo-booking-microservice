package com.cinebook.booking.client;

import com.cinebook.booking.client.dto.MovieSummaryDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Optional;
import java.util.UUID;

/**
 * Lấy tên phim/poster để lưu snapshot vào booking. Chỉ dùng cho hiển thị nên lỗi movie-service
 * KHÔNG làm hỏng việc giữ ghế: trả về empty và để snapshot thiếu tên phim (job backfill bổ sung sau).
 */
@Component
public class MovieServiceClient {
    private static final Logger log = LoggerFactory.getLogger(MovieServiceClient.class);

    private final RestClient restClient;

    public MovieServiceClient(RestClient movieRestClient) {
        this.restClient = movieRestClient;
    }

    // Spring Cache tự mở Optional: #result là MovieSummaryDto (null khi Optional rỗng) → không cache lần lỗi.
    @Cacheable(cacheNames = "movieSummaries", key = "#movieId", unless = "#result == null")
    public Optional<MovieSummaryDto> findMovie(UUID movieId) {
        try {
            return Optional.ofNullable(restClient.get().uri("/api/movies/{id}", movieId)
                .retrieve().body(MovieSummaryDto.class));
        } catch (RestClientException ex) {
            log.warn("Không lấy được thông tin phim {} từ movie-service: {}", movieId, ex.getMessage());
            return Optional.empty();
        }
    }
}
