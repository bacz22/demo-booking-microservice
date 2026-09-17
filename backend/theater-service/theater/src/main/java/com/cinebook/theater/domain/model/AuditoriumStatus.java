package com.cinebook.theater.domain.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum AuditoriumStatus {
    ACTIVE("active"),
    MAINTENANCE("maintenance"),
    INACTIVE("inactive");

    private final String value;

    AuditoriumStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    @JsonCreator
    public static AuditoriumStatus from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Auditorium status must not be blank");
        }

        String normalized = value.trim().toUpperCase();
        for (AuditoriumStatus status : values()) {
            if (status.name().equalsIgnoreCase(normalized) || status.value.equalsIgnoreCase(value.trim())) {
                return status;
            }
        }

        throw new IllegalArgumentException("Unsupported auditorium status: " + value);
    }
}
