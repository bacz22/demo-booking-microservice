ALTER TABLE payments DROP CONSTRAINT ck_payments_status;
ALTER TABLE payments ADD CONSTRAINT ck_payments_status
    CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED'));
