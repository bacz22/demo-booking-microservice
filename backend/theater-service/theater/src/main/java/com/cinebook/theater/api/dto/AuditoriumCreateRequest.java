package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.AuditoriumFormat;
import com.cinebook.theater.domain.model.AuditoriumStatus;
import jakarta.validation.constraints.NotBlank;

public record AuditoriumCreateRequest(
    @NotBlank(message = "Tên phòng chiếu không được để trống")
    String name,

    AuditoriumFormat format,
    AuditoriumStatus status
) {
}
