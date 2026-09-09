ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_provider_ref_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_ref_unique
  ON payments (provider, provider_ref);
