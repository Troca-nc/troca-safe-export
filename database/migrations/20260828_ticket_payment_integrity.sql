ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE tickets
  ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('reserved', 'active', 'used', 'cancelled', 'refunded'));

ALTER TABLE tickets
  ALTER COLUMN status SET DEFAULT 'reserved';
