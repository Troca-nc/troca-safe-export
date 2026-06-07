-- ============================================================
-- Troca - Espace Pro (landing, profils et avis pro)
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_company_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_category TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_logo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_banner_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_hours TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_commune TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_siret TEXT;

CREATE TABLE IF NOT EXISTS pro_reviews (
  id SERIAL PRIMARY KEY,
  pro_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_reviews_pro
  ON pro_reviews (pro_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pro_reviews_reviewer
  ON pro_reviews (reviewer_id, created_at DESC);
