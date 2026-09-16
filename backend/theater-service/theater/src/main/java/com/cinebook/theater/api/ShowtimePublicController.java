package com.cinebook.theater.api;

import com.cinebook.theater.api.dto.MovieShowtimeGroupResponse;
import com.cinebook.theater.api.dto.ShowtimeResponse;
import com.cinebook.theater.api.dto.ShowtimeSeatMapResponse;
import com.cinebook.theater.application.ShowtimeService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
public class ShowtimePublicController {

    private final ShowtimeService showtimeService;

    public ShowtimePublicController(ShowtimeService showtimeService) {
        this.showtimeService = showtimeService;
    }

    @GetMapping("/api/movies/{movieId}/showtimes")
    public List<MovieShowtimeGroupResponse> getShowtimesForMovie(
        @PathVariable UUID movieId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required = false) UUID theaterId,
        @RequestParam(required = false) String city
    ) {
        return showtimeService.getShowtimesForMovie(movieId, date, theaterId, city);
    }

    @GetMapping("/api/showtimes/{id}")
    public ShowtimeResponse getShowtimeById(@PathVariable UUID id) {
        return showtimeService.getShowtimeById(id);
    }

    @GetMapping("/api/showtimes/{id}/seats")
    public ShowtimeSeatMapResponse getSeatMapForShowtime(@PathVariable UUID id) {
        return showtimeService.getSeatMapForShowtime(id);
    }
}
