package com.cinebook.theater.application;

import com.cinebook.theater.application.exception.ShowtimeInPastException;
import com.cinebook.theater.application.exception.ShowtimeOverlapException;
import com.cinebook.theater.domain.model.Showtime;
import com.cinebook.theater.infrastructure.repository.ShowtimeRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Component
public class ShowtimeScheduleValidator {

    private final ShowtimeRepository showtimeRepository;

    public ShowtimeScheduleValidator(ShowtimeRepository showtimeRepository) {
        this.showtimeRepository = showtimeRepository;
    }

    public Instant calculateEndTime(Instant startTime, int movieDurationMin, int cleaningDurationMin) {
        if (startTime == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu suất chiếu không được để trống");
        }
        if (movieDurationMin <= 0) {
            throw new IllegalArgumentException("Thời lượng phim phải lớn hơn 0 phút");
        }
        if (cleaningDurationMin < 0) {
            throw new IllegalArgumentException("Thời gian dọn phòng không được âm");
        }

        long totalMinutes = (long) movieDurationMin + cleaningDurationMin;
        return startTime.plus(totalMinutes, ChronoUnit.MINUTES);
    }

    public void validateTiming(Instant startTime, Instant endTime) {
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc không được để trống");
        }

        // Cho phép dung sai 1 phút phòng trễ mạng/đồng hồ hệ thống
        if (startTime.isBefore(Instant.now().minus(1, ChronoUnit.MINUTES))) {
            throw new ShowtimeInPastException(startTime);
        }

        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("Thời gian kết thúc (" + endTime + ") phải sau thời gian bắt đầu (" + startTime + ")");
        }
    }

    public void validateNoOverlap(UUID auditoriumId, Instant startTime, Instant endTime, UUID excludeShowtimeId) {
        if (auditoriumId == null) {
            throw new IllegalArgumentException("Mã phòng chiếu (auditoriumId) không được để trống");
        }

        List<Showtime> conflicts = showtimeRepository.findOverlappingShowtimes(
            auditoriumId,
            startTime,
            endTime,
            excludeShowtimeId
        );

        if (!conflicts.isEmpty()) {
            Showtime conflict = conflicts.get(0);
            throw new ShowtimeOverlapException(auditoriumId, conflict.getStartTime(), conflict.getEndTime());
        }
    }
}
