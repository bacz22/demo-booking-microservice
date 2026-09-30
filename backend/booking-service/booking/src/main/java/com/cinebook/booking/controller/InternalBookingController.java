package com.cinebook.booking.controller;

import com.cinebook.booking.config.InternalServiceKeyValidator;
import com.cinebook.booking.controller.dto.ConfirmPaymentRequest;
import com.cinebook.booking.controller.dto.InternalPaymentResponse;
import com.cinebook.booking.service.BookingPaymentStatus;
import com.cinebook.booking.service.BookingService;
import com.cinebook.booking.service.InternalPaymentResult;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/internal/bookings")
public class InternalBookingController {
    private final BookingService service;
    private final InternalServiceKeyValidator keyValidator;

    public InternalBookingController(BookingService service, InternalServiceKeyValidator keyValidator) {
        this.service = service;
        this.keyValidator = keyValidator;
    }

    @GetMapping("/{id}/payment-status")
    public InternalPaymentResponse status(@PathVariable UUID id,
                                          @RequestParam UUID userId,
                                          @RequestHeader("X-Service-Key") String serviceKey) {
        keyValidator.requireValid(serviceKey);
        BookingPaymentStatus status = service.paymentStatus(id, userId);
        return InternalPaymentResponse.from(status, null);
    }

    @PostMapping("/{id}/confirm-payment")
    public InternalPaymentResponse confirm(@PathVariable UUID id,
                                           @RequestHeader("X-Service-Key") String serviceKey,
                                           @RequestHeader("X-User-Id") UUID userId,
                                           @Valid @RequestBody ConfirmPaymentRequest request) {
        keyValidator.requireValid(serviceKey);
        InternalPaymentResult result = service.confirmPaid(id, userId, request.paymentId(), request.amount(), request.currency());
        return InternalPaymentResponse.from(BookingPaymentStatus.from(result.booking()), result.outcome());
    }
}
