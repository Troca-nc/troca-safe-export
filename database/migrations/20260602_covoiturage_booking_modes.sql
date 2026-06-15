-- ============================================================
-- Kalico - Réservations covoiturage auto / manuel + profils
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS rides_as_driver INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rides_as_passenger INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100;

ALTER TABLE users
  ALTER COLUMN trust_score SET DEFAULT 100;

CREATE TABLE IF NOT EXISTS user_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INTEGER REFERENCES users(id),
  reviewed_id INTEGER REFERENCES users(id),
  ride_id INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  role TEXT CHECK (role IN ('driver','passenger')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ride_bookings (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL REFERENCES covoiturages(id)
    ON DELETE CASCADE,
  passenger_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'auto_confirmed',
      'accepted',
      'refused',
      'cancelled'
    )),
  booking_mode TEXT NOT NULL
    CHECK (booking_mode IN ('auto','manual')),
  message TEXT,
  seats INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
    DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(ride_id, passenger_id)
);

ALTER TABLE covoiturages
  ADD COLUMN IF NOT EXISTS booking_mode TEXT DEFAULT 'auto'
  CHECK (booking_mode IN ('auto','manual'));

ALTER TABLE covoiturages
  ADD COLUMN IF NOT EXISTS seats_remaining INTEGER DEFAULT 3;

UPDATE covoiturages
SET seats_remaining = GREATEST(COALESCE(seats_total, 0) - COALESCE(seats_reserved, 0), 0)
WHERE seats_remaining IS NULL OR seats_remaining = 3;

CREATE INDEX IF NOT EXISTS idx_ride_bookings_ride
  ON ride_bookings (ride_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ride_bookings_passenger
  ON ride_bookings (passenger_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewed
  ON user_reviews (reviewed_id, created_at DESC);
