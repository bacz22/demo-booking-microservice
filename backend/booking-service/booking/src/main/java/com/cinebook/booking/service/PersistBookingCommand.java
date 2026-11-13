package com.cinebook.booking.service;

import com.cinebook.booking.domain.entity.BookingSnapshot;
import com.cinebook.booking.client.dto.TheaterSeatDto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PersistBookingCommand(UUID requestId, String requestHash, UUID userId, UUID showtimeId,
                                    UUID movieId, UUID theaterId, UUID auditoriumId,
                                    BigDecimal totalAmount, Instant expiresAt, List<TheaterSeatDto> seats,
                                    List<BigDecimal> prices, BookingSnapshot snapshot) {}
