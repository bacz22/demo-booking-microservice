package com.cinebook.theater.domain.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

public enum AuditoriumFormat {
    TWO_D("2D", "Standard 2D"),
    THREE_D("3D", "Digital 3D"),
    IMAX_LASER("IMAX_LASER", "IMAX Laser"),
    FOUR_DX("4DX", "4DX Motion"),
    SCREENX("SCREENX", "ScreenX 270°"),
    DOLBY_ATMOS("DOLBY_ATMOS", "Dolby Atmos");

    private final String dbValue;
    private final String displayName;

    AuditoriumFormat(String dbValue, String displayName) {
        this.dbValue = dbValue;
        this.displayName = displayName;
    }

    public String getDbValue() {
        return dbValue;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static AuditoriumFormat from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Auditorium format must not be blank");
        }

        String normalized = value.trim().replace("-", "_").replace(" ", "_").toUpperCase();
        for (AuditoriumFormat format : values()) {
            if (format.dbValue.equalsIgnoreCase(value.trim()) 
                || format.name().equalsIgnoreCase(normalized)
                || format.displayName.equalsIgnoreCase(value.trim())) {
                return format;
            }
        }

        throw new IllegalArgumentException("Unsupported auditorium format: " + value);
    }

    @Converter(autoApply = true)
    public static class AuditoriumFormatConverter implements AttributeConverter<AuditoriumFormat, String> {
        @Override
        public String convertToDatabaseColumn(AuditoriumFormat attribute) {
            return attribute != null ? attribute.getDbValue() : null;
        }

        @Override
        public AuditoriumFormat convertToEntityAttribute(String dbData) {
            return dbData != null ? AuditoriumFormat.from(dbData) : null;
        }
    }
}
