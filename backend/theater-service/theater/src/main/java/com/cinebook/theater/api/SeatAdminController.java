package com.cinebook.theater.api;

import com.cinebook.theater.api.dto.SeatGenerateRequest;
import com.cinebook.theater.api.dto.SeatLayoutResponse;
import com.cinebook.theater.application.SeatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/auditoriums/{id}/seats")
public class SeatAdminController {

    private final SeatService seatService;

    public SeatAdminController(SeatService seatService) {
        this.seatService = seatService;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public SeatLayoutResponse generateSeats(
        @PathVariable UUID id,
        @Valid @RequestBody SeatGenerateRequest request
    ) {
        return seatService.generateLayout(id, request);
    }

    @GetMapping
    public SeatLayoutResponse getSeats(@PathVariable UUID id) {
        return seatService.getSeatsByAuditorium(id);
    }
}
