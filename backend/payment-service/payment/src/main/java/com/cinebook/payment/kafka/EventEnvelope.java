package com.cinebook.payment.kafka;

import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/** Envelope chung cho mọi event Kafka giữa các service. aggregateId = bookingId (cũng là message key). */
public record EventEnvelope(
        UUID eventId,
        String eventType,
        int schemaVersion,
        UUID aggregateId,
        Instant occurredAt,
        String correlationId,
        String producer,
        JsonNode payload
) {
}
