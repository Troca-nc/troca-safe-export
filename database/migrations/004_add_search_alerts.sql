-- ── Migration SQL — Alertes de recherche ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS search_alerts (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label              VARCHAR(200) NOT NULL,
  filters            JSONB        NOT NULL DEFAULT '{}',
  frequency          VARCHAR(20)  NOT NULL DEFAULT 'daily'
                       CHECK (frequency IN ('immediate', 'daily', 'weekly')),
  status             VARCHAR(20)  NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'paused', 'deleted')),
  nb_results         INTEGER      NOT NULL DEFAULT 0,
  last_sent_at       TIMESTAMPTZ  DEFAULT NULL,
  unsubscribe_token  VARCHAR(64)  NOT NULL UNIQUE,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE search_alerts
  ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) NOT NULL DEFAULT 'daily';

ALTER TABLE search_alerts
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

ALTER TABLE search_alerts
  ADD COLUMN IF NOT EXISTS nb_results INTEGER NOT NULL DEFAULT 0;

ALTER TABLE search_alerts
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE search_alerts
  ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(64);

ALTER TABLE search_alerts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE search_alerts
SET status = CASE WHEN active IS FALSE THEN 'paused' ELSE 'active' END
WHERE status IS NULL OR status = '';

UPDATE search_alerts
SET last_sent_at = last_sent
WHERE last_sent_at IS NULL AND last_sent IS NOT NULL;

UPDATE search_alerts
SET unsubscribe_token = COALESCE(unsubscribe_token, md5(id::text || user_id::text || created_at::text))
WHERE unsubscribe_token IS NULL;

ALTER TABLE search_alerts
  ALTER COLUMN frequency SET DEFAULT 'daily',
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN nb_results SET DEFAULT 0,
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE search_alerts
  ADD CONSTRAINT search_alerts_status_check
  CHECK (status IN ('active', 'paused', 'deleted'));

ALTER TABLE search_alerts
  ADD CONSTRAINT search_alerts_frequency_check
  CHECK (frequency IN ('immediate', 'daily', 'weekly'));

-- Index pour les jobs de matching
CREATE INDEX IF NOT EXISTS idx_alerts_status_frequency
  ON search_alerts (status, frequency)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_alerts_user_id
  ON search_alerts (user_id);

-- Index GIN sur le JSONB pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_alerts_filters
  ON search_alerts USING GIN (filters);

-- Limite : max 10 alertes par utilisateur
CREATE OR REPLACE FUNCTION check_alert_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM search_alerts
      WHERE user_id = NEW.user_id AND status != 'deleted') >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 alertes par utilisateur';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alert_limit ON search_alerts;
CREATE TRIGGER trg_alert_limit
  BEFORE INSERT ON search_alerts
  FOR EACH ROW EXECUTE FUNCTION check_alert_limit();

-- updated_at auto
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alerts_updated_at ON search_alerts;
CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON search_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table de log des envois (pour éviter les doublons)
CREATE TABLE IF NOT EXISTS alert_sent_log (
  id          SERIAL PRIMARY KEY,
  alert_id    INTEGER NOT NULL REFERENCES search_alerts(id) ON DELETE CASCADE,
  annonce_id  INTEGER NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (alert_id, annonce_id)   -- jamais envoyer la même annonce deux fois
);

CREATE INDEX IF NOT EXISTS idx_alert_sent_log_alert_id
  ON alert_sent_log (alert_id);
