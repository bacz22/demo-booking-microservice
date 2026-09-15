package com.cinebook.movie.domain.model;

public enum MovieStatus {
    NOW_SHOWING("now-showing"),
    COMING_SOON("coming-soon"),
    ENDED("ended");

    private final String value;

    MovieStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static MovieStatus from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Movie status must not be blank");
        }

        String normalized = value.trim().toLowerCase().replace('_', '-');
        for (MovieStatus status : values()) {
            if (status.value.equals(normalized) || status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }

        throw new IllegalArgumentException("Unsupported movie status: " + value);
    }
}
