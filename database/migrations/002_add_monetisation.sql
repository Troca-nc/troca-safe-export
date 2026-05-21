-- ── Migration SQL — Monétisation Troca ───────────────────────────────────────

-- ── Table des paiements ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           VARCHAR(20)  NOT NULL CHECK (type IN ('boost', 'subscription')),
  provider       VARCHAR(20)  NOT NULL CHECK (provider IN ('stripe', 'payplug')),
  provider_ref   VARCHAR(255) NOT NULL UNIQUE,   -- ID Stripe/PayPlug
  amount_xpf     INTEGER      NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  metadata       JSONB        NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id  ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments (provider, provider_ref);

-- ── Table des abonnements Pro ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id               VARCHAR(20)  NOT NULL CHECK (plan_id IN ('pro', 'pro_plus')),
  billing_period        VARCHAR(10)  NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  provider              VARCHAR(20)  NOT NULL CHECK (provider IN ('stripe', 'payplug')),
  provider_sub_id       VARCHAR(255) NOT NULL UNIQUE,
  status                VARCHAR(20)  NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start  TIMESTAMPTZ  NOT NULL,
  current_period_end    TIMESTAMPTZ  NOT NULL,
  cancel_at_period_end  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_active
  ON subscriptions (user_id)
  WHERE status IN ('active', 'trialing');   -- 1 seul abonnement actif par user

CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end
  ON subscriptions (current_period_end)
  WHERE status = 'active';

-- ── Table des boosts d'annonces ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS annonce_boosts (
  id          SERIAL PRIMARY KEY,
  annonce_id  INTEGER     NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('une', 'urgent', 'remonte', 'photos')),
  starts_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  payment_id  INTEGER     NOT NULL REFERENCES payments(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boosts_annonce_id ON annonce_boosts (annonce_id);
CREATE INDEX IF NOT EXISTS idx_boosts_active
  ON annonce_boosts (type, expires_at)
  WHERE expires_at > NOW();

-- ── Colonnes sur la table users ───────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_pro          BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pro_plan        VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pro_expires_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id  VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payplug_customer_id VARCHAR(100) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ── Colonnes sur la table annonces ────────────────────────────────────────────
ALTER TABLE annonces
  ADD COLUMN IF NOT EXISTS is_boosted        BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS boost_expires_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS boost_type        VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_images        INTEGER     NOT NULL DEFAULT 8;

-- Index pour le tri des annonces (boostées en premier)
CREATE INDEX IF NOT EXISTS idx_annonces_boost_sort
  ON annonces (is_boosted DESC, boost_expires_at DESC NULLS LAST, created_at DESC)
  WHERE statut = 'active';

-- ── Triggers updated_at ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Vue revenus admin ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW admin_revenue AS
SELECT
  DATE_TRUNC('month', created_at) AS mois,
  type,
  provider,
  COUNT(*)                         AS nb_paiements,
  SUM(amount_xpf)                  AS total_xpf
FROM payments
WHERE status = 'succeeded'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 4 DESC;
