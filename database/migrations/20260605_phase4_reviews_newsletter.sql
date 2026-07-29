-- ============================================================
-- Kalico - Phase 4 Pro : avis vérifiés, auto-réponse, newsletter
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS rides_as_driver INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rides_as_passenger INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100;

CREATE TABLE IF NOT EXISTS verified_reviews (
  id SERIAL PRIMARY KEY,
  pro_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewer_prenom TEXT,
  reviewer_avatar_url TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'invite',
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'reported', 'hidden')),
  helpful_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  report_reason TEXT,
  reply_content TEXT,
  reply_at TIMESTAMPTZ,
  reply_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_helpful (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES verified_reviews(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

CREATE TABLE IF NOT EXISTS auto_replies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL,
  active_keywords TEXT[] DEFAULT '{}',
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS
  is_active BOOLEAN DEFAULT FALSE;

ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS
  active_from TIME;

ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS
  active_until TIME;

ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS
  active_days INTEGER[] DEFAULT '{1,2,3,4,5}';

ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS
  reply_delay_minutes INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  frequency TEXT NOT NULL DEFAULT 'weekly'
    CHECK (frequency IN ('weekly', 'monthly', 'off')),
  categories TEXT[] DEFAULT '{}',
  communes TEXT[] DEFAULT '{}',
  unsubscribe_token TEXT NOT NULL UNIQUE,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_sends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES newsletter_subscriptions(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  summary JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'skipped', 'failed')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  pro_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewer_email TEXT,
  conversation_id INTEGER,
  source TEXT DEFAULT 'invite',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verified_reviews_pro
  ON verified_reviews (pro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verified_reviews_reviewer
  ON verified_reviews (reviewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review
  ON review_helpful (review_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_replies_user
  ON auto_replies (user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_user
  ON newsletter_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_user
  ON newsletter_sends (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_tokens_token
  ON review_tokens (token);
