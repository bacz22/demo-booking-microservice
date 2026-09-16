package com.cinebook.theater.api;

import com.cinebook.theater.api.dto.SeatLayoutResponse;
import com.cinebook.theater.application.SeatService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auditoriums/{id}/seats")
public class SeatPublicController {

    private final SeatService seatService;

    public SeatPublicController(SeatService seatService) {
        this.seatService = seatService;
    }

    @GetMapping
    public SeatLayoutResponse getSeats(@PathVariable UUID id) {
        return seatService.getSeatsByAuditorium(id);
    }
}
