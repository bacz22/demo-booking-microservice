package com.cinebook.booking.config;

import com.cinebook.booking.exception.InternalServiceUnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class InternalServiceKeyValidator {
    private final String configuredKey;

    public InternalServiceKeyValidator(@Value("${booking.internal.service-key:}") String configuredKey) {
        this.configuredKey = configuredKey == null ? "" : configuredKey;
    }

    public void requireValid(String suppliedKey) {
        if (configuredKey.isBlank() || suppliedKey == null ||
            !MessageDigest.isEqual(configuredKey.getBytes(StandardCharsets.UTF_8),
                suppliedKey.getBytes(StandardCharsets.UTF_8))) {
            throw new InternalServiceUnauthorizedException();
        }
    }
}
