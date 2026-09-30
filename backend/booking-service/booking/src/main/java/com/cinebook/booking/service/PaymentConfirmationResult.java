package com.cinebook.booking.service;

import com.cinebook.booking.domain.entity.Booking;

import java.util.List;
import java.util.UUID;

public record PaymentConfirmationResult(Booking booking, List<UUID> seatIds,
                                        PaymentConfirmationOutcome outcome) {
}
