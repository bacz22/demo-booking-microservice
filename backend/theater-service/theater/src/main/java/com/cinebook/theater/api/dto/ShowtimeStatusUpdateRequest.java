package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.ShowtimeStatus;
import jakarta.validation.constraints.NotNull;

public record ShowtimeStatusUpdateRequest(
    @NotNull(message = "Trạng thái suất chiếu không được để trống")
    ShowtimeStatus status
) {
}
