CREATE SEQUENCE booking_code_seq START WITH 1 INCREMENT BY 1 NO CYCLE;

CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    booking_code VARCHAR(32) NOT NULL,
    request_id UUID NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    user_id UUID NOT NULL,
    showtime_id UUID NOT NULL,
    movie_id UUID NOT NULL,
    theater_id UUID NOT NULL,
    auditorium_id UUID NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bookings_code UNIQUE (booking_code),
    CONSTRAINT uq_bookings_request_id UNIQUE (request_id),
    CONSTRAINT uq_bookings_id_showtime UNIQUE (id, showtime_id),
    CONSTRAINT ck_bookings_total_amount CHECK (total_amount >= 0),
    CONSTRAINT ck_bookings_status CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT ck_bookings_expiry CHECK (expires_at > created_at)
);

CREATE TABLE booking_seats (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    showtime_id UUID NOT NULL,
    seat_id UUID NOT NULL,
    row_label VARCHAR(10) NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type VARCHAR(20) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_booking_seats_booking_seat UNIQUE (booking_id, seat_id),
    CONSTRAINT ck_booking_seats_number CHECK (seat_number > 0),
    CONSTRAINT ck_booking_seats_price CHECK (price >= 0),
    CONSTRAINT ck_booking_seats_type CHECK (seat_type IN ('STANDARD', 'VIP', 'COUPLE')),
    CONSTRAINT ck_booking_seats_status CHECK (status IN ('HELD', 'SOLD', 'RELEASED')),
    CONSTRAINT fk_booking_seats_booking_showtime
        FOREIGN KEY (booking_id, showtime_id)
        REFERENCES bookings(id, showtime_id)
        ON DELETE RESTRICT
);

CREATE UNIQUE INDEX uq_booking_seats_showtime_seat_active
    ON booking_seats (showtime_id, seat_id)
    WHERE status IN ('HELD', 'SOLD');

CREATE INDEX idx_booking_seats_showtime_active
    ON booking_seats (showtime_id)
    WHERE status IN ('HELD', 'SOLD');

CREATE INDEX idx_bookings_pending_expires
    ON bookings (expires_at)
    WHERE status = 'PENDING_PAYMENT';

CREATE TABLE shedlock (
    name VARCHAR(64) NOT NULL,
    lock_until TIMESTAMPTZ NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL,
    locked_by VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
