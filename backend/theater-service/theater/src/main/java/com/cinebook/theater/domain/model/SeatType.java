package com.cinebook.theater.domain.model;

public enum SeatType {
    STANDARD("standard", "Ghế thường"),
    VIP("vip", "Ghế VIP"),
    COUPLE("couple", "Ghế đôi Sweetbox");

    private final String value;
    private final String displayName;

    SeatType(String value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public String value() {
        return value;
    }

    public String displayName() {
        return displayName;
    }

    public static SeatType from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Seat type must not be blank");
        }

        String normalized = value.trim().toUpperCase();
        for (SeatType type : values()) {
            if (type.name().equalsIgnoreCase(normalized) || type.value.equalsIgnoreCase(value.trim())) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unsupported seat type: " + value);
    }
}
