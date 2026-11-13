package com.cinebook.theater.application;

import com.cinebook.theater.api.dto.ShowtimeCreateRequest;
import com.cinebook.theater.api.dto.ShowtimeResponse;
import com.cinebook.theater.domain.model.AuditoriumStatus;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.infrastructure.client.MovieServiceClient;
import com.cinebook.theater.infrastructure.client.dto.MovieSummaryResponse;
import com.cinebook.theater.infrastructure.repository.AuditoriumRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Dữ liệu demo: đảm bảo luôn có suất chiếu đang mở bán trong N ngày tới, để clone repo về
 * là đặt vé được ngay. Chỉ tạo cho ngày/phòng chưa có suất nào nên chạy lại nhiều lần vẫn an toàn.
 * Dùng ShowtimeService (kiểm tra phim, trùng lịch) thay vì ghi SQL trực tiếp.
 */
@Component
@ConditionalOnProperty(name = "app.demo-seed.enabled", havingValue = "true")
public class DemoShowtimeSeeder {
    private static final Logger log = LoggerFactory.getLogger(DemoShowtimeSeeder.class);
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final List<LocalTime> SLOTS = List.of(
        LocalTime.of(9, 30), LocalTime.of(13, 0), LocalTime.of(16, 30), LocalTime.of(20, 0));

    private final ShowtimeService showtimes;
    private final AuditoriumRepository auditoriums;
    private final MovieServiceClient movies;
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final int days;
    private final int maxAuditoriums;

    public DemoShowtimeSeeder(ShowtimeService showtimes, AuditoriumRepository auditoriums, MovieServiceClient movies,
                              JdbcTemplate jdbc,
                              @Value("${app.demo-seed.days:7}") int days,
                              @Value("${app.demo-seed.max-auditoriums:6}") int maxAuditoriums) {
        this.showtimes = showtimes;
        this.auditoriums = auditoriums;
        this.movies = movies;
        this.jdbc = jdbc;
        this.clock = Clock.system(ZONE);
        this.days = days;
        this.maxAuditoriums = maxAuditoriums;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        Thread.ofVirtual().name("demo-showtime-seeder").start(() -> {
            try {
                int created = seed();
                if (created > 0) log.info("Demo seed: đã tạo {} suất chiếu cho {} ngày tới", created, days);
            } catch (RuntimeException ex) {
                log.warn("Demo seed suất chiếu thất bại: {}", ex.getMessage());
            }
        });
    }

    public int seed() {
        List<MovieSummaryResponse> nowShowing = movies.listNowShowing(20);
        if (nowShowing.isEmpty()) {
            log.warn("Demo seed: movie-service chưa có phim NOW_SHOWING, bỏ qua");
            return 0;
        }
        List<Auditorium> rooms = auditoriums.findAll().stream()
            .filter(a -> a.getStatus() == AuditoriumStatus.ACTIVE)
            .limit(maxAuditoriums)
            .toList();

        Instant earliest = Instant.now(clock).plus(30, ChronoUnit.MINUTES);
        int created = 0;
        int movieIndex = 0;
        for (int d = 0; d < days; d++) {
            LocalDate day = LocalDate.now(clock).plusDays(d);
            for (Auditorium room : rooms) {
                if (hasShowtimeOn(room.getId(), day)) continue;
                for (LocalTime slot : SLOTS) {
                    Instant start = day.atTime(slot).atZone(ZONE).toInstant();
                    if (start.isBefore(earliest)) continue;
                    MovieSummaryResponse movie = nowShowing.get(movieIndex++ % nowShowing.size());
                    try {
                        ShowtimeResponse s = showtimes.createShowtime(new ShowtimeCreateRequest(
                            room.getId(), movie.id(), start, 15, null, null, null));
                        showtimes.updateStatus(s.id(), ShowtimeStatus.SELLING);
                        created++;
                    } catch (RuntimeException ex) {
                        // Trùng lịch (phim dài hơn khoảng cách giữa 2 suất) hoặc phim không hợp lệ: bỏ qua suất này
                        log.debug("Demo seed bỏ qua {} {} {}: {}", room.getName(), day, slot, ex.getMessage());
                    }
                }
            }
        }
        return created;
    }

    private boolean hasShowtimeOn(UUID auditoriumId, LocalDate day) {
        Integer count = jdbc.queryForObject(
            "SELECT count(*) FROM showtimes WHERE auditorium_id = ? AND start_time >= ? AND start_time < ?",
            Integer.class, auditoriumId,
            Timestamp.from(day.atStartOfDay(ZONE).toInstant()),
            Timestamp.from(day.plusDays(1).atStartOfDay(ZONE).toInstant()));
        return count != null && count > 0;
    }
}
