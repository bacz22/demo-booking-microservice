package com.cinebook.notification.kafka;

import com.cinebook.notification.kafka.consumer.NotificationEventsConsumer;
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
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Gọi thẳng consumer bằng ConsumerRecord với PostgreSQL thật (không cần Kafka broker). */
@SpringBootTest
@ActiveProfiles("test")
class NotificationEventsConsumerTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
    private static final BigDecimal AMOUNT = new BigDecimal("180000.00");

    @Autowired NotificationEventsConsumer consumer;
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
        jdbc.update("DELETE FROM notifications");
        jdbc.update("DELETE FROM processed_events");
    }

    @Test
    void bookingConfirmed_createsNotificationOnce() {
        UUID bookingId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        var details = new KafkaEvents.BookingDetails("BK-123", UUID.randomUUID(), UUID.randomUUID(),
            UUID.randomUUID(), List.of("A1", "A2"), AMOUNT, "VND");
        ConsumerRecord<String, String> record = record("BookingConfirmed", bookingId,
            new KafkaEvents.BookingConfirmed(bookingId, userId, UUID.randomUUID(), AMOUNT, "VND", details));

        consumer.onMessage(record);
        consumer.onMessage(record); // Kafka giao lại cùng event

        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM notifications");
        assertEquals(1, count());
        assertEquals("BOOKING_CONFIRMED", row.get("type"));
        assertEquals(userId, row.get("user_id"));
        assertEquals(bookingId, row.get("booking_id"));
        String body = (String) row.get("body");
        assertTrue(body.contains("BK-123") && body.contains("A1, A2") && body.contains("180.000"), body);
    }

    @Test
    void bookingCancelledByPaymentFailure_explainsReason() {
        UUID bookingId = UUID.randomUUID();
        consumer.onMessage(record("BookingCancelled", bookingId,
            new KafkaEvents.BookingCancelled(bookingId, UUID.randomUUID(), "PAYMENT_FAILED", null)));

        assertEquals("BOOKING_CANCELLED", jdbc.queryForObject("SELECT type FROM notifications", String.class));
        assertTrue(jdbc.queryForObject("SELECT body FROM notifications", String.class)
            .contains("thanh toán không thành công"));
    }

    @Test
    void bookingExpiredAndPaymentRefunded_createNotifications() {
        UUID bookingId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        consumer.onMessage(record("BookingExpired", bookingId,
            new KafkaEvents.BookingExpired(bookingId, userId, null)));
        consumer.onMessage(record("PaymentRefunded", bookingId,
            new KafkaEvents.PaymentRefunded(UUID.randomUUID(), bookingId, userId, AMOUNT, "VND", "BOOKING_EXPIRED")));

        assertEquals(List.of("BOOKING_EXPIRED", "PAYMENT_REFUNDED"),
            jdbc.queryForList("SELECT type FROM notifications ORDER BY type", String.class));
    }

    @Test
    void eventsWithoutUserFacingMeaning_areIgnored() {
        UUID bookingId = UUID.randomUUID();
        consumer.onMessage(record("PaymentSucceeded", bookingId,
            new KafkaEvents.PaymentSucceeded(UUID.randomUUID(), bookingId, UUID.randomUUID(), AMOUNT, "VND")));
        consumer.onMessage(record("BookingPaymentRejected", bookingId,
            new KafkaEvents.BookingPaymentRejected(bookingId, UUID.randomUUID(), UUID.randomUUID(), "BOOKING_EXPIRED", "x")));

        assertEquals(0, count());
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM processed_events", Integer.class));
    }

    @Test
    void invalidJson_isRejectedAsNonRetryable() {
        var bad = new ConsumerRecord<>("booking.events", 0, 0L, "k", "{not-json");
        assertThrows(tools.jackson.core.JacksonException.class, () -> consumer.onMessage(bad));
    }

    // ---------- helpers ----------

    private ConsumerRecord<String, String> record(String type, UUID bookingId, Object payload) {
        EventEnvelope envelope = new EventEnvelope(UUID.randomUUID(), type, 2, bookingId, Instant.now(),
            "test-correlation", "booking-service", mapper.valueToTree(payload));
        return new ConsumerRecord<>("booking.events", 0, 0L, bookingId.toString(), mapper.writeValueAsString(envelope));
    }

    private int count() {
        return jdbc.queryForObject("SELECT count(*) FROM notifications", Integer.class);
    }
}
