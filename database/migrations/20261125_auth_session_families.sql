CREATE TABLE IF NOT EXISTS auth_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_type       VARCHAR(16) NOT NULL DEFAULT 'web'
                    CHECK (client_type IN ('web', 'native')),
  device_label      VARCHAR(160) DEFAULT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  last_used_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at        TIMESTAMPTZ DEFAULT NULL,
  revocation_reason VARCHAR(64) DEFAULT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
  ON auth_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active
  ON auth_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_invalid_before TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS replaced_by_token_id INTEGER DEFAULT NULL;

UPDATE refresh_tokens
SET session_id = uuid_generate_v4()
WHERE session_id IS NULL;

INSERT INTO auth_sessions (id, user_id, client_type, expires_at, last_used_at, created_at)
SELECT rt.session_id, rt.user_id, 'web', rt.expires_at, rt.created_at, rt.created_at
FROM refresh_tokens rt
LEFT JOIN auth_sessions session ON session.id = rt.session_id
WHERE session.id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_replaced_by_token_id_fkey'
  ) THEN
    ALTER TABLE refresh_tokens
      ADD CONSTRAINT refresh_tokens_replaced_by_token_id_fkey
      FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session
  ON refresh_tokens (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active_session
  ON refresh_tokens (session_id, expires_at)
  WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS void AS $$
BEGIN
  DELETE FROM refresh_tokens WHERE expires_at < NOW();
  DELETE FROM auth_sessions WHERE expires_at < NOW();
  DELETE FROM password_reset_tokens WHERE expires_at < NOW();
  DELETE FROM rgpd_logs WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE auth_sessions IS
  'Session families used for refresh rotation, per-device revocation and reuse detection';
COMMENT ON COLUMN auth_sessions.client_type IS
  'web is the only enabled client type; native is reserved for the disabled future native contract';
COMMENT ON COLUMN refresh_tokens.used_at IS
  'Rotation timestamp. Used token rows remain until expiry for reuse detection';
COMMENT ON COLUMN refresh_tokens.session_id IS
  'Nullable during the backward-compatible rollout. PR C will enforce the foreign key after the compatibility window';
