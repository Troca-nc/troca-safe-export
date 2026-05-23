-- Bon Plans v1: self-service promotions, businesses, reviews and notification prefs

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'personal'
    CHECK (account_type IN ('personal', 'professional'));

CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  contact_email VARCHAR(255),
  category VARCHAR(50),
  badge VARCHAR(20) NOT NULL DEFAULT 'none'
    CHECK (badge IN ('none', 'active', 'verified')),
  verified_at TIMESTAMPTZ,
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  bon_plan_count INTEGER NOT NULL DEFAULT 0,
  review_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_badge ON businesses(badge);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);

CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reply_text TEXT,
  reported BOOLEAN NOT NULL DEFAULT FALSE,
  report_reason TEXT,
  report_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_reviews_business ON business_reviews(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_reviews_user ON business_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_reported ON business_reviews(reported, created_at DESC) WHERE reported = TRUE;

CREATE TABLE IF NOT EXISTS bon_plan_notification_prefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notify_all BOOLEAN NOT NULL DEFAULT FALSE,
  notify_categories TEXT[] NOT NULL DEFAULT '{}',
  notify_businesses TEXT[] NOT NULL DEFAULT '{}',
  via_push BOOLEAN NOT NULL DEFAULT TRUE,
  via_email BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_bon_plan_notif_user ON bon_plan_notification_prefs(user_id);

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS business_logo_url TEXT;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS promo_label VARCHAR(80);

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS original_price_xpf INTEGER;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS cta_label VARCHAR(60) DEFAULT 'En profiter';

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS cta_url TEXT;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'autre';

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS promo_valid_from DATE;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS promo_valid_until DATE;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS published_from TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS published_until TIMESTAMPTZ;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20)
    CHECK (payment_provider IN ('stripe', 'payplug'));

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS amount_xpf INTEGER;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS amount_eur NUMERIC(8, 2);

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE bon_plans
  ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE bon_plans
SET status = CASE
  WHEN status = 'pending' THEN 'draft'
  WHEN status = 'rejected' THEN 'expired'
  WHEN status = 'active' THEN 'active'
  ELSE COALESCE(status, 'draft')
END;

DO $$
BEGIN
  ALTER TABLE bon_plans DROP CONSTRAINT IF EXISTS bon_plans_status_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

ALTER TABLE bon_plans
  ALTER COLUMN status TYPE VARCHAR(20) USING status::varchar(20);

ALTER TABLE bon_plans
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE bon_plans
  ADD CONSTRAINT bon_plans_status_check
  CHECK (status IN ('draft', 'active', 'expired'));

UPDATE bon_plans
SET duration_days = 7
WHERE duration_days = 3;

DO $$
BEGIN
  ALTER TABLE bon_plans DROP CONSTRAINT IF EXISTS bon_plans_duration_days_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

ALTER TABLE bon_plans
  ADD CONSTRAINT bon_plans_duration_days_check
  CHECK (duration_days IN (7, 30));

CREATE INDEX IF NOT EXISTS idx_bon_plans_active
  ON bon_plans (status, published_until DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_bon_plans_category
  ON bon_plans (category, status);

CREATE INDEX IF NOT EXISTS idx_bon_plans_business
  ON bon_plans (business_name, status);

CREATE INDEX IF NOT EXISTS idx_bon_plans_payment_ref
  ON bon_plans (payment_provider, payment_intent_id);

DO $$
BEGIN
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

ALTER TABLE payments
  ADD CONSTRAINT payments_type_check
  CHECK (type IN ('boost', 'subscription', 'bon_plan'));
