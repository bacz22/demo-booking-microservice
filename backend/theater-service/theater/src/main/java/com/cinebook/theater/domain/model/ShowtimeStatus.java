package com.cinebook.theater.domain.model;

public enum ShowtimeStatus {
    SCHEDULED("scheduled", "Lên lịch"),
    SELLING("selling", "Đang mở bán"),
    ENDED("ended", "Đã kết thúc"),
    CANCELLED("cancelled", "Đã hủy");

    private final String value;
    private final String displayName;

    ShowtimeStatus(String value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public String value() {
        return value;
    }

    public String displayName() {
        return displayName;
    }

    public static ShowtimeStatus from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Showtime status must not be blank");
        }

        String normalized = value.trim().toUpperCase();
        for (ShowtimeStatus status : values()) {
            if (status.name().equalsIgnoreCase(normalized) || status.value.equalsIgnoreCase(value.trim())) {
                return status;
            }
        }

        throw new IllegalArgumentException("Unsupported showtime status: " + value);
    }
}
