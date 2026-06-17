-- Kalico â€” Sprint 4: routes covoiturage, catalogues PDF, coupons, cinema scraper

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pro_catalog_pdf_url TEXT;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS catalog_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS catalog_pdf_pages INTEGER;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS catalog_pdf_url TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS booking_url TEXT,
  ADD COLUMN IF NOT EXISTS movie_poster_url TEXT,
  ADD COLUMN IF NOT EXISTS room TEXT,
  ADD COLUMN IF NOT EXISTS version TEXT,
  ADD COLUMN IF NOT EXISTS is_3d BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS price_normal_xpf INTEGER,
  ADD COLUMN IF NOT EXISTS price_reduced_xpf INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_external_id
  ON events (external_id)
  WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  pro_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bon_plan_id INTEGER REFERENCES bon_plans(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL
    CHECK (discount_type IN ('percent', 'fixed_xpf', 'free_item', 'free_shipping', 'other')),
  discount_value INTEGER,
  min_purchase_xpf INTEGER DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  uses_per_user INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_uses (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  order_ref TEXT
);

CREATE INDEX IF NOT EXISTS idx_coupons_pro_created
  ON coupons (pro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_code_active
  ON coupons (code, is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon_user
  ON coupon_uses (coupon_id, user_id, used_at DESC);
