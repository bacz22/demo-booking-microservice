package com.cinebook.booking.kafka;

import com.cinebook.booking.client.TheaterServiceClient;
import com.cinebook.booking.client.dto.TheaterSeatDto;
import com.cinebook.booking.client.dto.TheaterShowtimeDto;
import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.kafka.consumer.PaymentEventsConsumer;
import com.cinebook.booking.repository.RedisSeatHoldRepository;
import com.cinebook.booking.service.BookingPersistenceService;
import com.cinebook.booking.service.PersistBookingCommand;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Kiểm thử Saga phía booking với PostgreSQL thật: gọi thẳng consumer bằng ConsumerRecord
 * (không cần Kafka broker), rồi kiểm tra trạng thái booking + event trong outbox.
 */
@SpringBootTest
@ActiveProfiles("test")
class PaymentEventsConsumerTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
    private static final BigDecimal PRICE = new BigDecimal("90000.00");

    @Autowired PaymentEventsConsumer consumer;
    @Autowired BookingPersistenceService persistence;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper mapper;
    @MockitoBean TheaterServiceClient theater;
    @MockitoBean RedisSeatHoldRepository seatHolds;

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
        jdbc.update("DELETE FROM booking_seats");
        jdbc.update("DELETE FROM bookings");
        reset(theater, seatHolds);
        when(theater.getShowtime(any())).thenReturn(showtime("SELLING"));
    }

    @Test
    void paymentSucceeded_confirmsBooking_andIgnoresDuplicate() {
        Booking booking = newBooking();
        UUID paymentId = UUID.randomUUID();
        ConsumerRecord<String, String> record = succeeded(booking, paymentId);

        consumer.onMessage(record);
        consumer.onMessage(record); // Kafka giao lại cùng event

        assertEquals("CONFIRMED", status(booking));
        assertEquals(List.of("BookingConfirmed"), outboxTypes());
        assertEquals(paymentId, jdbc.queryForObject("SELECT payment_id FROM bookings WHERE id = ?", UUID.class, booking.getId()));
        verify(seatHolds, times(1)).release(any(), any(), any(), any());
        assertEquals(booking.getBookingCode(), jdbc.queryForObject(
            "SELECT payload -> 'payload' -> 'details' ->> 'bookingCode' FROM outbox_events", String.class));
        assertEquals("[\"A1\"]", jdbc.queryForObject(
            "SELECT payload -> 'payload' -> 'details' ->> 'seatLabels' FROM outbox_events", String.class));
        assertEquals(2, jdbc.queryForObject("SELECT (payload ->> 'schemaVersion')::int FROM outbox_events", Integer.class));
    }

    @Test
    void paymentSucceededTwiceWithNewEventId_republishesConfirmed() {
        Booking booking = newBooking();
        UUID paymentId = UUID.randomUUID();

        consumer.onMessage(succeeded(booking, paymentId));
        consumer.onMessage(succeeded(booking, paymentId)); // reconciliation phát lại với eventId mới

        assertEquals(List.of("BookingConfirmed", "BookingConfirmed"), outboxTypes());
    }

    @Test
    void paymentSucceeded_onCancelledBooking_isRejected() {
        Booking booking = newBooking();
        persistenceCancel(booking);

        consumer.onMessage(succeeded(booking, UUID.randomUUID()));

        assertEquals("CANCELLED", status(booking));
        assertEquals(List.of("BookingCancelled", "BookingPaymentRejected"), outboxTypes());
        assertEquals("BOOKING_CANCELLED", lastRejectReason());
    }

    @Test
    void paymentSucceeded_whenShowtimeNotSelling_cancelsAndRejects() {
        when(theater.getShowtime(any())).thenReturn(showtime("CANCELLED"));
        Booking booking = newBooking();

        consumer.onMessage(succeeded(booking, UUID.randomUUID()));

        assertEquals("CANCELLED", status(booking));
        assertEquals(List.of("BookingCancelled", "BookingPaymentRejected"), outboxTypes());
        assertEquals("SHOWTIME_NOT_SELLING", lastRejectReason());
    }

    @Test
    void paymentSucceeded_withWrongAmount_isRejected() {
        Booking booking = newBooking();

        consumer.onMessage(record("PaymentSucceeded", booking.getId(), new KafkaEvents.PaymentSucceeded(
            UUID.randomUUID(), booking.getId(), booking.getUserId(), new BigDecimal("1000"), "VND")));

        assertEquals("PENDING_PAYMENT", status(booking));
        assertEquals("PAYMENT_DATA_MISMATCH", lastRejectReason());
    }

    @Test
    void paymentFailed_cancelsBookingAndReleasesSeats() {
        Booking booking = newBooking();
        ConsumerRecord<String, String> record = record("PaymentFailed", booking.getId(), new KafkaEvents.PaymentFailed(
            UUID.randomUUID(), booking.getId(), booking.getUserId(), "CARD_DECLINED", "Thẻ bị từ chối"));

        consumer.onMessage(record);
        consumer.onMessage(record);

        assertEquals("CANCELLED", status(booking));
        assertEquals("PAYMENT_FAILED", jdbc.queryForObject(
            "SELECT cancel_reason FROM bookings WHERE id = ?", String.class, booking.getId()));
        assertEquals(List.of("BookingCancelled"), outboxTypes());
        verify(seatHolds, times(1)).release(eq(booking.getShowtimeId()), any(), eq(booking.getRequestId()), eq(booking.getUserId()));
    }

    // ---------- helpers ----------

    private Booking newBooking() {
        UUID seatId = UUID.randomUUID();
        TheaterSeatDto seat = new TheaterSeatDto(seatId, UUID.randomUUID(), "A", 1, "STANDARD", "A1");
        return persistence.create(new PersistBookingCommand(UUID.randomUUID(), "hash-" + UUID.randomUUID(),
            UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
            PRICE, Instant.now().plus(5, ChronoUnit.MINUTES), List.of(seat), List.of(PRICE), null));
    }

    private void persistenceCancel(Booking booking) {
        persistence.cancel(booking.getId(), booking.getUserId(), "USER_CANCELLED");
    }

    private ConsumerRecord<String, String> succeeded(Booking booking, UUID paymentId) {
        return record("PaymentSucceeded", booking.getId(), new KafkaEvents.PaymentSucceeded(
            paymentId, booking.getId(), booking.getUserId(), PRICE, "VND"));
    }

    private ConsumerRecord<String, String> record(String type, UUID bookingId, Object payload) {
        EventEnvelope envelope = new EventEnvelope(UUID.randomUUID(), type, 1, bookingId, Instant.now(),
            "test-correlation", "payment-service", mapper.valueToTree(payload));
        return new ConsumerRecord<>("payment.events", 0, 0L, bookingId.toString(), mapper.writeValueAsString(envelope));
    }

    private TheaterShowtimeDto showtime(String status) {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        return new TheaterShowtimeDto(UUID.randomUUID(), UUID.randomUUID(), "P1", "2D", UUID.randomUUID(), "R", "A", "HN",
            UUID.randomUUID(), start, start.plus(2, ChronoUnit.HOURS), 120, 15, PRICE, PRICE, PRICE, status, start, start);
    }

    private String status(Booking booking) {
        return jdbc.queryForObject("SELECT status FROM bookings WHERE id = ?", String.class, booking.getId());
    }

    private List<String> outboxTypes() {
        return jdbc.queryForList("SELECT event_type FROM outbox_events ORDER BY event_type", String.class);
    }

    private String lastRejectReason() {
        return jdbc.queryForObject("""
            SELECT payload -> 'payload' ->> 'reason' FROM outbox_events
             WHERE event_type = 'BookingPaymentRejected' ORDER BY created_at DESC LIMIT 1
            """, String.class);
    }
}
