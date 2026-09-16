package com.cinebook.theater.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShowtimeCreateRequest(
    @NotNull(message = "Phòng chiếu không được để trống")
    UUID auditoriumId,

    @NotNull(message = "Mã phim không được để trống")
    UUID movieId,

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    Instant startTime,

    Integer cleaningDurationMin,

    @DecimalMin(value = "0.0", message = "Giá vé Standard không được âm")
    BigDecimal priceStandard,

    @DecimalMin(value = "0.0", message = "Giá vé VIP không được âm")
    BigDecimal priceVip,

    @DecimalMin(value = "0.0", message = "Giá vé Couple không được âm")
    BigDecimal priceCouple
) {
}
