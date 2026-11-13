package com.cinebook.theater;

import com.cinebook.theater.application.DemoShowtimeSeeder;
import com.cinebook.theater.application.ShowtimeService;
import com.cinebook.theater.infrastructure.client.MovieServiceClient;
import com.cinebook.theater.infrastructure.client.dto.MovieSummaryResponse;
import com.cinebook.theater.infrastructure.repository.AuditoriumRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = "app.security.gateway-secret=")
class DemoShowtimeSeederTest extends PostgresIntegrationTest {
    private static final UUID MOVIE_A = UUID.randomUUID();
    private static final UUID MOVIE_B = UUID.randomUUID();

    @Autowired ShowtimeService service;
    @Autowired AuditoriumRepository auditoriumRepository;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean MovieServiceClient movies;

    private DemoShowtimeSeeder seeder;

    @BeforeEach
    void setUp() {
        jdbc.update("DELETE FROM showtimes");
        List<MovieSummaryResponse> nowShowing = List.of(
            new MovieSummaryResponse(MOVIE_A, "Phim A", 120, "P", "NOW_SHOWING"),
            new MovieSummaryResponse(MOVIE_B, "Phim B", 100, "T13", "NOW_SHOWING"));
        when(movies.listNowShowing(any(Integer.class))).thenReturn(nowShowing);
        when(movies.validateAndGetMovie(any())).thenAnswer(inv -> nowShowing.stream()
            .filter(m -> m.id().equals(inv.getArgument(0))).findFirst().orElseThrow());

        seeder = new DemoShowtimeSeeder(service, auditoriumRepository, movies, jdbc, 3, 2);
    }

    /** Container Postgres dùng chung với các test khác: xoá suất chiếu đã commit. */
    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM showtimes");
    }

    @Test
    void createsSellingShowtimesForUpcomingDays_andIsIdempotent() {
        int created = seeder.seed();

        assertTrue(created > 0, "phải tạo được suất chiếu");
        assertEquals(created, jdbc.queryForObject(
            "SELECT count(*) FROM showtimes WHERE status = 'SELLING' AND start_time > now()", Integer.class));
        assertEquals(2, jdbc.queryForObject("SELECT count(DISTINCT auditorium_id) FROM showtimes", Integer.class));

        assertEquals(0, seeder.seed(), "chạy lại không được tạo trùng");
    }
}
