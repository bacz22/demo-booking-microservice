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
