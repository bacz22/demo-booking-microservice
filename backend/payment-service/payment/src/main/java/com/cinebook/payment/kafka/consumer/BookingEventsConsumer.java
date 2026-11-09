package com.cinebook.payment.kafka.consumer;

import com.cinebook.payment.kafka.EventEnvelope;
import com.cinebook.payment.kafka.KafkaEvents;
import com.cinebook.payment.repository.ProcessedEventRepository;
import com.cinebook.payment.service.PaymentPersistenceService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;
import java.time.Instant;

/**
 * Nghe booking.events và chốt trạng thái payment:
 * BookingConfirmed → SUCCEEDED, BookingPaymentRejected → REFUNDED (+ PaymentRefunded). Các event khác bỏ qua.
 * Idempotent qua bảng processed_events (insert cùng transaction với update payment).
 */
@Component
public class BookingEventsConsumer {
    private static final Logger log = LoggerFactory.getLogger(BookingEventsConsumer.class);
    private static final String CONSUMER_NAME = "payment-booking-events-v1";

    private final JsonMapper mapper;
    private final ProcessedEventRepository processedEvents;
    private final PaymentPersistenceService persistence;
    private final Clock clock;

    public BookingEventsConsumer(JsonMapper mapper, ProcessedEventRepository processedEvents,
                                 PaymentPersistenceService persistence, Clock clock) {
        this.mapper = mapper;
        this.processedEvents = processedEvents;
        this.persistence = persistence;
        this.clock = clock;
    }

    @KafkaListener(topics = "${app.kafka.topics.booking-events:booking.events}")
    @Transactional
    public void onMessage(ConsumerRecord<String, String> record) {
        EventEnvelope event = mapper.readValue(record.value(), EventEnvelope.class);
        if (event.eventId() == null || event.eventType() == null) {
            throw new IllegalArgumentException("Event thiếu eventId/eventType");
        }
        if (event.correlationId() != null) MDC.put("correlationId", event.correlationId());
        try {
            switch (event.eventType()) {
                case KafkaEvents.BOOKING_CONFIRMED -> {
                    var payload = mapper.treeToValue(event.payload(), KafkaEvents.BookingConfirmed.class);
                    if (payload.paymentId() == null) return; // mock confirm, không liên quan payment
                    if (!register(event)) return;
                    boolean updated = persistence.succeedFromBooking(payload.paymentId(),
                        "MOCK-" + payload.paymentId(), Instant.now(clock));
                    log.info("BookingConfirmed applied. paymentId={} bookingId={} updated={}",
                        payload.paymentId(), payload.bookingId(), updated);
                }
                case KafkaEvents.BOOKING_PAYMENT_REJECTED -> {
                    var payload = mapper.treeToValue(event.payload(), KafkaEvents.BookingPaymentRejected.class);
                    if (payload.paymentId() == null) throw new IllegalArgumentException("paymentId is required");
                    if (!register(event)) return;
                    // Compensation: tiền đã thu nhưng không bán được vé → hoàn tiền.
                    // Khi tích hợp cổng thanh toán thật, gọi refund API của provider tại đây.
                    boolean updated = persistence.refundFromBooking(payload.paymentId(), payload.reason(),
                        payload.message(), Instant.now(clock));
                    log.warn("BookingPaymentRejected applied. paymentId={} bookingId={} reason={} updated={}",
                        payload.paymentId(), payload.bookingId(), payload.reason(), updated);
                }
                default -> log.debug("Ignore booking event type={} eventId={}", event.eventType(), event.eventId());
            }
        } finally {
            MDC.remove("correlationId");
        }
    }

    private boolean register(EventEnvelope event) {
        boolean first = processedEvents.tryRegister(event.eventId(), CONSUMER_NAME, event.eventType(), event.aggregateId());
        if (!first) log.info("Duplicate event ignored. eventId={} type={}", event.eventId(), event.eventType());
        return first;
    }
}
