ALTER TABLE ride_bookings
  ADD COLUMN IF NOT EXISTS review_reminder_sent_at TIMESTAMPTZ;
