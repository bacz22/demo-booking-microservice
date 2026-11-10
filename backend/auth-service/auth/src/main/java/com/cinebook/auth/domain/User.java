package com.cinebook.auth.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record User(UUID id, String email, String passwordHash, String fullName, String phone,
                   String status, List<String> roles, Instant createdAt) {
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
