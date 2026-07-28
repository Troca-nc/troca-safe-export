-- ============================================================
-- Kalico - Envoi & Livraison
-- Renommage du module fret et ajout des spécialités pro
-- ============================================================

ALTER TABLE IF EXISTS fret_requests RENAME TO delivery_requests;
ALTER TABLE IF EXISTS fret_request_offers RENAME TO delivery_offers;

ALTER TABLE IF EXISTS delivery_requests
  ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT 'fret_pro'
    CHECK (service_type IN ('colis', 'demenagement', 'fret_pro')),
  ADD COLUMN IF NOT EXISTS poids TEXT,
  ADD COLUMN IF NOT EXISTS fragile BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS volume TEXT,
  ADD COLUMN IF NOT EXISTS etage_depart TEXT,
  ADD COLUMN IF NOT EXISTS etage_arrivee TEXT,
  ADD COLUMN IF NOT EXISTS manutention BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nb_pieces TEXT,
  ADD COLUMN IF NOT EXISTS urgence TEXT,
  ADD COLUMN IF NOT EXISTS type_marchandise TEXT;

ALTER TABLE IF EXISTS pro_transporters
  ADD COLUMN IF NOT EXISTS specialite_colis BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS specialite_demenagement BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS specialite_fret_pro BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fret_requests_status_check'
  ) THEN
    ALTER TABLE delivery_requests DROP CONSTRAINT IF EXISTS fret_requests_status_check;
  END IF;
END $$;

ALTER TABLE IF EXISTS delivery_requests
  ADD CONSTRAINT delivery_requests_status_check
  CHECK (status IN ('open', 'closed', 'cancelled', 'delivered', 'expired', 'selected', 'confirmed'));

ALTER TABLE IF EXISTS delivery_requests
  DROP CONSTRAINT IF EXISTS fret_requests_selected_offer_fk;

ALTER TABLE IF EXISTS delivery_requests
  DROP CONSTRAINT IF EXISTS delivery_requests_selected_offer_fk;

ALTER TABLE IF EXISTS delivery_requests
  ADD CONSTRAINT delivery_requests_selected_offer_fk
  FOREIGN KEY (selected_offer_id) REFERENCES delivery_offers(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_offers_unique_transporter
  ON delivery_offers (request_id, transporter_id);

CREATE INDEX IF NOT EXISTS idx_delivery_offers_request_created
  ON delivery_offers (request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_offers_transporter_created
  ON delivery_offers (transporter_user_id, created_at DESC);

