-- ============================================================
-- Kalico - Phase 3 Espace Pro Transport
-- Transporteurs pro, disponibilités, courses et paiements
-- ============================================================

CREATE TABLE IF NOT EXISTS pro_transporters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id)
    ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  transport_type TEXT[] NOT NULL,
  vehicle_description TEXT,
  vehicle_capacity INTEGER DEFAULT 4,
  vehicle_photo_url TEXT,
  license_number TEXT,
  insurance_number TEXT,
  base_price_xpf INTEGER DEFAULT 0,
  price_per_km_xpf INTEGER DEFAULT 0,
  service_zones TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  rides_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_availability (
  id SERIAL PRIMARY KEY,
  transporter_id INTEGER REFERENCES pro_transporters(id)
    ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pro_availability_exceptions (
  id SERIAL PRIMARY KEY,
  transporter_id INTEGER REFERENCES pro_transporters(id)
    ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_unavailable BOOLEAN DEFAULT TRUE,
  start_time TIME,
  end_time TIME,
  reason TEXT
);

CREATE TABLE IF NOT EXISTS pro_rides (
  id SERIAL PRIMARY KEY,
  transporter_id INTEGER REFERENCES pro_transporters(id),
  client_id INTEGER REFERENCES users(id),
  transport_type TEXT NOT NULL,
  departure TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_lat DECIMAL(9,6),
  departure_lng DECIMAL(9,6),
  destination_lat DECIMAL(9,6),
  destination_lng DECIMAL(9,6),
  ride_date DATE NOT NULL,
  ride_time TIME NOT NULL,
  passengers INTEGER DEFAULT 1,
  distance_km DECIMAL(8,2),
  price_xpf INTEGER NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending','confirmed','in_progress',
      'completed','cancelled','refunded'
    )),
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN (
      'pending','paid','refunded','failed'
    )),
  stripe_payment_id TEXT,
  invoice_number TEXT,
  notes TEXT,
  client_rating INTEGER CHECK (client_rating BETWEEN 1 AND 5),
  client_review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pro_transporters_user
  ON pro_transporters (user_id);

CREATE INDEX IF NOT EXISTS idx_pro_transporters_verified_available
  ON pro_transporters (is_verified, is_available);

CREATE INDEX IF NOT EXISTS idx_pro_availability_transporter
  ON pro_availability (transporter_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_pro_availability_exceptions_transporter
  ON pro_availability_exceptions (transporter_id, exception_date);

CREATE INDEX IF NOT EXISTS idx_pro_rides_transporter
  ON pro_rides (transporter_id, ride_date DESC, ride_time DESC);

CREATE INDEX IF NOT EXISTS idx_pro_rides_client
  ON pro_rides (client_id, ride_date DESC, ride_time DESC);

CREATE INDEX IF NOT EXISTS idx_pro_rides_status
  ON pro_rides (status, payment_status);

ALTER TABLE pro_transporters ADD COLUMN IF NOT EXISTS pro_phone TEXT;
ALTER TABLE pro_transporters ADD COLUMN IF NOT EXISTS pro_website TEXT;
ALTER TABLE pro_transporters ADD COLUMN IF NOT EXISTS pro_hours TEXT;
ALTER TABLE pro_transporters ADD COLUMN IF NOT EXISTS pro_siret TEXT;
