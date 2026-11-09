package com.cinebook.payment.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public class ProcessedEventRepository {

    private final JdbcTemplate jdbcTemplate;

    public ProcessedEventRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean tryRegister(
            UUID eventId,
            String consumerName,
            String eventType,
            UUID aggregateId
    ) {
        int inserted = jdbcTemplate.update("""
            INSERT INTO processed_events (
                event_id,
                consumer_name,
                event_type,
                aggregate_id
            )
            VALUES (?, ?, ?, ?)
            ON CONFLICT (event_id, consumer_name) DO NOTHING
            """,
                eventId,
                consumerName,
                eventType,
                aggregateId
        );

        return inserted == 1;
    }
}