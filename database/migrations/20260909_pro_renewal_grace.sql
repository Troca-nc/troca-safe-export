ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS grace_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_due
  ON subscriptions (grace_ends_at)
  WHERE status = 'past_due' AND grace_ends_at IS NOT NULL AND suspended_at IS NULL;
