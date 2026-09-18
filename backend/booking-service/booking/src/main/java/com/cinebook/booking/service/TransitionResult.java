package com.cinebook.booking.service;

import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.domain.enums.ConfirmOutcome;

import java.util.List;
import java.util.UUID;

public record TransitionResult(Booking booking, List<UUID> seatIds, ConfirmOutcome outcome) {}
