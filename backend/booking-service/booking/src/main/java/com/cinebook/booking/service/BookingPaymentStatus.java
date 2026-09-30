package com.cinebook.booking.service;

import com.cinebook.booking.domain.entity.Booking;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BookingPaymentStatus(UUID bookingId, UUID userId, BigDecimal amount,
                                   String currency, String status, UUID paymentId,
                                   Instant expiresAt) {
    public static BookingPaymentStatus from(Booking booking) {
        return new BookingPaymentStatus(booking.getId(), booking.getUserId(), booking.getTotalAmount(),
            "VND", booking.getStatus().name(), booking.getPaymentId(), booking.getExpiresAt());
    }
}
