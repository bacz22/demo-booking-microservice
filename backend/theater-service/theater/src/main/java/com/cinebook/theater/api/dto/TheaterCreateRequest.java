package com.cinebook.theater.api.dto;

import com.cinebook.theater.domain.model.TheaterStatus;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record TheaterCreateRequest(
    @NotBlank(message = "Tên cụm rạp không được để trống")
    String name,

    @NotBlank(message = "Địa chỉ cụm rạp không được để trống")
    String address,

    @NotBlank(message = "Thành phố không được để trống")
    String city,

    String hotline,
    String openingHours,
    List<String> features,
    String imageUrl,
    TheaterStatus status
) {
}
