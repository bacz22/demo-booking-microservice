CREATE SEQUENCE payment_code_seq START WITH 1 INCREMENT BY 1 NO CYCLE;

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    payment_code VARCHAR(32) NOT NULL,
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    request_id UUID NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    method VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    provider_ref VARCHAR(128),
    failure_code VARCHAR(64),
    failure_message VARCHAR(255),
    booking_expires_at TIMESTAMPTZ NOT NULL,
    processing_token UUID,
    processing_started_at TIMESTAMPTZ,
    next_attempt_number INTEGER NOT NULL DEFAULT 0,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payments_code UNIQUE (payment_code),
    CONSTRAINT uq_payments_booking UNIQUE (booking_id),
    CONSTRAINT uq_payments_request UNIQUE (request_id),
    CONSTRAINT ck_payments_amount CHECK (amount >= 0),
    CONSTRAINT ck_payments_status CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')),
    CONSTRAINT ck_payments_method CHECK (method IN ('MOCK')),
    CONSTRAINT ck_payments_attempts CHECK (next_attempt_number >= 0)
);

CREATE INDEX idx_payments_user_created ON payments (user_id, created_at DESC);
CREATE INDEX idx_payments_processing_lease ON payments (processing_started_at)
    WHERE status = 'PROCESSING';

CREATE TABLE payment_attempts (
    id UUID PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    attempt_number INTEGER NOT NULL,
    processing_token UUID NOT NULL,
    status VARCHAR(32) NOT NULL,
    provider_ref VARCHAR(128),
    failure_code VARCHAR(64),
    failure_message VARCHAR(255),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    CONSTRAINT uq_payment_attempt_number UNIQUE (payment_id, attempt_number),
    CONSTRAINT ck_payment_attempt_status CHECK (status IN ('PROCESSING', 'SUCCEEDED', 'FAILED', 'ABANDONED'))
);

CREATE INDEX idx_payment_attempts_payment ON payment_attempts (payment_id, attempt_number);

CREATE TABLE shedlock (
    name VARCHAR(64) NOT NULL,
    lock_until TIMESTAMPTZ NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL,
    locked_by VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
