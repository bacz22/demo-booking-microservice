package com.cinebook.booking.client.dto;

import java.util.UUID;

/** Các trường cần dùng từ MovieResponse của movie-service (các trường khác bị bỏ qua). */
public record MovieSummaryDto(UUID id, String title, String posterUrl) {}
