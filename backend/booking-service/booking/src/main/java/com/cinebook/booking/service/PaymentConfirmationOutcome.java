package com.cinebook.booking.service;

public enum PaymentConfirmationOutcome {
    NEWLY_CONFIRMED,
    ALREADY_CONFIRMED_SAME_PAYMENT,
    ALREADY_CONFIRMED_OTHER_PAYMENT,
    NEWLY_EXPIRED,
    ALREADY_EXPIRED,
    CANCELLED
}
