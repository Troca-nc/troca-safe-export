-- Sprint 2: portfolio photos, freight module, stock visibility

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pro_portfolio_photos JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE products
SET is_available = CASE
  WHEN stock_quantity IS NULL THEN TRUE
  WHEN stock_quantity > 0 THEN TRUE
  ELSE FALSE
END;

ALTER TABLE pro_transporters
  ADD COLUMN IF NOT EXISTS has_fret BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fret_volume_m3 DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS fret_max_weight_kg INTEGER,
  ADD COLUMN IF NOT EXISTS fret_vehicle_type TEXT,
  ADD COLUMN IF NOT EXISTS fret_description TEXT,
  ADD COLUMN IF NOT EXISTS fret_price_per_m3_xpf INTEGER;

ALTER TABLE pro_transporters
  DROP CONSTRAINT IF EXISTS pro_transporters_fret_vehicle_type_check;

ALTER TABLE pro_transporters
  ADD CONSTRAINT pro_transporters_fret_vehicle_type_check
  CHECK (
    fret_vehicle_type IS NULL OR fret_vehicle_type IN (
      'fourgon',
      'camion',
      'plateau',
      'remorque',
      'pick-up',
      'autre'
    )
  );

CREATE TABLE IF NOT EXISTS fret_requests (
  id BIGSERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  departure TEXT NOT NULL,
  destination TEXT NOT NULL,
  volume_m3 DECIMAL(6,2),
  weight_kg INTEGER,
  description TEXT NOT NULL,
  object_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  budget_xpf INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'quoted', 'booked', 'closed')),
  quote_amount_xpf INTEGER,
  quoted_transporter_id INTEGER REFERENCES pro_transporters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fret_requests_author_created
  ON fret_requests (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fret_requests_status_created
  ON fret_requests (status, created_at DESC);
