package com.cinebook.booking.service;

import com.cinebook.booking.client.MovieServiceClient;
import com.cinebook.booking.client.TheaterServiceClient;
import com.cinebook.booking.client.dto.MovieSummaryDto;
import com.cinebook.booking.client.dto.TheaterShowtimeDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Điền snapshot (tên phim/rạp/giờ chiếu) cho booking tạo trước khi có cột snapshot,
 * hoặc khi movie-service lỗi lúc giữ ghế. Chạy nền một lần sau khi service khởi động;
 * lỗi gọi service khác chỉ bỏ qua suất chiếu đó, lần khởi động sau sẽ thử lại.
 */
@Component
@ConditionalOnProperty(name = "booking.snapshot-backfill.enabled", havingValue = "true", matchIfMissing = true)
public class BookingSnapshotBackfill {
    private static final Logger log = LoggerFactory.getLogger(BookingSnapshotBackfill.class);
    private static final int MAX_SHOWTIMES = 500;

    private record Target(UUID showtimeId, UUID movieId) {}

    private final JdbcTemplate jdbc;
    private final TheaterServiceClient theater;
    private final MovieServiceClient movies;

    public BookingSnapshotBackfill(JdbcTemplate jdbc, TheaterServiceClient theater, MovieServiceClient movies) {
        this.jdbc = jdbc;
        this.theater = theater;
        this.movies = movies;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        Thread.ofVirtual().name("booking-snapshot-backfill").start(this::run);
    }

    void run() {
        List<Target> targets = jdbc.query("""
            SELECT DISTINCT showtime_id, movie_id FROM bookings
             WHERE movie_title IS NULL OR showtime_start IS NULL
             LIMIT ?
            """, (rs, i) -> new Target(rs.getObject("showtime_id", UUID.class), rs.getObject("movie_id", UUID.class)),
            MAX_SHOWTIMES);
        if (targets.isEmpty()) return;

        int updated = 0;
        for (Target t : targets) {
            try {
                TheaterShowtimeDto showtime = theater.getShowtime(t.showtimeId());
                Optional<MovieSummaryDto> movie = movies.findMovie(t.movieId());
                updated += jdbc.update("""
                    UPDATE bookings SET
                        movie_title     = coalesce(movie_title, ?),
                        poster_url      = coalesce(poster_url, ?),
                        theater_name    = coalesce(theater_name, ?),
                        theater_city    = coalesce(theater_city, ?),
                        auditorium_name = coalesce(auditorium_name, ?),
                        showtime_start  = coalesce(showtime_start, ?),
                        showtime_end    = coalesce(showtime_end, ?)
                     WHERE showtime_id = ? AND (movie_title IS NULL OR showtime_start IS NULL)
                    """, movie.map(MovieSummaryDto::title).orElse(null), movie.map(MovieSummaryDto::posterUrl).orElse(null),
                    showtime.theaterName(), showtime.theaterCity(), showtime.auditoriumName(),
                    Timestamp.from(showtime.startTime()), Timestamp.from(showtime.endTime()), t.showtimeId());
            } catch (RuntimeException ex) {
                log.warn("Bỏ qua backfill snapshot cho suất chiếu {}: {}", t.showtimeId(), ex.getMessage());
            }
        }
        log.info("Snapshot backfill: cập nhật {} booking từ {} suất chiếu", updated, targets.size());
    }
}
