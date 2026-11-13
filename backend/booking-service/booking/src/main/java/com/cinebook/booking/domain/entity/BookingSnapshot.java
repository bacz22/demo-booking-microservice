package com.cinebook.booking.domain.entity;

import java.time.Instant;

/** Thông tin hiển thị của suất chiếu tại thời điểm giữ ghế. movieTitle/posterUrl có thể null nếu movie-service lỗi. */
public record BookingSnapshot(String movieTitle, String posterUrl, String theaterName, String theaterCity,
                              String auditoriumName, Instant showtimeStart, Instant showtimeEnd) {
}
