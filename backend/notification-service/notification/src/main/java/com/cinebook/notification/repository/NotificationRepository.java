package com.cinebook.notification.repository;

import com.cinebook.notification.domain.Notification;
import com.cinebook.notification.domain.NotificationType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public class NotificationRepository {
    private final JdbcTemplate jdbc;
    private final JsonMapper mapper;
    private final RowMapper<Notification> rowMapper;

    public NotificationRepository(JdbcTemplate jdbc, JsonMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.rowMapper = (rs, i) -> new Notification(
            rs.getObject("id", UUID.class),
            rs.getObject("user_id", UUID.class),
            rs.getObject("booking_id", UUID.class),
            NotificationType.valueOf(rs.getString("type")),
            rs.getString("title"),
            rs.getString("body"),
            rs.getString("data") == null ? null : mapper.readTree(rs.getString("data")),
            toInstant(rs.getTimestamp("read_at")),
            toInstant(rs.getTimestamp("created_at")));
    }

    public void insert(Notification n) {
        jdbc.update("""
            INSERT INTO notifications (id, user_id, booking_id, type, title, body, data, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?)
            """, n.id(), n.userId(), n.bookingId(), n.type().name(), n.title(), n.body(),
            n.data() == null ? null : mapper.writeValueAsString(n.data()), Timestamp.from(n.createdAt()));
    }

    public List<Notification> findByUser(UUID userId, int limit, int offset) {
        return jdbc.query("""
            SELECT * FROM notifications WHERE user_id = ?
             ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?
            """, rowMapper, userId, limit, offset);
    }

    public long countByUser(UUID userId) {
        return jdbc.queryForObject("SELECT count(*) FROM notifications WHERE user_id = ?", Long.class, userId);
    }

    public long countUnread(UUID userId) {
        return jdbc.queryForObject(
            "SELECT count(*) FROM notifications WHERE user_id = ? AND read_at IS NULL", Long.class, userId);
    }

    /** @return true nếu thông báo tồn tại và thuộc user (kể cả đã đọc trước đó). */
    public boolean markRead(UUID id, UUID userId, Instant now) {
        jdbc.update("UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL",
            Timestamp.from(now), id, userId);
        Integer owned = jdbc.queryForObject(
            "SELECT count(*) FROM notifications WHERE id = ? AND user_id = ?", Integer.class, id, userId);
        return owned != null && owned > 0;
    }

    public int markAllRead(UUID userId, Instant now) {
        return jdbc.update("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL",
            Timestamp.from(now), userId);
    }

    private static Instant toInstant(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }
}
