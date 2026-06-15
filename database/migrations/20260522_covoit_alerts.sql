-- ============================================================
-- Kalico â€” Alertes trajet covoiturage
-- ============================================================

CREATE TABLE IF NOT EXISTS covoit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  from_commune VARCHAR(100),
  to_commune VARCHAR(100),
  jour_semaine INTEGER,
  heure_min TIME,
  heure_max TIME,

  via_push BOOLEAN NOT NULL DEFAULT true,
  via_email BOOLEAN NOT NULL DEFAULT false,

  active BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT covoit_alerts_jour_check CHECK (jour_semaine IS NULL OR jour_semaine BETWEEN 0 AND 6)
);

CREATE INDEX IF NOT EXISTS idx_covoit_alerts_active
  ON covoit_alerts (active, from_commune, to_commune)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_covoit_alerts_user
  ON covoit_alerts (user_id);

DROP TRIGGER IF EXISTS trg_covoit_alerts_updated_at ON covoit_alerts;
CREATE TRIGGER trg_covoit_alerts_updated_at
  BEFORE UPDATE ON covoit_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
