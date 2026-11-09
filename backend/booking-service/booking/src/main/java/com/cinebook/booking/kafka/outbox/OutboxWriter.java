package com.cinebook.booking.kafka.outbox;

import com.cinebook.booking.kafka.EventEnvelope;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

/**
 * Ghi event vào bảng outbox_events trong CÙNG transaction với thay đổi nghiệp vụ.
 * {@link OutboxPublisher} sẽ đẩy lên Kafka sau khi transaction commit.
 */
@Component
public class OutboxWriter {
    private final JdbcTemplate jdbc;
    private final JsonMapper mapper;
    private final Clock clock;
    private final String producer;

    public OutboxWriter(JdbcTemplate jdbc, JsonMapper mapper, Clock clock,
                        @Value("${spring.application.name}") String producer) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.clock = clock;
        this.producer = producer;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public UUID write(String topic, UUID aggregateId, String eventType, Object payload) {
        UUID eventId = UUID.randomUUID();
        Instant now = Instant.now(clock);
        EventEnvelope envelope = new EventEnvelope(eventId, eventType, 1, aggregateId, now,
                MDC.get("correlationId"), producer, mapper.valueToTree(payload));
        jdbc.update("""
                INSERT INTO outbox_events (id, topic, aggregate_id, event_type, payload, created_at)
                VALUES (?, ?, ?, ?, CAST(? AS jsonb), ?)
                """, eventId, topic, aggregateId, eventType, mapper.writeValueAsString(envelope), Timestamp.from(now));
        return eventId;
    }
}
