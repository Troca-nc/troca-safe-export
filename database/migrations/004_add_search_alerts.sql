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
