package com.cinebook.booking.controller.dto;

import jakarta.validation.constraints.Size;

public record AdminCancelRequest(@Size(max = 200) String reason) {}
