package com.cinebook.theater.api;

import com.cinebook.theater.api.dto.PageResponse;
import com.cinebook.theater.api.dto.ShowtimeCreateRequest;
import com.cinebook.theater.api.dto.ShowtimeResponse;
import com.cinebook.theater.api.dto.ShowtimeStatusUpdateRequest;
import com.cinebook.theater.api.dto.ShowtimeUpdateRequest;
import com.cinebook.theater.application.ShowtimeService;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/showtimes")
public class ShowtimeAdminController {

    private final ShowtimeService showtimeService;

    public ShowtimeAdminController(ShowtimeService showtimeService) {
        this.showtimeService = showtimeService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShowtimeResponse createShowtime(@Valid @RequestBody ShowtimeCreateRequest request) {
        return showtimeService.createShowtime(request);
    }

    @GetMapping
    public PageResponse<ShowtimeResponse> getShowtimes(
        @RequestParam(required = false) UUID theaterId,
        @RequestParam(required = false) UUID auditoriumId,
        @RequestParam(required = false) UUID movieId,
        @RequestParam(required = false) ShowtimeStatus status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int pageSize
    ) {
        return showtimeService.getShowtimesWithFilters(
            theaterId,
            auditoriumId,
            movieId,
            status,
            date,
            dateFrom,
            dateTo,
            PageRequest.of(page, pageSize, Sort.by("startTime").ascending())
        );
    }

    @GetMapping("/{id}")
    public ShowtimeResponse getShowtimeById(@PathVariable UUID id) {
        return showtimeService.getShowtimeById(id);
    }

    @PutMapping("/{id}")
    public ShowtimeResponse updateShowtime(
        @PathVariable UUID id,
        @Valid @RequestBody ShowtimeUpdateRequest request
    ) {
        return showtimeService.updateShowtime(id, request);
    }

    @PatchMapping("/{id}/status")
    public ShowtimeResponse updateStatus(
        @PathVariable UUID id,
        @Valid @RequestBody ShowtimeStatusUpdateRequest request
    ) {
        return showtimeService.updateStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteShowtime(@PathVariable UUID id) {
        showtimeService.deleteShowtime(id);
    }
}
