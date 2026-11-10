package com.cinebook.auth.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Refresh token lưu dạng SHA-256 hash; token gốc chỉ trả cho client một lần. */
@Repository
public class RefreshTokenRepository {
    private final JdbcTemplate jdbc;

    public RefreshTokenRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(UUID userId, String tokenHash, Instant expiresAt, Instant now) {
        jdbc.update("""
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
            """, UUID.randomUUID(), userId, tokenHash, Timestamp.from(expiresAt), Timestamp.from(now));
    }

    /**
     * Thu hồi token còn hiệu lực (atomic). Trả về userId nếu thu hồi thành công —
     * dùng cho rotation: hai request refresh song song chỉ một cái thắng.
     */
    public Optional<UUID> revokeIfValid(String tokenHash, Instant now) {
        List<UUID> ids = jdbc.queryForList("""
            UPDATE refresh_tokens SET revoked_at = ?
             WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?
            RETURNING user_id
            """, UUID.class, Timestamp.from(now), tokenHash, Timestamp.from(now));
        return ids.stream().findFirst();
    }
}
