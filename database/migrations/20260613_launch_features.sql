-- ============================================================
-- Kalico — lancement : justificatifs Pro, paywall devis, covoiturage femmes seules
-- ============================================================

ALTER TABLE pro_quote_requests
  ADD COLUMN IF NOT EXISTS visible_free_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS pro_documents (
  id SERIAL PRIMARY KEY,
  pro_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL
    CHECK (document_type IN (
      'rc_pro',
      'assurance_decennale',
      'certification',
      'diplome',
      'extrait_ridet',
      'autre'
    )),
  label TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'validated', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  validated_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pro_documents_pro_status
  ON pro_documents (pro_id, status, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_documents_status_uploaded
  ON pro_documents (status, uploaded_at DESC);

ALTER TABLE annonces
  DROP CONSTRAINT IF EXISTS annonces_status_check;

ALTER TABLE annonces
  ADD CONSTRAINT annonces_status_check
  CHECK (status IN ('active', 'reserved', 'sold', 'expired', 'deleted', 'pending'));

ALTER TABLE covoiturages
  ADD COLUMN IF NOT EXISTS women_only BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_covoiturages_women_only
  ON covoiturages (women_only, ride_date, ride_time)
  WHERE women_only = TRUE;
