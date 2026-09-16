package com.cinebook.theater.api.dto;

import java.util.List;
import java.util.UUID;

public record MovieShowtimeGroupResponse(
    UUID theaterId,
    String theaterName,
    String address,
    String city,
    List<ShowtimeItemResponse> showtimes
) {
}
