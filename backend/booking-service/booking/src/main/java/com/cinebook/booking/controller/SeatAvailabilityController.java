package com.cinebook.booking.controller;

import com.cinebook.booking.controller.dto.SeatAvailabilityResponse;
import com.cinebook.booking.security.CurrentUserProvider;
import com.cinebook.booking.service.SeatAvailabilityService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/bookings/showtimes")
public class SeatAvailabilityController {
    private final SeatAvailabilityService service;
    private final CurrentUserProvider users;
    public SeatAvailabilityController(SeatAvailabilityService service, CurrentUserProvider users) { this.service = service; this.users = users; }

    @GetMapping("/{showtimeId}/seats")
    public SeatAvailabilityResponse seats(@PathVariable UUID showtimeId,
                                          @RequestHeader(value = "X-User-Id", required = false) String userHeader) {
        return service.get(showtimeId, users.optionalUserId(userHeader));
    }
}
