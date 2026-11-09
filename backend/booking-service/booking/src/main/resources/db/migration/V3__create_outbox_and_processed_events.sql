CREATE TABLE outbox_events (
    id           UUID PRIMARY KEY,
    topic        VARCHAR(200) NOT NULL,
    aggregate_id UUID         NOT NULL,
    event_type   VARCHAR(100) NOT NULL,
    payload      JSONB        NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    attempts     INT          NOT NULL DEFAULT 0,
    last_error   VARCHAR(1000)
);

CREATE INDEX idx_outbox_events_unpublished
    ON outbox_events (created_at, id)
    WHERE published_at IS NULL;

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