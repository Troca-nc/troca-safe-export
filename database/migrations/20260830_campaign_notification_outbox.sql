-- New payment activations only. No historical backfill or replay.
CREATE TABLE campaign_notification_outbox (
  id BIGSERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  target_id INTEGER NOT NULL DEFAULT 0,
  expected_status TEXT NOT NULL CHECK (expected_status IN ('active', 'queued')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'cancelled', 'dead')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  last_error_code TEXT,
  CHECK ((channel = 'push' AND target_id > 0) OR (channel <> 'push' AND target_id = 0)),
  UNIQUE (payment_id, channel, target_id)
);
CREATE INDEX campaign_notification_outbox_pending_idx
  ON campaign_notification_outbox (available_at, id) WHERE status = 'pending';
