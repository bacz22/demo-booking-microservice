package com.cinebook.auth.repository;

import com.cinebook.auth.domain.User;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepository {
    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<User> findByEmail(String email) {
        return findOne("SELECT * FROM users WHERE lower(email) = lower(?)", email);
    }

    public Optional<User> findById(UUID id) {
        return findOne("SELECT * FROM users WHERE id = ?", id);
    }

    /** @throws DuplicateKeyException nếu email đã tồn tại */
    public void insert(User user) {
        jdbc.update("""
            INSERT INTO users (id, email, password_hash, full_name, phone, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, user.id(), user.email(), user.passwordHash(), user.fullName(), user.phone(), user.status(),
            Timestamp.from(user.createdAt()), Timestamp.from(user.createdAt()));
        for (String role : user.roles()) {
            jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, ?)", user.id(), role);
        }
    }

    private Optional<User> findOne(String sql, Object arg) {
        List<User> users = jdbc.query(sql, (rs, i) -> new User(
            rs.getObject("id", UUID.class),
            rs.getString("email"),
            rs.getString("password_hash"),
            rs.getString("full_name"),
            rs.getString("phone"),
            rs.getString("status"),
            null,
            rs.getTimestamp("created_at").toInstant()), arg);
        if (users.isEmpty()) return Optional.empty();
        User u = users.getFirst();
        return Optional.of(new User(u.id(), u.email(), u.passwordHash(), u.fullName(), u.phone(), u.status(),
            roles(u.id()), u.createdAt()));
    }

    private List<String> roles(UUID userId) {
        return jdbc.queryForList("SELECT role FROM user_roles WHERE user_id = ? ORDER BY role DESC", String.class, userId);
    }

    // ---------- truy vấn cho trang quản trị ----------

    public record Search(String q, String role, String status, int limit, int offset) {}

    public List<User> search(Search f) {
        StringBuilder sql = new StringBuilder("SELECT * FROM users u WHERE 1=1");
        List<Object> args = new java.util.ArrayList<>();
        appendFilters(f, sql, args);
        sql.append(" ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?");
        args.add(f.limit());
        args.add(f.offset());
        List<User> found = jdbc.query(sql.toString(), (rs, i) -> new User(
            rs.getObject("id", UUID.class), rs.getString("email"), null, rs.getString("full_name"),
            rs.getString("phone"), rs.getString("status"), null, rs.getTimestamp("created_at").toInstant()), args.toArray());
        return withRoles(found);
    }

    public long count(Search f) {
        StringBuilder sql = new StringBuilder("SELECT count(*) FROM users u WHERE 1=1");
        List<Object> args = new java.util.ArrayList<>();
        appendFilters(f, sql, args);
        return jdbc.queryForObject(sql.toString(), Long.class, args.toArray());
    }

    /** Lấy nhiều user một lần (ghép tên/email khách vào danh sách booking/payment của admin). */
    public List<User> findByIds(java.util.Collection<UUID> ids) {
        if (ids.isEmpty()) return List.of();
        String placeholders = String.join(",", java.util.Collections.nCopies(ids.size(), "?"));
        List<User> found = jdbc.query("SELECT * FROM users WHERE id IN (" + placeholders + ")", (rs, i) -> new User(
            rs.getObject("id", UUID.class), rs.getString("email"), null, rs.getString("full_name"),
            rs.getString("phone"), rs.getString("status"), null, rs.getTimestamp("created_at").toInstant()), ids.toArray());
        return withRoles(found);
    }

    public java.util.Map<String, Long> countByStatus() {
        java.util.Map<String, Long> result = new java.util.LinkedHashMap<>();
        result.put("ACTIVE", 0L);
        result.put("LOCKED", 0L);
        jdbc.query("SELECT status, count(*) AS c FROM users GROUP BY status",
            rs -> { result.put(rs.getString("status"), rs.getLong("c")); });
        return result;
    }

    public long countByRole(String role) {
        return jdbc.queryForObject("SELECT count(*) FROM user_roles WHERE role = ?", Long.class, role);
    }

    public void updateStatus(UUID id, String status, java.time.Instant now) {
        jdbc.update("UPDATE users SET status = ?, updated_at = ? WHERE id = ?", status, java.sql.Timestamp.from(now), id);
    }

    public void replaceRoles(UUID id, List<String> roles, java.time.Instant now) {
        jdbc.update("DELETE FROM user_roles WHERE user_id = ?", id);
        for (String role : roles) jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, ?)", id, role);
        jdbc.update("UPDATE users SET updated_at = ? WHERE id = ?", java.sql.Timestamp.from(now), id);
    }

    public void updateProfile(UUID id, String fullName, String phone, java.time.Instant now) {
        jdbc.update("UPDATE users SET full_name = ?, phone = ?, updated_at = ? WHERE id = ?",
            fullName, phone, java.sql.Timestamp.from(now), id);
    }

    public void updatePassword(UUID id, String passwordHash, java.time.Instant now) {
        jdbc.update("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            passwordHash, java.sql.Timestamp.from(now), id);
    }

    private static void appendFilters(Search f, StringBuilder sql, List<Object> args) {
        if (f.q() != null && !f.q().isBlank()) {
            String like = "%" + f.q().trim().toLowerCase().replace("%", "\\%").replace("_", "\\_") + "%";
            sql.append(" AND (lower(u.email) LIKE ? OR lower(u.full_name) LIKE ? OR coalesce(u.phone, '') LIKE ?)");
            args.add(like);
            args.add(like);
            args.add(like);
        }
        if (f.status() != null && !f.status().isBlank()) {
            sql.append(" AND u.status = ?");
            args.add(f.status());
        }
        if (f.role() != null && !f.role().isBlank()) {
            sql.append(" AND EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role = ?)");
            args.add(f.role());
        }
    }

    private List<User> withRoles(List<User> users) {
        if (users.isEmpty()) return users;
        java.util.Map<UUID, List<String>> roles = new java.util.HashMap<>();
        String placeholders = String.join(",", java.util.Collections.nCopies(users.size(), "?"));
        jdbc.query("SELECT user_id, role FROM user_roles WHERE user_id IN (" + placeholders + ") ORDER BY role DESC",
            rs -> { roles.computeIfAbsent(rs.getObject("user_id", UUID.class), k -> new java.util.ArrayList<>())
                .add(rs.getString("role")); }, users.stream().map(User::id).toArray());
        return users.stream().map(u -> new User(u.id(), u.email(), u.passwordHash(), u.fullName(), u.phone(),
            u.status(), roles.getOrDefault(u.id(), List.of()), u.createdAt())).toList();
    }
}
