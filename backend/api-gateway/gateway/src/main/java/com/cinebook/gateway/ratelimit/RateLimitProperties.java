package com.cinebook.gateway.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(Duration window, List<Rule> rules) {
    public record Rule(String method, String path, int limit) {}

    public RateLimitProperties {
        if (window == null) window = Duration.ofMinutes(1);
        if (rules == null) rules = List.of();
    }
}
