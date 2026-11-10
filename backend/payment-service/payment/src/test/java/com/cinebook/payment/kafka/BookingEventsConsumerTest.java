package com.cinebook.payment.kafka;

import com.cinebook.payment.kafka.consumer.BookingEventsConsumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
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
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Kiểm thử Saga phía payment với PostgreSQL thật: gọi thẳng consumer bằng ConsumerRecord.
 */
@SpringBootTest
@ActiveProfiles("test")
class BookingEventsConsumerTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
    private static final BigDecimal AMOUNT = new BigDecimal("90000.00");

    @Autowired BookingEventsConsumer consumer;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper mapper;

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
        jdbc.update("DELETE FROM processed_events");
        jdbc.update("DELETE FROM payment_attempts");
        jdbc.update("DELETE FROM payments");
    }

    @Test
    void bookingConfirmed_marksPaymentSucceeded() {
        UUID bookingId = UUID.randomUUID();
        UUID paymentId = processingPayment(bookingId);
        ConsumerRecord<String, String> record = record("BookingConfirmed", bookingId,
            new KafkaEvents.BookingConfirmed(bookingId, UUID.randomUUID(), paymentId, AMOUNT, "VND", null));

        consumer.onMessage(record);
        consumer.onMessage(record);

        assertEquals("SUCCEEDED", status(paymentId));
        assertEquals("SUCCEEDED", attemptStatus(paymentId));
        assertEquals(1, processedCount());
    }

    @Test
    void bookingPaymentRejected_refundsPayment_andEmitsPaymentRefundedOnce() {
        UUID bookingId = UUID.randomUUID();
        UUID paymentId = processingPayment(bookingId);
        ConsumerRecord<String, String> record = record("BookingPaymentRejected", bookingId,
            new KafkaEvents.BookingPaymentRejected(bookingId, UUID.randomUUID(), paymentId,
                "BOOKING_EXPIRED", "Booking đã hết hạn giữ ghế"));

        consumer.onMessage(record);
        consumer.onMessage(record);

        assertEquals("REFUNDED", status(paymentId));
        assertEquals("BOOKING_EXPIRED",
            jdbc.queryForObject("SELECT failure_code FROM payments WHERE id = ?", String.class, paymentId));
        assertEquals(List.of("PaymentRefunded"),
            jdbc.queryForList("SELECT event_type FROM outbox_events", String.class));
    }

    @Test
    void rejectionAfterSuccess_doesNotRefund() {
        UUID bookingId = UUID.randomUUID();
        UUID paymentId = processingPayment(bookingId);
        consumer.onMessage(record("BookingConfirmed", bookingId,
            new KafkaEvents.BookingConfirmed(bookingId, UUID.randomUUID(), paymentId, AMOUNT, "VND", null)));

        consumer.onMessage(record("BookingPaymentRejected", bookingId,
            new KafkaEvents.BookingPaymentRejected(bookingId, UUID.randomUUID(), paymentId, "BOOKING_ALREADY_PAID", "x")));

        assertEquals("SUCCEEDED", status(paymentId));
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM outbox_events", Integer.class));
    }

    @Test
    void otherBookingEvents_areIgnored() {
        UUID bookingId = UUID.randomUUID();
        consumer.onMessage(record("BookingCancelled", bookingId,
            new KafkaEvents.BookingCancelled(bookingId, UUID.randomUUID(), "USER_CANCELLED", null)));

        assertEquals(0, processedCount());
    }

    // ---------- helpers ----------

    private UUID processingPayment(UUID bookingId) {
        UUID paymentId = UUID.randomUUID();
        UUID token = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.update("""
            INSERT INTO payments (id, payment_code, booking_id, user_id, request_id, request_hash,
                amount, currency, method, status, booking_expires_at, processing_token,
                processing_started_at, next_attempt_number, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'hash', ?, 'VND', 'MOCK', 'PROCESSING', ?, ?, ?, 1, 0, ?, ?)
            """, paymentId, "CP-" + paymentId.toString().substring(0, 8), bookingId, UUID.randomUUID(),
            UUID.randomUUID(), AMOUNT, Timestamp.from(now.plus(5, ChronoUnit.MINUTES)), token,
            Timestamp.from(now), Timestamp.from(now), Timestamp.from(now));
        jdbc.update("""
            INSERT INTO payment_attempts (id, payment_id, attempt_number, processing_token, status, started_at)
            VALUES (?, ?, 1, ?, 'PROCESSING', ?)
            """, UUID.randomUUID(), paymentId, token, Timestamp.from(now));
        return paymentId;
    }

    private ConsumerRecord<String, String> record(String type, UUID bookingId, Object payload) {
        EventEnvelope envelope = new EventEnvelope(UUID.randomUUID(), type, 1, bookingId, Instant.now(),
            "test-correlation", "booking-service", mapper.valueToTree(payload));
        return new ConsumerRecord<>("booking.events", 0, 0L, bookingId.toString(), mapper.writeValueAsString(envelope));
    }

    private String status(UUID paymentId) {
        return jdbc.queryForObject("SELECT status FROM payments WHERE id = ?", String.class, paymentId);
    }

    private String attemptStatus(UUID paymentId) {
        return jdbc.queryForObject("SELECT status FROM payment_attempts WHERE payment_id = ?", String.class, paymentId);
    }

    private int processedCount() {
        return jdbc.queryForObject("SELECT count(*) FROM processed_events", Integer.class);
    }
}
