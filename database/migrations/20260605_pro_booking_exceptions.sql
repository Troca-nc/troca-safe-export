CREATE TABLE IF NOT EXISTS pro_booking_exceptions (
  id              SERIAL PRIMARY KEY,
  pro_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exception_date  DATE         NOT NULL,
  is_unavailable  BOOLEAN      NOT NULL DEFAULT TRUE,
  reason          TEXT         DEFAULT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (pro_id, exception_date)
);

CREATE INDEX IF NOT EXISTS idx_pro_booking_exceptions_pro_date
  ON pro_booking_exceptions (pro_id, exception_date);
