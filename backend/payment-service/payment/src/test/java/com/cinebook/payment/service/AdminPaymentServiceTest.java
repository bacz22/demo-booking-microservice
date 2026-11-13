package com.cinebook.payment.service;

import com.cinebook.payment.controller.dto.PaymentResponse;
import com.cinebook.payment.domain.enums.PaymentStatus;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@SpringBootTest
@ActiveProfiles("test")
class AdminPaymentServiceTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

    @Autowired AdminPaymentService admin;
    @Autowired JdbcTemplate jdbc;

    @DynamicPropertySource
    static void registerPostgresProperties(DynamicPropertyRegistry registry) {
        POSTGRES.start();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @AfterAll
    static void stop() { POSTGRES.stop(); }

    @BeforeEach
    void clean() {
        jdbc.update("DELETE FROM outbox_events");
        jdbc.update("DELETE FROM payment_attempts");
        jdbc.update("DELETE FROM payments");
    }

    @Test
    void list_filtersByStatusAndCode_andSortsByAmount() {
        UUID small = payment("CP-00000001", PaymentStatus.SUCCEEDED, "50000", null);
        UUID big = payment("CP-00000002", PaymentStatus.FAILED, "200000", "CARD_DECLINED");

        assertEquals(List.of(big), ids(admin.list(filter(null, PaymentStatus.FAILED, "createdAt", "desc")).items()));
        assertEquals(List.of(small), ids(admin.list(filter("cp-00000001", null, "createdAt", "desc")).items()));
        assertEquals(List.of(big), ids(admin.list(filter("declined", null, "createdAt", "desc")).items()));
        assertEquals(List.of(small, big), ids(admin.list(filter(null, null, "amount", "asc")).items()));
    }

    @Test
    void summary_groupsByStatus_andComputesSuccessRate() {
        payment("CP-1", PaymentStatus.SUCCEEDED, "100000", null);
        payment("CP-2", PaymentStatus.SUCCEEDED, "100000", null);
        payment("CP-3", PaymentStatus.FAILED, "50000", "CARD_DECLINED");
        payment("CP-4", PaymentStatus.REFUNDED, "70000", "BOOKING_EXPIRED");
        payment("CP-5", PaymentStatus.PROCESSING, "30000", null);

        LocalDate today = LocalDate.now(AdminPaymentService.ZONE);
        var s = admin.summary(today.minusDays(1), today);

        assertEquals(5, s.totalCount());
        assertEquals(0, new BigDecimal("350000.00").compareTo(s.totalAmount()));
        assertEquals(2, s.byStatus().get("SUCCEEDED").count());
        assertEquals(0, new BigDecimal("200000.00").compareTo(s.byStatus().get("SUCCEEDED").amount()));
        assertEquals(0.5, s.successRate()); // 2 / (2 thành công + 1 thất bại + 1 hoàn tiền)
    }

    @Test
    void summary_withoutFinishedPayments_hasNoSuccessRate() {
        LocalDate today = LocalDate.now(AdminPaymentService.ZONE);
        assertNull(admin.summary(today, today).successRate());
    }

    @Test
    void get_returnsAttempts() {
        UUID id = payment("CP-9", PaymentStatus.FAILED, "90000", "CARD_DECLINED");
        jdbc.update("""
            INSERT INTO payment_attempts (id, payment_id, attempt_number, processing_token, status, failure_code, started_at, ended_at)
            VALUES (?, ?, 1, ?, 'FAILED', 'CARD_DECLINED', now(), now())
            """, UUID.randomUUID(), id, UUID.randomUUID());

        var detail = admin.get(id);

        assertEquals("CP-9", detail.payment().paymentCode());
        assertEquals(1, detail.attempts().size());
        assertEquals("CARD_DECLINED", detail.attempts().getFirst().failureCode());
    }

    // ---------- helpers ----------

    private UUID payment(String code, PaymentStatus status, String amount, String failureCode) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.update("""
            INSERT INTO payments (id, payment_code, booking_id, user_id, request_id, request_hash, amount, currency,
                method, status, failure_code, booking_expires_at, next_attempt_number, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'hash', ?, 'VND', 'MOCK', ?, ?, ?, 1, 0, ?, ?)
            """, id, code, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal(amount),
            status.name(), failureCode, Timestamp.from(now.plus(5, ChronoUnit.MINUTES)), Timestamp.from(now), Timestamp.from(now));
        return id;
    }

    private static List<UUID> ids(List<PaymentResponse> items) {
        return items.stream().map(PaymentResponse::id).toList();
    }

    private static AdminPaymentService.Filter filter(String q, PaymentStatus status, String sortBy, String order) {
        return new AdminPaymentService.Filter(q, status, null, null, null, null, sortBy, order, 0, 20);
    }
}
