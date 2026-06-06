ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pro_referral_code TEXT DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_pro_referral_code
  ON users (pro_referral_code)
  WHERE pro_referral_code IS NOT NULL;
