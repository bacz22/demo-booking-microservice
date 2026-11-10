package com.cinebook.notification.domain;

import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/** Một thông báo gửi tới người dùng. data = payload event gốc (bookingCode, ghế, số tiền...). */
public record Notification(UUID id, UUID userId, UUID bookingId, NotificationType type,
                           String title, String body, JsonNode data, Instant readAt, Instant createdAt) {
}
