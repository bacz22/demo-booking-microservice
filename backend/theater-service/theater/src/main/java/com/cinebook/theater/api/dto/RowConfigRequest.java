package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.SeatType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record RowConfigRequest(
    @NotBlank(message = "Tên hàng ghế không được để trống")
    String label,

    @Min(value = 1, message = "Số lượng ghế trong hàng phải lớn hơn 0")
    int seatCount,

    SeatType seatType
) {
}
