ALTER TABLE annonce_images
  ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE annonce_images
SET variants = jsonb_build_object(
      'original', jsonb_build_object('path', url),
      'thumb_400', jsonb_build_object('path', thumbnail_url)
    )
WHERE variants = '{}'::jsonb
  AND url IS NOT NULL
  AND thumbnail_url IS NOT NULL;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'succeeded';

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_payment_status_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_payment_status_check
  CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status
  ON subscriptions (payment_status, updated_at DESC);
