package com.cinebook.payment.kafka.outbox;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Poll bảng outbox_events và đẩy lên Kafka theo thứ tự tạo.
 * FOR UPDATE SKIP LOCKED cho phép chạy nhiều instance mà không gửi trùng một batch.
 * Gửi lỗi giữa chừng: dừng batch (giữ thứ tự), tăng attempts, lần poll sau thử lại.
 */
@Component
@ConditionalOnProperty(name = "app.outbox.publisher-enabled", havingValue = "true", matchIfMissing = true)
public class OutboxPublisher {
    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final JdbcTemplate jdbc;
    private final KafkaTemplate<String, String> kafka;
    private final int batchSize;
    private final long sendTimeoutMs;

    public OutboxPublisher(JdbcTemplate jdbc, KafkaTemplate<String, String> kafka,
                           @Value("${app.outbox.batch-size:100}") int batchSize,
                           @Value("${app.outbox.send-timeout-ms:5000}") long sendTimeoutMs) {
        this.jdbc = jdbc;
        this.kafka = kafka;
        this.batchSize = batchSize;
        this.sendTimeoutMs = sendTimeoutMs;
    }

    private record Row(UUID id, String topic, UUID aggregateId, String eventType, String payload) {}

    @Scheduled(fixedDelayString = "${app.outbox.poll-delay-ms:500}")
    @Transactional
    public void publishPending() {
        List<Row> rows = jdbc.query("""
                SELECT id, topic, aggregate_id, event_type, payload::text AS payload
                  FROM outbox_events
                 WHERE published_at IS NULL
                 ORDER BY created_at, id
                 LIMIT ?
                 FOR UPDATE SKIP LOCKED
                """, (rs, n) -> new Row(rs.getObject("id", UUID.class), rs.getString("topic"),
                rs.getObject("aggregate_id", UUID.class), rs.getString("event_type"), rs.getString("payload")), batchSize);

        for (Row row : rows) {
            try {
                ProducerRecord<String, String> record =
                        new ProducerRecord<>(row.topic(), row.aggregateId().toString(), row.payload());
                record.headers().add("eventType", row.eventType().getBytes(StandardCharsets.UTF_8));
                record.headers().add("eventId", row.id().toString().getBytes(StandardCharsets.UTF_8));
                kafka.send(record).get(sendTimeoutMs, TimeUnit.MILLISECONDS);
                jdbc.update("UPDATE outbox_events SET published_at = ?, attempts = attempts + 1, last_error = NULL WHERE id = ?",
                        Timestamp.from(Instant.now()), row.id());
                log.debug("Outbox published eventId={} type={} topic={}", row.id(), row.eventType(), row.topic());
            } catch (Exception ex) {
                if (ex instanceof InterruptedException) Thread.currentThread().interrupt();
                String error = String.valueOf(ex.getMessage());
                jdbc.update("UPDATE outbox_events SET attempts = attempts + 1, last_error = ? WHERE id = ?",
                        error.length() > 1000 ? error.substring(0, 1000) : error, row.id());
                log.warn("Outbox publish failed eventId={} type={}; will retry", row.id(), row.eventType(), ex);
                return;
            }
        }
    }
}
