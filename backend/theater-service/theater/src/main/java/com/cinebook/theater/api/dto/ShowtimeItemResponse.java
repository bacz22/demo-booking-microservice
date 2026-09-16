package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.Showtime;
import com.cinebook.theater.domain.model.ShowtimeStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShowtimeItemResponse(
    UUID id,
    UUID auditoriumId,
    String auditoriumName,
    String format,
    Instant startTime,
    Instant endTime,
    BigDecimal priceStandard,
    BigDecimal priceVip,
    BigDecimal priceCouple,
    ShowtimeStatus status
) {
    public static ShowtimeItemResponse from(Showtime showtime) {
        var auditorium = showtime.getAuditorium();
        return new ShowtimeItemResponse(
            showtime.getId(),
            auditorium != null ? auditorium.getId() : null,
            auditorium != null ? auditorium.getName() : null,
            auditorium != null && auditorium.getFormat() != null ? auditorium.getFormat().name() : null,
            showtime.getStartTime(),
            showtime.getEndTime(),
            showtime.getPriceStandard(),
            showtime.getPriceVip(),
            showtime.getPriceCouple(),
            showtime.getStatus()
        );
    }
}
