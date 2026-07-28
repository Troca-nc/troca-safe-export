-- ============================================================
-- Kalico - Appel d'offres fret
-- Ajout du modèle de demande avec fenêtre de réponse
-- ============================================================

ALTER TABLE fret_requests
  ADD COLUMN IF NOT EXISTS departure_commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cargo_type TEXT,
  ADD COLUMN IF NOT EXISTS volume_bucket TEXT,
  ADD COLUMN IF NOT EXISTS weight_bucket TEXT,
  ADD COLUMN IF NOT EXISTS urgency TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS response_deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_min_xpf INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_max_xpf INTEGER,
  ADD COLUMN IF NOT EXISTS selected_offer_id BIGINT,
  ADD COLUMN IF NOT EXISTS selected_transporter_id INTEGER REFERENCES pro_transporters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS selected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS selection_change_deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS selection_method TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE fret_requests
  ALTER COLUMN status SET DEFAULT 'open';

UPDATE fret_requests
SET status = CASE status
  WHEN 'quoted' THEN 'awaiting_offers'
  WHEN 'booked' THEN 'selected'
  WHEN 'closed' THEN 'delivered'
  ELSE status
END;

ALTER TABLE fret_requests
  DROP CONSTRAINT IF EXISTS fret_requests_status_check;

ALTER TABLE fret_requests
  ADD CONSTRAINT fret_requests_status_check
  CHECK (status IN ('open', 'awaiting_offers', 'selected', 'confirmed', 'in_progress', 'delivered', 'expired', 'cancelled'));

CREATE TABLE IF NOT EXISTS fret_request_offers (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES fret_requests(id) ON DELETE CASCADE,
  transporter_id INTEGER NOT NULL REFERENCES pro_transporters(id) ON DELETE CASCADE,
  transporter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_xpf INTEGER NOT NULL CHECK (amount_xpf > 0),
  pickup_date DATE NOT NULL,
  pickup_slot TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'selected', 'rejected', 'withdrawn')),
  score DECIMAL(8,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  selected_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fret_request_offers_unique_transporter
  ON fret_request_offers (request_id, transporter_id);

CREATE INDEX IF NOT EXISTS idx_fret_request_offers_request_created
  ON fret_request_offers (request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fret_request_offers_transporter_created
  ON fret_request_offers (transporter_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fret_request_offers_status
  ON fret_request_offers (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fret_requests_deadline
  ON fret_requests (status, response_deadline_at)
  WHERE response_deadline_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fret_requests_selected_transporter
  ON fret_requests (selected_transporter_id, selected_at DESC);

DROP TRIGGER IF EXISTS trg_fret_requests_updated_at ON fret_requests;
CREATE TRIGGER trg_fret_requests_updated_at
  BEFORE UPDATE ON fret_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_fret_request_offers_updated_at ON fret_request_offers;
CREATE TRIGGER trg_fret_request_offers_updated_at
  BEFORE UPDATE ON fret_request_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE fret_requests
  DROP CONSTRAINT IF EXISTS fret_requests_selected_offer_fk;

ALTER TABLE fret_requests
  ADD CONSTRAINT fret_requests_selected_offer_fk
  FOREIGN KEY (selected_offer_id) REFERENCES fret_request_offers(id) ON DELETE SET NULL;
