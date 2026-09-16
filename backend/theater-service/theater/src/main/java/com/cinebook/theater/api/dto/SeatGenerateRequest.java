package com.cinebook.theater.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SeatGenerateRequest(
    @NotEmpty(message = "Danh sách hàng ghế không được để trống")
    List<@Valid RowConfigRequest> rows
) {
}
