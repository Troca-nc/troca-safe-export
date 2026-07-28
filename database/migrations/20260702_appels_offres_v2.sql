-- ============================================================
-- Kalico — Appels d'offres v2
-- Flow compétitif mixte (open / targeted)
-- ============================================================

CREATE TABLE IF NOT EXISTS pro_profiles (
  id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO pro_profiles (id)
SELECT id
FROM users
WHERE is_pro = TRUE
  AND deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION sync_pro_profiles_from_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_pro = TRUE AND NEW.deleted_at IS NULL THEN
    INSERT INTO pro_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    DELETE FROM pro_profiles WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_sync_pro_profiles ON users;
CREATE TRIGGER trg_users_sync_pro_profiles
  AFTER INSERT OR UPDATE OF is_pro, deleted_at ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_pro_profiles_from_users();

CREATE TABLE IF NOT EXISTS quote_requests (
  id BIGSERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK (mode IN ('open', 'targeted')),
  category_slug TEXT NOT NULL,
  commune TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT NOT NULL,
  budget_min_xpf INTEGER,
  budget_max_xpf INTEGER,
  desired_date DATE,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_status_created_at
  ON quote_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quote_requests_category_mode
  ON quote_requests (category_slug, mode, status);

DROP TRIGGER IF EXISTS trg_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER trg_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS quote_request_targets (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT REFERENCES quote_requests(id) ON DELETE CASCADE,
  pro_id INTEGER REFERENCES pro_profiles(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_request_targets_request_pro
  ON quote_request_targets (request_id, pro_id);

CREATE INDEX IF NOT EXISTS idx_quote_request_targets_request_id
  ON quote_request_targets (request_id);

CREATE INDEX IF NOT EXISTS idx_quote_request_targets_pro_id
  ON quote_request_targets (pro_id);

CREATE TABLE IF NOT EXISTS quote_request_offers (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT REFERENCES quote_requests(id) ON DELETE CASCADE,
  pro_id INTEGER REFERENCES pro_profiles(id) ON DELETE CASCADE,
  pro_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount_xpf INTEGER NOT NULL CHECK (amount_xpf > 0),
  delay_days INTEGER NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'selected', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_request_offers_request_pro
  ON quote_request_offers (request_id, pro_id);

CREATE INDEX IF NOT EXISTS idx_quote_request_offers_request_id
  ON quote_request_offers (request_id);

CREATE INDEX IF NOT EXISTS idx_quote_request_offers_pro_id
  ON quote_request_offers (pro_id);

CREATE INDEX IF NOT EXISTS idx_quote_request_offers_status
  ON quote_request_offers (status);

DROP TRIGGER IF EXISTS trg_quote_request_offers_updated_at ON quote_request_offers;
CREATE TRIGGER trg_quote_request_offers_updated_at
  BEFORE UPDATE ON quote_request_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS quote_request_selections (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT REFERENCES quote_requests(id) ON DELETE CASCADE,
  offer_id BIGINT REFERENCES quote_request_offers(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT DEFAULT 'manual'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_request_selections_request_id
  ON quote_request_selections (request_id);

CREATE INDEX IF NOT EXISTS idx_quote_request_selections_offer_id
  ON quote_request_selections (offer_id);

