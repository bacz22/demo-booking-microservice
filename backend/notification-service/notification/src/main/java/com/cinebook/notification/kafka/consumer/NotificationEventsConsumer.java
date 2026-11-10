package com.cinebook.notification.kafka.consumer;

import com.cinebook.notification.domain.Notification;
import com.cinebook.notification.kafka.EventEnvelope;
import com.cinebook.notification.kafka.KafkaEvents;
import com.cinebook.notification.repository.NotificationRepository;
import com.cinebook.notification.repository.ProcessedEventRepository;
import com.cinebook.notification.service.NotificationComposer;
import com.cinebook.notification.service.NotificationComposer.Message;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

/**
 * Nghe booking.events + payment.events, biến event thành thông báo cho người dùng.
 * Idempotent theo eventId (processed_events cùng transaction với insert notification).
 * Kênh "email" hiện chỉ log; thông báo lưu DB để web hiển thị qua API.
 */
@Component
public class NotificationEventsConsumer {
    private static final Logger log = LoggerFactory.getLogger(NotificationEventsConsumer.class);
    private static final String CONSUMER_NAME = "notification-v1";

    private final JsonMapper mapper;
    private final ProcessedEventRepository processedEvents;
    private final NotificationRepository notifications;
    private final Clock clock;

    public NotificationEventsConsumer(JsonMapper mapper, ProcessedEventRepository processedEvents,
                                      NotificationRepository notifications, Clock clock) {
        this.mapper = mapper;
        this.processedEvents = processedEvents;
        this.notifications = notifications;
        this.clock = clock;
    }

    @KafkaListener(topics = {"${app.kafka.topics.booking-events:booking.events}",
                             "${app.kafka.topics.payment-events:payment.events}"})
    @Transactional
    public void onMessage(ConsumerRecord<String, String> record) {
        EventEnvelope event = mapper.readValue(record.value(), EventEnvelope.class);
        if (event.eventId() == null || event.eventType() == null) {
            throw new IllegalArgumentException("Event thiếu eventId/eventType");
        }
        if (event.correlationId() != null) MDC.put("correlationId", event.correlationId());
        try {
            handle(event);
        } finally {
            MDC.remove("correlationId");
        }
    }

    private void handle(EventEnvelope event) {
        switch (event.eventType()) {
            case KafkaEvents.BOOKING_CONFIRMED -> {
                var p = read(event, KafkaEvents.BookingConfirmed.class);
                save(event, p.userId(), p.bookingId(), NotificationComposer.confirmed(p));
            }
            case KafkaEvents.BOOKING_CANCELLED -> {
                var p = read(event, KafkaEvents.BookingCancelled.class);
                save(event, p.userId(), p.bookingId(), NotificationComposer.cancelled(p));
            }
            case KafkaEvents.BOOKING_EXPIRED -> {
                var p = read(event, KafkaEvents.BookingExpired.class);
                save(event, p.userId(), p.bookingId(), NotificationComposer.expired(p));
            }
            case KafkaEvents.PAYMENT_REFUNDED -> {
                var p = read(event, KafkaEvents.PaymentRefunded.class);
                save(event, p.userId(), p.bookingId(), NotificationComposer.refunded(p));
            }
            default -> log.debug("Ignore event type={} eventId={}", event.eventType(), event.eventId());
        }
    }

    private <T> T read(EventEnvelope event, Class<T> type) {
        return mapper.treeToValue(event.payload(), type);
    }

    private void save(EventEnvelope event, UUID userId, UUID bookingId, Message message) {
        if (userId == null) throw new IllegalArgumentException(event.eventType() + " thiếu userId");
        if (!processedEvents.tryRegister(event.eventId(), CONSUMER_NAME, event.eventType(),
                bookingId != null ? bookingId : event.aggregateId())) {
            log.info("Duplicate event ignored. eventId={} type={}", event.eventId(), event.eventType());
            return;
        }
        JsonNode data = event.payload();
        notifications.insert(new Notification(UUID.randomUUID(), userId, bookingId, message.type(),
            message.title(), message.body(), data, null, Instant.now(clock)));
        log.info("[EMAIL] to user={} subject=\"{}\" body=\"{}\"", userId, message.title(), message.body());
    }
}
