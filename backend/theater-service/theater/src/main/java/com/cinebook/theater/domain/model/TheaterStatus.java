package com.cinebook.theater.domain.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TheaterStatus {
    ACTIVE("active"),
    MAINTENANCE("maintenance"),
    INACTIVE("inactive");

    private final String value;

    TheaterStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    @JsonCreator
    public static TheaterStatus from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Theater status must not be blank");
        }

        String normalized = value.trim().toUpperCase();
        for (TheaterStatus status : values()) {
            if (status.name().equalsIgnoreCase(normalized) || status.value.equalsIgnoreCase(value.trim())) {
                return status;
            }
        }

        throw new IllegalArgumentException("Unsupported theater status: " + value);
    }
}
