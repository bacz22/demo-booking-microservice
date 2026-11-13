package com.cinebook.theater.infrastructure.client;

import com.cinebook.theater.application.exception.MovieNotFoundException;
import com.cinebook.theater.application.exception.MovieServiceUnavailableException;
import com.cinebook.theater.infrastructure.client.dto.MovieSummaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.Optional;
import java.util.UUID;

@Component
public class MovieServiceClient {

    private static final Logger log = LoggerFactory.getLogger(MovieServiceClient.class);

    private final RestClient restClient;

    public MovieServiceClient(@Qualifier("movieServiceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public Optional<MovieSummaryResponse> getMovieById(UUID movieId) {
        if (movieId == null) {
            return Optional.empty();
        }

        try {
            MovieSummaryResponse response = restClient.get()
                .uri("/api/movies/{id}", movieId)
                .retrieve()
                .onStatus(status -> status.value() == 404, (req, res) -> {
                    log.warn("Movie not found on movie-service with ID: {}", movieId);
                    throw new MovieNotFoundException(movieId);
                })
                .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                    log.error("movie-service returned 5xx server error for ID: {}", movieId);
                    throw new MovieServiceUnavailableException("movie-service phản hồi lỗi nội bộ khi truy vấn phim");
                })
                .body(MovieSummaryResponse.class);

            return Optional.ofNullable(response);
        } catch (MovieNotFoundException e) {
            return Optional.empty();
        } catch (MovieServiceUnavailableException e) {
            throw e;
        } catch (ResourceAccessException e) {
            log.error("Cannot connect to movie-service: {}", e.getMessage());
            throw new MovieServiceUnavailableException("Không thể kết nối tới dịch vụ movie-service", e);
        } catch (Exception e) {
            log.error("Unexpected error while calling movie-service for ID {}: {}", movieId, e.getMessage(), e);
            throw new MovieServiceUnavailableException("Lỗi không xác định khi gọi movie-service: " + e.getMessage(), e);
        }
    }

    public MovieSummaryResponse validateAndGetMovie(UUID movieId) {
        if (movieId == null) {
            throw new IllegalArgumentException("Mã phim (movieId) không được để trống");
        }

        MovieSummaryResponse movie = getMovieById(movieId)
            .orElseThrow(() -> new MovieNotFoundException(movieId));

        if (movie.durationMin() == null || movie.durationMin() <= 0) {
            throw new IllegalArgumentException("Thời lượng của phim không hợp lệ: " + movie.durationMin());
        }

        return movie;
    }

    /** Trang phim của movie-service (chỉ cần content). */
    public record MoviePage(java.util.List<MovieSummaryResponse> content) {}

    /** Danh sách phim đang chiếu, dùng cho dữ liệu demo. Lỗi kết nối trả danh sách rỗng. */
    public java.util.List<MovieSummaryResponse> listNowShowing(int limit) {
        try {
            MoviePage page = restClient.get()
                .uri(uri -> uri.path("/api/movies").queryParam("status", "NOW_SHOWING").queryParam("size", limit).build())
                .retrieve().body(MoviePage.class);
            return page == null || page.content() == null ? java.util.List.of() : page.content();
        } catch (Exception e) {
            log.warn("Không lấy được danh sách phim đang chiếu: {}", e.getMessage());
            return java.util.List.of();
        }
    }
}
