package com.cinebook.payment.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PaymentClaimRepository {
    private final JdbcTemplate jdbc;

    public PaymentClaimRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** One atomic claim. There is intentionally no SELECT-before-UPDATE here. */
    public Optional<ClaimedPayment> claim(UUID paymentId, UUID token, Instant now, Instant leaseExpiredBefore) {
        String sql = """
            UPDATE payments
               SET status = 'PROCESSING', processing_token = ?, processing_started_at = ?,
                   next_attempt_number = next_attempt_number + 1, updated_at = ?
             WHERE id = ?
               AND (status = 'PENDING'
                    OR (status = 'PROCESSING' AND processing_started_at IS NOT NULL
                        AND processing_started_at <= ?))
             RETURNING id, next_attempt_number
            """;
        List<ClaimedPayment> rows = jdbc.query(sql,
            (ResultSet rs, int rowNum) -> new ClaimedPayment(
                rs.getObject("id", UUID.class), token, rs.getInt("next_attempt_number")),
            token, timestamp(now), timestamp(now), paymentId, timestamp(leaseExpiredBefore));
        return rows.stream().findFirst();
    }

    public void abandonActiveAttempt(UUID paymentId, Instant now) {
        jdbc.update("UPDATE payment_attempts SET status = 'ABANDONED', ended_at = ? " +
                "WHERE payment_id = ? AND status = 'PROCESSING'", timestamp(now), paymentId);
    }

    public int insertProcessingAttempt(UUID paymentId, int attemptNumber, UUID token, Instant now) {
        return jdbc.update("""
            INSERT INTO payment_attempts
                (id, payment_id, attempt_number, processing_token, status, started_at)
            VALUES (?, ?, ?, ?, 'PROCESSING', ?)
            """, UUID.randomUUID(), paymentId, attemptNumber, token, timestamp(now));
    }

    public Optional<ClaimedPayment> failPending(UUID paymentId, UUID token, String code,
                                                String message, Instant now) {
        String sql = """
            UPDATE payments
               SET status = 'FAILED', failure_code = ?, failure_message = ?, failed_at = ?,
                   processing_token = NULL, processing_started_at = NULL,
                   next_attempt_number = next_attempt_number + 1, updated_at = ?
             WHERE id = ? AND status = 'PENDING'
             RETURNING id, next_attempt_number
            """;
        List<ClaimedPayment> rows = jdbc.query(sql,
            (ResultSet rs, int rowNum) -> new ClaimedPayment(
                rs.getObject("id", UUID.class), token, rs.getInt("next_attempt_number")),
            code, message, timestamp(now), timestamp(now), paymentId);
        if (rows.isEmpty()) return Optional.empty();
        ClaimedPayment result = rows.getFirst();
        jdbc.update("""
            INSERT INTO payment_attempts
                (id, payment_id, attempt_number, processing_token, status, failure_code, failure_message, started_at, ended_at)
            VALUES (?, ?, ?, ?, 'FAILED', ?, ?, ?, ?)
            """, UUID.randomUUID(), paymentId, result.attemptNumber(), token, code, message, timestamp(now), timestamp(now));
        return Optional.of(result);
    }

    public boolean resolveSuccess(UUID paymentId, UUID token, String providerRef, Instant now) {
        int updated = jdbc.update("""
            UPDATE payments
               SET status = 'SUCCEEDED', provider_ref = ?, paid_at = ?,
                   processing_token = NULL, processing_started_at = NULL, updated_at = ?
             WHERE id = ? AND status = 'PROCESSING' AND processing_token = ?
            """, providerRef, timestamp(now), timestamp(now), paymentId, token);
        if (updated == 0) return false;
        jdbc.update("""
            UPDATE payment_attempts
               SET status = 'SUCCEEDED', provider_ref = ?, ended_at = ?
             WHERE payment_id = ? AND processing_token = ? AND status = 'PROCESSING'
            """, providerRef, timestamp(now), paymentId, token);
        return true;
    }

    public boolean resolveFailure(UUID paymentId, UUID token, String code, String message, Instant now) {
        int updated = jdbc.update("""
            UPDATE payments
               SET status = 'FAILED', failure_code = ?, failure_message = ?, failed_at = ?,
                   processing_token = NULL, processing_started_at = NULL, updated_at = ?
             WHERE id = ? AND status = 'PROCESSING' AND processing_token = ?
            """, code, message, timestamp(now), timestamp(now), paymentId, token);
        if (updated == 0) return false;
        jdbc.update("""
            UPDATE payment_attempts
               SET status = 'FAILED', failure_code = ?, failure_message = ?, ended_at = ?
             WHERE payment_id = ? AND processing_token = ? AND status = 'PROCESSING'
            """, code, message, timestamp(now), paymentId, token);
        return true;
    }

    /**
     * Chốt SUCCEEDED khi booking-service xác nhận qua Kafka. Không cần processing_token:
     * chỉ cần payment vẫn đang PROCESSING (idempotent khi nhận lại event).
     */
    public boolean resolveSuccessFromBooking(UUID paymentId, String providerRef, Instant now) {
        int updated = jdbc.update("""
            UPDATE payments
               SET status = 'SUCCEEDED', provider_ref = ?, paid_at = ?,
                   processing_token = NULL, processing_started_at = NULL, updated_at = ?
             WHERE id = ? AND status = 'PROCESSING'
            """, providerRef, timestamp(now), timestamp(now), paymentId);
        if (updated == 0) return false;
        jdbc.update("""
            UPDATE payment_attempts SET status = 'SUCCEEDED', provider_ref = ?, ended_at = ?
             WHERE payment_id = ? AND status = 'PROCESSING'
            """, providerRef, timestamp(now), paymentId);
        return true;
    }

    /**
     * Booking từ chối payment đã thu tiền → hoàn tiền (mock: hoàn ngay) và chuyển REFUNDED.
     * Chỉ áp dụng khi payment còn PROCESSING (idempotent khi nhận lại event).
     */
    public boolean refundFromBooking(UUID paymentId, String code, String message, Instant now) {
        int updated = jdbc.update("""
            UPDATE payments
               SET status = 'REFUNDED', failure_code = ?, failure_message = ?, failed_at = ?,
                   processing_token = NULL, processing_started_at = NULL, updated_at = ?
             WHERE id = ? AND status = 'PROCESSING'
            """, code, message, timestamp(now), timestamp(now), paymentId);
        if (updated == 0) return false;
        jdbc.update("""
            UPDATE payment_attempts SET status = 'FAILED', failure_code = ?, failure_message = ?, ended_at = ?
             WHERE payment_id = ? AND status = 'PROCESSING'
            """, code, message, timestamp(now), paymentId);
        return true;
    }

    public List<UUID> findStuckIds(Instant leaseExpiredBefore, int limit) {
        return jdbc.query("""
            SELECT id FROM payments
             WHERE status = 'PROCESSING' AND processing_started_at <= ?
             ORDER BY processing_started_at
             LIMIT ?
            """, (rs, rowNum) -> rs.getObject("id", UUID.class), timestamp(leaseExpiredBefore), limit);
    }

    public long countAttempts(UUID paymentId) {
        Long value = jdbc.queryForObject("SELECT count(*) FROM payment_attempts WHERE payment_id = ?", Long.class, paymentId);
        return value == null ? 0 : value;
    }

    private Timestamp timestamp(Instant instant) {
        return Timestamp.from(instant);
    }
}
