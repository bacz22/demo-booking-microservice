package com.cinebook.booking.controller;

import com.cinebook.booking.controller.dto.BookingResponse;
import com.cinebook.booking.controller.dto.CreateBookingRequest;
import com.cinebook.booking.security.CurrentUserProvider;
import com.cinebook.booking.service.BookingService;
import com.cinebook.booking.service.HoldResult;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService service;
    private final CurrentUserProvider users;

    public BookingController(BookingService service, CurrentUserProvider users) {
        this.service = service;
        this.users = users;
    }

    @PostMapping("/hold")
    public ResponseEntity<BookingResponse> hold(@RequestHeader("X-User-Id") String userHeader,
                                                @RequestHeader("Idempotency-Key") String idempotencyKey,
                                                @Valid @RequestBody CreateBookingRequest request) {
        UUID requestId = parseUuid(idempotencyKey, "Idempotency-Key");
        HoldResult result = service.hold(request, users.requiredUserId(userHeader), requestId);
        if (!result.created()) return ResponseEntity.ok(result.response());
        BookingResponse response = result.response();
        return ResponseEntity.created(URI.create("/api/bookings/" + response.id())).body(response);
    }

    @GetMapping("/me")
    public Page<BookingResponse> mine(@RequestHeader("X-User-Id") String userHeader,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int pageSize) {
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        return service.findMine(users.requiredUserId(userHeader), PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/{id}")
    public BookingResponse get(@PathVariable UUID id, @RequestHeader("X-User-Id") String userHeader) {
        return service.get(id, users.requiredUserId(userHeader));
    }

    @PostMapping("/{id}/confirm")
    public BookingResponse confirm(@PathVariable UUID id, @RequestHeader("X-User-Id") String userHeader) {
        return service.confirm(id, users.requiredUserId(userHeader));
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancel(@PathVariable UUID id, @RequestHeader("X-User-Id") String userHeader) {
        return service.cancel(id, users.requiredUserId(userHeader));
    }

    private UUID parseUuid(String value, String name) {
        try { return UUID.fromString(value); }
        catch (Exception ex) { throw new com.cinebook.booking.exception.BadRequestException(name + " phải là UUID"); }
    }
}
