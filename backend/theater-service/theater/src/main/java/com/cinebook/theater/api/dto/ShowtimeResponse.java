package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.Showtime;
import com.cinebook.theater.domain.model.ShowtimeStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShowtimeResponse(
    UUID id,
    UUID auditoriumId,
    String auditoriumName,
    String auditoriumFormat,
    UUID theaterId,
    String theaterName,
    String theaterAddress,
    String theaterCity,
    UUID movieId,
    Instant startTime,
    Instant endTime,
    int movieDurationMin,
    int cleaningDurationMin,
    BigDecimal priceStandard,
    BigDecimal priceVip,
    BigDecimal priceCouple,
    ShowtimeStatus status,
    Instant createdAt,
    Instant updatedAt
) {
    public static ShowtimeResponse from(Showtime showtime) {
        var auditorium = showtime.getAuditorium();
        var theater = auditorium != null ? auditorium.getTheater() : null;

        return new ShowtimeResponse(
            showtime.getId(),
            auditorium != null ? auditorium.getId() : null,
            auditorium != null ? auditorium.getName() : null,
            auditorium != null && auditorium.getFormat() != null ? auditorium.getFormat().name() : null,
            theater != null ? theater.getId() : null,
            theater != null ? theater.getName() : null,
            theater != null ? theater.getAddress() : null,
            theater != null ? theater.getCity() : null,
            showtime.getMovieId(),
            showtime.getStartTime(),
            showtime.getEndTime(),
            showtime.getMovieDurationMin(),
            showtime.getCleaningDurationMin(),
            showtime.getPriceStandard(),
            showtime.getPriceVip(),
            showtime.getPriceCouple(),
            showtime.getStatus(),
            showtime.getCreatedAt(),
            showtime.getUpdatedAt()
        );
    }
}
