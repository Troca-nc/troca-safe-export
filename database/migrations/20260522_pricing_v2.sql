-- Pricing v2: remove pro_plus, normalize subscriptions, add account_type

BEGIN;

UPDATE subscriptions
SET plan_id = 'pro'
WHERE plan_id = 'pro_plus';

UPDATE users
SET pro_plan = 'pro'
WHERE pro_plan = 'pro_plus';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'personal';

UPDATE users
SET account_type = CASE
  WHEN is_pro = TRUE THEN 'professional'
  ELSE 'personal'
END
WHERE account_type IS NULL OR account_type NOT IN ('personal', 'professional');

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_account_type_check;

ALTER TABLE users
  ADD CONSTRAINT users_account_type_check
  CHECK (account_type IN ('personal', 'professional'));

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_id_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_id_check
  CHECK (plan_id IN ('pro'));

CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

COMMIT;
