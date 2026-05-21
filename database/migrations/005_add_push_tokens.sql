-- ============================================================
--  Migration 005 — Table push_tokens (app mobile)
-- ============================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id          SERIAL       PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT         NOT NULL UNIQUE,
  platform    VARCHAR(10)  NOT NULL DEFAULT 'ios' CHECK (platform IN ('ios', 'android', 'web')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- Nettoyage automatique des tokens vieux de plus de 90 jours sans mise à jour
-- (sera géré par le cron de nettoyage)
COMMENT ON TABLE push_tokens IS 'Tokens Expo Push Notification par utilisateur (app mobile)';
