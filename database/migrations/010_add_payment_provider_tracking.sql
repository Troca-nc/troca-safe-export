-- Track which payment provider was used for subscriptions and boosts.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20);

UPDATE subscriptions
   SET payment_provider = COALESCE(payment_provider, provider)
 WHERE payment_provider IS NULL;

ALTER TABLE subscriptions
  ALTER COLUMN payment_provider SET DEFAULT 'stripe';

ALTER TABLE subscriptions
  ALTER COLUMN payment_provider SET NOT NULL;

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_payment_provider_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_payment_provider_check
  CHECK (payment_provider IN ('stripe', 'payplug'));

CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_provider
  ON subscriptions (payment_provider);

ALTER TABLE annonce_boosts
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20);

UPDATE annonce_boosts ab
   SET payment_provider = p.provider
  FROM payments p
 WHERE p.id = ab.payment_id
   AND ab.payment_provider IS NULL;

ALTER TABLE annonce_boosts
  ALTER COLUMN payment_provider SET DEFAULT 'stripe';

ALTER TABLE annonce_boosts
  ALTER COLUMN payment_provider SET NOT NULL;

ALTER TABLE annonce_boosts
  DROP CONSTRAINT IF EXISTS annonce_boosts_payment_provider_check;

ALTER TABLE annonce_boosts
  ADD CONSTRAINT annonce_boosts_payment_provider_check
  CHECK (payment_provider IN ('stripe', 'payplug'));

CREATE INDEX IF NOT EXISTS idx_boosts_payment_provider
  ON annonce_boosts (payment_provider);
