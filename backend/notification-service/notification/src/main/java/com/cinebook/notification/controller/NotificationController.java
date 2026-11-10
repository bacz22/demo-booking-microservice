package com.cinebook.notification.controller;

import com.cinebook.notification.domain.Notification;
import com.cinebook.notification.exception.NotificationNotFoundException;
import com.cinebook.notification.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository notifications;
    private final Clock clock;

    public NotificationController(NotificationRepository notifications, Clock clock) {
        this.notifications = notifications;
        this.clock = clock;
    }

    public record NotificationPage(List<Notification> content, int page, int pageSize, long totalElements) {}

    @GetMapping("/me")
    public NotificationPage mine(@RequestHeader("X-User-Id") UUID userId,
                                 @RequestParam(defaultValue = "0") int page,
                                 @RequestParam(defaultValue = "20") int pageSize) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        return new NotificationPage(notifications.findByUser(userId, safeSize, safePage * safeSize),
            safePage, safeSize, notifications.countByUser(userId));
    }

    @GetMapping("/me/unread-count")
    public Map<String, Long> unreadCount(@RequestHeader("X-User-Id") UUID userId) {
        return Map.of("unread", notifications.countUnread(userId));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id, @RequestHeader("X-User-Id") UUID userId) {
        if (!notifications.markRead(id, userId, Instant.now(clock))) throw new NotificationNotFoundException();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/read-all")
    public Map<String, Integer> markAllRead(@RequestHeader("X-User-Id") UUID userId) {
        return Map.of("updated", notifications.markAllRead(userId, Instant.now(clock)));
    }
}
