ALTER TABLE pro_bookings
  ADD COLUMN IF NOT EXISTS booking_access_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pro_bookings_access_token
  ON pro_bookings (booking_access_token);
