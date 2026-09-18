package com.cinebook.booking.security;

import com.cinebook.booking.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class HeaderCurrentUserProvider implements CurrentUserProvider {
    @Override
    public UUID requiredUserId(String value) {
        UUID id = optionalUserId(value);
        if (id == null) throw new BadRequestException("Header X-User-Id là bắt buộc và phải là UUID");
        return id;
    }
    @Override
    public UUID optionalUserId(String value) {
        if (value == null || value.isBlank()) return null;
        try { return UUID.fromString(value); }
        catch (IllegalArgumentException ex) { throw new BadRequestException("X-User-Id không hợp lệ"); }
    }
}
