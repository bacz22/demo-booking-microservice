package com.cinebook.theater;

import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.Showtime;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import com.cinebook.theater.domain.model.Theater;
import com.cinebook.theater.domain.model.TheaterStatus;
import com.cinebook.theater.infrastructure.repository.AuditoriumRepository;
import com.cinebook.theater.infrastructure.repository.SeatRepository;
import com.cinebook.theater.infrastructure.repository.ShowtimeRepository;
import com.cinebook.theater.infrastructure.repository.TheaterRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class RepositoryTest {

    @Autowired
    private TheaterRepository theaterRepository;

    @Autowired
    private AuditoriumRepository auditoriumRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Test
    @DisplayName("Kiểm tra dữ liệu seed từ Flyway V2 đã được ánh xạ chính xác qua JPA")
    void testSeedDataMappedProperly() {
        assertThat(theaterRepository.count()).isGreaterThanOrEqualTo(4);
        assertThat(auditoriumRepository.count()).isGreaterThanOrEqualTo(9);
        assertThat(seatRepository.count()).isGreaterThanOrEqualTo(675);

        List<Theater> hcmTheaters = theaterRepository.findByCityAndStatusOrderByNameAsc("Ho Chi Minh", TheaterStatus.ACTIVE);
        assertThat(hcmTheaters).hasSize(3);

        List<Theater> hnTheaters = theaterRepository.findByCityAndStatusOrderByNameAsc("Ha Noi", TheaterStatus.ACTIVE);
        assertThat(hnTheaters).hasSize(1);
    }

    @Test
    @DisplayName("Kiểm tra thuật toán phát hiện trùng lịch chiếu (Showtime Overlap)")
    void testShowtimeOverlapDetection() {
        Auditorium auditorium = auditoriumRepository.findAll().get(0);
        UUID auditoriumId = auditorium.getId();
        UUID dummyMovieId = UUID.randomUUID();

        // Tạo suất chiếu gốc: 14:00 -> 16:30
        Instant baseStart = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS).plus(14, ChronoUnit.HOURS);
        Instant baseEnd = baseStart.plus(150, ChronoUnit.MINUTES); // 16:30

        Showtime existing = new Showtime(
            auditorium,
            dummyMovieId,
            baseStart,
            baseEnd,
            135,
            15,
            new BigDecimal("90000"),
            new BigDecimal("110000"),
            new BigDecimal("180000"),
            ShowtimeStatus.SCHEDULED
        );
        existing = showtimeRepository.saveAndFlush(existing);
        UUID existingId = existing.getId();

        // Case A: Bắt đầu trước, kết thúc bên trong (13:00 -> 15:00) -> PHẢI TRÙNG
        Instant caseAStart = baseStart.minus(60, ChronoUnit.MINUTES);
        Instant caseAEnd = baseStart.plus(60, ChronoUnit.MINUTES);
        List<Showtime> overlapsA = showtimeRepository.findOverlappingShowtimes(auditoriumId, caseAStart, caseAEnd, null);
        assertThat(overlapsA).hasSize(1);

        // Case B: Bắt đầu bên trong, kết thúc sau (15:00 -> 17:30) -> PHẢI TRÙNG
        Instant caseBStart = baseStart.plus(60, ChronoUnit.MINUTES);
        Instant caseBEnd = baseEnd.plus(60, ChronoUnit.MINUTES);
        List<Showtime> overlapsB = showtimeRepository.findOverlappingShowtimes(auditoriumId, caseBStart, caseBEnd, null);
        assertThat(overlapsB).hasSize(1);

        // Case C: Nằm trọn bên trong (14:30 -> 15:30) -> PHẢI TRÙNG
        Instant caseCStart = baseStart.plus(30, ChronoUnit.MINUTES);
        Instant caseCEnd = baseStart.plus(90, ChronoUnit.MINUTES);
        List<Showtime> overlapsC = showtimeRepository.findOverlappingShowtimes(auditoriumId, caseCStart, caseCEnd, null);
        assertThat(overlapsC).hasSize(1);

        // Case D: Bao trùm toàn bộ (13:00 -> 17:30) -> PHẢI TRÙNG
        Instant caseDStart = baseStart.minus(60, ChronoUnit.MINUTES);
        Instant caseDEnd = baseEnd.plus(60, ChronoUnit.MINUTES);
        List<Showtime> overlapsD = showtimeRepository.findOverlappingShowtimes(auditoriumId, caseDStart, caseDEnd, null);
        assertThat(overlapsD).hasSize(1);

        // Case E: Liền kề sau (16:30 -> 18:30) -> KHÔNG TRÙNG
        Instant caseEStart = baseEnd;
        Instant caseEEnd = baseEnd.plus(120, ChronoUnit.MINUTES);
        List<Showtime> overlapsE = showtimeRepository.findOverlappingShowtimes(auditoriumId, caseEStart, caseEEnd, null);
        assertThat(overlapsE).isEmpty();

        // Case F: Liền kề trước (12:00 -> 14:00) -> KHÔNG TRÙNG
        Instant caseFStart = baseStart.minus(120, ChronoUnit.MINUTES);
        Instant caseFEnd = baseStart;
        List<Showtime> overlapsF = showtimeRepository.findOverlappingShowtimes(auditoriumId, caseFStart, caseFEnd, null);
        assertThat(overlapsF).isEmpty();

        // Case G: Khi cập nhật chính suất chiếu đó (excludeId = existingId) -> KHÔNG TỰ TRÙNG CHÍNH NÓ
        List<Showtime> overlapsG = showtimeRepository.findOverlappingShowtimes(auditoriumId, baseStart, baseEnd, existingId);
        assertThat(overlapsG).isEmpty();

        // Case H: Suất chiếu bị CANCELLED -> KHÔNG TÍNH TRÙNG
        existing.setStatus(ShowtimeStatus.CANCELLED);
        showtimeRepository.saveAndFlush(existing);
        List<Showtime> overlapsH = showtimeRepository.findOverlappingShowtimes(auditoriumId, baseStart, baseEnd, null);
        assertThat(overlapsH).isEmpty();
    }
}
