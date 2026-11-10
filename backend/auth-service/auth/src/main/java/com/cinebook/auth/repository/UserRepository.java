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
}
