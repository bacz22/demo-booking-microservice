package com.cinebook.booking.service;

import com.cinebook.booking.controller.dto.BookingResponse;

public record HoldResult(BookingResponse response, boolean created) {}
