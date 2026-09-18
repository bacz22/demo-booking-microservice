package com.cinebook.booking.service;

import java.util.List;
import java.util.UUID;

public record ReleaseCommand(UUID showtimeId, List<UUID> seatIds, UUID requestId, UUID userId) {}
