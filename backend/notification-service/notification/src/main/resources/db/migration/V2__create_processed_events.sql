CREATE TABLE processed_events (
                                  event_id UUID NOT NULL,
                                  consumer_name VARCHAR(100) NOT NULL,
                                  event_type VARCHAR(100) NOT NULL,
                                  aggregate_id UUID NOT NULL,
                                  processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                  CONSTRAINT pk_processed_events
                                      PRIMARY KEY (event_id, consumer_name)
);

CREATE INDEX idx_processed_events_processed_at
    ON processed_events (processed_at);