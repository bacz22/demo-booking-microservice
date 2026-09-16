package com.cinebook.theater;

import com.cinebook.theater.application.ShowtimeScheduleValidator;
import com.cinebook.theater.application.exception.ShowtimeInPastException;
import com.cinebook.theater.application.exception.ShowtimeOverlapException;
import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.Showtime;
import com.cinebook.theater.infrastructure.repository.ShowtimeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShowtimeScheduleValidatorTest {

    @Mock
    private ShowtimeRepository showtimeRepository;

    private ShowtimeScheduleValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ShowtimeScheduleValidator(showtimeRepository);
    }

    @Test
    @DisplayName("Tính toán endTime chính xác bằng startTime + durationMin + cleaningDurationMin")
    void testCalculateEndTimeSuccess() {
        Instant startTime = Instant.parse("2026-09-20T14:00:00Z");
        Instant endTime = validator.calculateEndTime(startTime, 120, 15);

        // 120 + 15 = 135 phút -> 16:15:00Z
        assertThat(endTime).isEqualTo(Instant.parse("2026-09-20T16:15:00Z"));
    }

    @Test
    @DisplayName("Ném ngoại lệ khi thời lượng phim không hợp lệ (<= 0)")
    void testCalculateEndTimeInvalidDuration() {
        Instant startTime = Instant.now();
        assertThatThrownBy(() -> validator.calculateEndTime(startTime, 0, 15))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("lớn hơn 0");
    }

    @Test
    @DisplayName("Chặn tạo suất chiếu có thời gian bắt đầu trong quá khứ")
    void testValidateTimingRejectsPastStartTime() {
        Instant pastStart = Instant.now().minus(2, ChronoUnit.HOURS);
        Instant futureEnd = Instant.now().plus(1, ChronoUnit.HOURS);

        assertThatThrownBy(() -> validator.validateTiming(pastStart, futureEnd))
            .isInstanceOf(ShowtimeInPastException.class)
            .hasMessageContaining("quá khứ");
    }

    @Test
    @DisplayName("Chặn tạo suất chiếu có endTime trước hoặc bằng startTime")
    void testValidateTimingRejectsInvalidEndTime() {
        Instant start = Instant.now().plus(2, ChronoUnit.HOURS);
        Instant end = start.minus(10, ChronoUnit.MINUTES);

        assertThatThrownBy(() -> validator.validateTiming(start, end))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("phải sau");
    }

    @Test
    @DisplayName("Phát hiện trùng lịch và ném ShowtimeOverlapException")
    void testValidateNoOverlapThrowsWhenConflicting() {
        UUID auditoriumId = UUID.randomUUID();
        Instant start = Instant.parse("2026-09-20T14:00:00Z");
        Instant end = Instant.parse("2026-09-20T16:30:00Z");

        Showtime existingConflict = mock(Showtime.class);
        when(existingConflict.getStartTime()).thenReturn(Instant.parse("2026-09-20T13:30:00Z"));
        when(existingConflict.getEndTime()).thenReturn(Instant.parse("2026-09-20T15:30:00Z"));

        when(showtimeRepository.findOverlappingShowtimes(auditoriumId, start, end, null))
            .thenReturn(List.of(existingConflict));

        assertThatThrownBy(() -> validator.validateNoOverlap(auditoriumId, start, end, null))
            .isInstanceOf(ShowtimeOverlapException.class)
            .hasMessageContaining("đã có suất chiếu khác");
    }

    @Test
    @DisplayName("Cho phép tạo suất chiếu khi không có trùng lặp")
    void testValidateNoOverlapPassesWhenClean() {
        UUID auditoriumId = UUID.randomUUID();
        Instant start = Instant.parse("2026-09-20T14:00:00Z");
        Instant end = Instant.parse("2026-09-20T16:30:00Z");

        when(showtimeRepository.findOverlappingShowtimes(auditoriumId, start, end, null))
            .thenReturn(Collections.emptyList());

        // Không ném ngoại lệ
        validator.validateNoOverlap(auditoriumId, start, end, null);
    }
}
