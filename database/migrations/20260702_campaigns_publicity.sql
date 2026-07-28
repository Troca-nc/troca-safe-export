CREATE TABLE IF NOT EXISTS campaigns (
  id                SERIAL PRIMARY KEY,
  type              VARCHAR(20) NOT NULL CHECK (type IN ('bon_plan', 'banner', 'popup')),
  user_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  category_slug     VARCHAR(120) DEFAULT NULL,
  title             VARCHAR(150) NOT NULL,
  description       VARCHAR(500) DEFAULT '',
  image_url         TEXT DEFAULT NULL,
  link_url          TEXT DEFAULT NULL,
  cta_text          VARCHAR(60) DEFAULT NULL,
  price_xpf         INTEGER NOT NULL DEFAULT 0,
  duration_days     INTEGER NOT NULL DEFAULT 0,
  starts_at         TIMESTAMPTZ DEFAULT NULL,
  ends_at           TIMESTAMPTZ DEFAULT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'expired', 'queued')),
  is_default_popup  BOOLEAN NOT NULL DEFAULT FALSE,
  paused_at         TIMESTAMPTZ DEFAULT NULL,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_type_status
  ON campaigns (type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_category_status
  ON campaigns (category_slug, type, status, ends_at DESC)
  WHERE category_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_user_status
  ON campaigns (user_id, status, created_at DESC)
  WHERE user_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO campaigns (
  type,
  user_id,
  category_slug,
  title,
  description,
  image_url,
  link_url,
  cta_text,
  price_xpf,
  duration_days,
  starts_at,
  ends_at,
  status,
  is_default_popup,
  metadata
)
SELECT
  'popup',
  NULL,
  NULL,
  'Bienvenue sur Kalico NC',
  'La plateforme locale de Nouvelle-Calédonie — annonces, services, covoiturage et bien plus.',
  '/brand/kalico1.svg',
  '/',
  'Découvrir Kalico',
  0,
  0,
  NOW(),
  NULL,
  'active',
  TRUE,
  jsonb_build_object('default_popup', TRUE, 'source', 'migration')
WHERE NOT EXISTS (
  SELECT 1
  FROM campaigns
  WHERE is_default_popup = TRUE
);
