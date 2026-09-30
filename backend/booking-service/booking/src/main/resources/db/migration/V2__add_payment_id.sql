ALTER TABLE bookings ADD COLUMN payment_id UUID;

ALTER TABLE bookings
    ADD CONSTRAINT uq_bookings_payment_id UNIQUE (payment_id);

CREATE INDEX idx_bookings_payment_id ON bookings (payment_id);
