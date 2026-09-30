package com.cinebook.booking.service;

import com.cinebook.booking.domain.entity.Booking;

public record InternalPaymentResult(Booking booking, PaymentConfirmationOutcome outcome) {
    public static InternalPaymentResult of(Booking booking, PaymentConfirmationOutcome outcome) {
        return new InternalPaymentResult(booking, outcome);
    }
}
