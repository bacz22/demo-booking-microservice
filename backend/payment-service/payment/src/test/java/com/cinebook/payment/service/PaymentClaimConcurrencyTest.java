package com.cinebook.payment;

import com.cinebook.payment.repository.ClaimedPayment;
import com.cinebook.payment.service.PaymentPersistenceService;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class PaymentClaimConcurrencyTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

    @Autowired JdbcTemplate jdbc;
    @Autowired PaymentPersistenceService persistence;

    @DynamicPropertySource
    static void registerPostgresProperties(DynamicPropertyRegistry registry) {
        POSTGRES.start();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("payment.processing.reconciliation-enabled", () -> false);
    }

    @BeforeEach
    void cleanDatabase() {
        jdbc.update("DELETE FROM payment_attempts");
        jdbc.update("DELETE FROM payments");
    }

    @AfterAll
    static void stopContainer() {
        POSTGRES.stop();
    }

    @Test
    void onlyOneWorkerClaimsAnExpiredProcessingPayment() throws Exception {
        UUID paymentId = UUID.randomUUID();
        UUID oldToken = UUID.randomUUID();
        Instant old = Instant.now().minus(10, ChronoUnit.MINUTES);
        jdbc.update("""
            INSERT INTO payments (id, payment_code, booking_id, user_id, request_id, request_hash,
                amount, currency, method, status, booking_expires_at, processing_token,
                processing_started_at, next_attempt_number, version, created_at, updated_at)
            VALUES (?, 'CP-STRESS', ?, ?, ?, 'hash', ?, 'VND', 'MOCK', 'PROCESSING', ?, ?, ?, 1, 0, ?, ?)
            """, paymentId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("100.00"),
            Timestamp.from(Instant.now().plus(5, ChronoUnit.MINUTES)), oldToken,
            Timestamp.from(old), Timestamp.from(old), Timestamp.from(old));
        jdbc.update("""
            INSERT INTO payment_attempts (id, payment_id, attempt_number, processing_token, status, started_at)
            VALUES (?, ?, 1, ?, 'PROCESSING', ?)
            """, UUID.randomUUID(), paymentId, oldToken, Timestamp.from(old));

        int workers = 32;
        ExecutorService executor = Executors.newFixedThreadPool(workers);
        CountDownLatch ready = new CountDownLatch(workers);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Optional<ClaimedPayment>>> futures = new ArrayList<>();
        for (int i = 0; i < workers; i++) {
            futures.add(executor.submit(() -> {
                ready.countDown();
                start.await();
                Instant now = Instant.now();
                return persistence.claim(paymentId, UUID.randomUUID(), now, now.minus(60, ChronoUnit.SECONDS));
            }));
        }
        ready.await();
        start.countDown();
        int winners = 0;
        ClaimedPayment winner = null;
        for (Future<Optional<ClaimedPayment>> future : futures) {
            Optional<ClaimedPayment> result = future.get();
            if (result.isPresent()) winners++;
            if (result.isPresent()) winner = result.get();
        }
        executor.shutdownNow();

        assertEquals(1, winners);
        assertNotNull(winner);
        Integer activeAttempts = jdbc.queryForObject(
            "SELECT count(*) FROM payment_attempts WHERE payment_id = ? AND status = 'PROCESSING'", Integer.class, paymentId);
        assertEquals(1, activeAttempts);
        assertEquals(1, jdbc.queryForObject(
            "SELECT count(*) FROM payment_attempts WHERE payment_id = ? AND status = 'ABANDONED'", Integer.class, paymentId));
        UUID storedToken = jdbc.queryForObject("SELECT processing_token FROM payments WHERE id = ?", UUID.class, paymentId);
        assertEquals(winner.processingToken(), storedToken);
        assertTrue(jdbc.queryForObject("SELECT status FROM payments WHERE id = ?", String.class, paymentId).equals("PROCESSING"));
    }
}
