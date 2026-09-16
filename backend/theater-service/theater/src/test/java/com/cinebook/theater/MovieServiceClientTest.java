package com.cinebook.theater;

import com.cinebook.theater.application.exception.MovieNotFoundException;
import com.cinebook.theater.application.exception.MovieServiceUnavailableException;
import com.cinebook.theater.infrastructure.client.MovieServiceClient;
import com.cinebook.theater.infrastructure.client.dto.MovieSummaryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class MovieServiceClientTest {

    private MockRestServiceServer mockServer;
    private MovieServiceClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:8081");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();
        client = new MovieServiceClient(restClient);
    }

    @Test
    @DisplayName("Lấy thông tin phim thành công từ movie-service khi API trả về 200 OK")
    void testGetMovieByIdSuccess() {
        UUID movieId = UUID.randomUUID();
        String jsonResponse = String.format("""
            {
                "id": "%s",
                "title": "Dune: Part Two",
                "durationMin": 166,
                "ageRating": "T13",
                "status": "NOW_SHOWING"
            }
        """, movieId);

        mockServer.expect(requestTo("http://localhost:8081/api/movies/" + movieId))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        Optional<MovieSummaryResponse> result = client.getMovieById(movieId);

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo(movieId);
        assertThat(result.get().title()).isEqualTo("Dune: Part Two");
        assertThat(result.get().durationMin()).isEqualTo(166);

        mockServer.verify();
    }

    @Test
    @DisplayName("validateAndGetMovie ném MovieNotFoundException khi movie-service trả 404")
    void testValidateAndGetMovieNotFound() {
        UUID movieId = UUID.randomUUID();

        mockServer.expect(requestTo("http://localhost:8081/api/movies/" + movieId))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> client.validateAndGetMovie(movieId))
            .isInstanceOf(MovieNotFoundException.class)
            .hasMessageContaining(movieId.toString());

        mockServer.verify();
    }

    @Test
    @DisplayName("validateAndGetMovie ném MovieServiceUnavailableException khi movie-service gặp lỗi 500")
    void testValidateAndGetMovieServerError() {
        UUID movieId = UUID.randomUUID();

        mockServer.expect(requestTo("http://localhost:8081/api/movies/" + movieId))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        assertThatThrownBy(() -> client.validateAndGetMovie(movieId))
            .isInstanceOf(MovieServiceUnavailableException.class)
            .hasMessageContaining("movie-service phản hồi lỗi");

        mockServer.verify();
    }
}
