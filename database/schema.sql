-- ============================================================
-- Troca — Schéma principal PostgreSQL
-- À placer dans database/schema.sql
-- Monté automatiquement par docker-compose au 1er démarrage
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- recherche full-text fuzzy
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- recherche sans accents

-- ── Fonction utilitaire updated_at ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── USERS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  email               VARCHAR(255)  NOT NULL UNIQUE,
  password_hash       VARCHAR(255)  DEFAULT NULL,      -- NULL si auth sociale
  prenom              VARCHAR(100)  NOT NULL,
  nom                 VARCHAR(100)  NOT NULL,
  telephone           VARCHAR(20)   DEFAULT NULL,
  phone_verified      BOOLEAN       NOT NULL DEFAULT FALSE,
  email_verified      BOOLEAN       NOT NULL DEFAULT FALSE,
  avatar_url          VARCHAR(500)  DEFAULT NULL,
  commune_id          INTEGER       DEFAULT NULL REFERENCES communes(id) ON DELETE SET NULL,
  bio                 TEXT          DEFAULT NULL,
  member_since        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  rides_as_driver     INTEGER       NOT NULL DEFAULT 0,
  rides_as_passenger   INTEGER      NOT NULL DEFAULT 0,
  trust_score         INTEGER       NOT NULL DEFAULT 100,
  is_admin            BOOLEAN       NOT NULL DEFAULT FALSE,
  is_pro              BOOLEAN       NOT NULL DEFAULT FALSE,
  pro_plan            VARCHAR(20)   DEFAULT NULL,
  pro_expires_at      TIMESTAMPTZ   DEFAULT NULL,
  last_bon_plan_offer_at TIMESTAMPTZ DEFAULT NULL,
  pro_verified        BOOLEAN       NOT NULL DEFAULT FALSE,
  pro_verified_at     TIMESTAMPTZ   DEFAULT NULL,
  pro_company_name    TEXT          DEFAULT NULL,
  pro_category        TEXT          DEFAULT NULL,
  pro_description     TEXT          DEFAULT NULL,
  pro_logo_url        TEXT          DEFAULT NULL,
  pro_banner_url      TEXT          DEFAULT NULL,
  pro_website         TEXT          DEFAULT NULL,
  pro_phone           TEXT          DEFAULT NULL,
  pro_hours           TEXT          DEFAULT NULL,
  pro_commune         TEXT          DEFAULT NULL,
  pro_siret           TEXT          DEFAULT NULL,
  stripe_customer_id  VARCHAR(255)  DEFAULT NULL,
  nb_annonces         INTEGER       NOT NULL DEFAULT 0,
  note_moyenne        NUMERIC(3,2)  DEFAULT NULL,
  nb_avis             INTEGER       NOT NULL DEFAULT 0,
  deleted_at          TIMESTAMPTZ   DEFAULT NULL,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email      ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_commune    ON users (commune_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at) WHERE deleted_at IS NOT NULL;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- â”€â”€ EMAIL VERIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id
  ON email_verification_tokens (user_id);

-- ── PROVINCES & COMMUNES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS provinces (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  slug  VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO provinces (name, slug) VALUES
  ('Province Sud',  'province-sud'),
  ('Province Nord', 'province-nord'),
  ('Province des Îles Loyauté', 'province-iles')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS communes (
  id          SERIAL PRIMARY KEY,
  province_id INTEGER      NOT NULL REFERENCES provinces(id),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  code_insee  VARCHAR(10)  DEFAULT NULL
);

INSERT INTO communes (province_id, name, slug) VALUES
  (1, 'Nouméa',          'noumea'),
  (1, 'Dumbéa',          'dumbea'),
  (1, 'Mont-Dore',       'mont-dore'),
  (1, 'Paita',           'paita'),
  (1, 'Boulouparis',     'boulouparis'),
  (1, 'La Foa',          'la-foa'),
  (1, 'Sarraméa',        'sarramea'),
  (1, 'Farino',          'farino'),
  (1, 'Moindou',         'moindou'),
  (1, 'Bourail',         'bourail'),
  (2, 'Koné',            'kone'),
  (2, 'Poindimié',       'poindimie'),
  (2, 'Koumac',          'koumac'),
  (2, 'Pouembout',       'pouembout'),
  (2, 'Voh',             'voh'),
  (3, 'Lifou',           'lifou'),
  (3, 'Maré',            'mare'),
  (3, 'Ouvéa',           'ouvea')
ON CONFLICT (slug) DO NOTHING;

-- ── CATEGORIES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  parent_id   INTEGER      DEFAULT NULL REFERENCES categories(id),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  icon        VARCHAR(10)  DEFAULT NULL,
  description TEXT         DEFAULT NULL,
  sort_order  INTEGER      NOT NULL DEFAULT 0
);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Véhicules',    'vehicules',      '🚗', 1),
  ('Immobilier',   'immobilier',     '🏠', 2),
  ('Nautisme',     'nautisme',       '⛵', 3),
  ('Emploi',       'emploi',         '💼', 4),
  ('Multimédia',   'multimedia',     '💻', 5),
  ('Agriculture',  'agriculture',    '🌾', 6),
  ('Sports & Loisirs', 'sports-loisirs', '🏄', 7),
  ('Divers',       'divers',         '📦', 8)
ON CONFLICT (slug) DO NOTHING;

-- ── ANNONCES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS annonces (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     INTEGER      NOT NULL REFERENCES categories(id),
  commune_id      INTEGER      DEFAULT NULL REFERENCES communes(id),
  titre           VARCHAR(200) NOT NULL,
  description     TEXT         NOT NULL,
  prix            INTEGER      DEFAULT NULL,         -- en XPF, NULL = prix à débattre
  condition       VARCHAR(20)  DEFAULT NULL
                    CHECK (condition IN ('new','like_new','good','fair','for_parts')),
  status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','sold','expired','deleted','pending')),
  -- Boost
  is_boosted      BOOLEAN      NOT NULL DEFAULT FALSE,
  boost_type      VARCHAR(20)  DEFAULT NULL,
  boost_expires_at TIMESTAMPTZ DEFAULT NULL,
  renewed_at      TIMESTAMPTZ  DEFAULT NULL,
  -- Stats
  nb_vues         INTEGER      NOT NULL DEFAULT 0,
  nb_favoris      INTEGER      NOT NULL DEFAULT 0,
  -- SEO
  slug            VARCHAR(300) DEFAULT NULL,
  -- Timestamps
  expires_at      TIMESTAMPTZ  DEFAULT (NOW() + INTERVAL '60 days'),
  published_at    TIMESTAMPTZ  DEFAULT NOW(),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annonces_user_id    ON annonces (user_id);
CREATE INDEX IF NOT EXISTS idx_annonces_category   ON annonces (category_id);
CREATE INDEX IF NOT EXISTS idx_annonces_commune    ON annonces (commune_id);
CREATE INDEX IF NOT EXISTS idx_annonces_status     ON annonces (status);
CREATE INDEX IF NOT EXISTS idx_annonces_created    ON annonces (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annonces_prix       ON annonces (prix);
CREATE INDEX IF NOT EXISTS idx_annonces_boost      ON annonces (is_boosted, boost_expires_at) WHERE is_boosted = TRUE;
-- Recherche full-text
CREATE INDEX IF NOT EXISTS idx_annonces_fts ON annonces
  USING gin(to_tsvector('french', lower(coalesce(titre, '')) || ' ' || lower(coalesce(description, ''))));

DROP TRIGGER IF EXISTS trg_annonces_updated_at ON annonces;
CREATE TRIGGER trg_annonces_updated_at
  BEFORE UPDATE ON annonces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── IMAGES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS annonce_images (
  id             SERIAL PRIMARY KEY,
  annonce_id     INTEGER      NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  url            VARCHAR(500) NOT NULL,
  thumbnail_url  VARCHAR(500) NOT NULL,
  variants       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  position       SMALLINT     NOT NULL DEFAULT 0,
  sort_order     INTEGER      NOT NULL DEFAULT 0,
  is_cover       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_annonce_id ON annonce_images (annonce_id, position);
CREATE INDEX IF NOT EXISTS idx_images_annonce_cover_sort ON annonce_images (annonce_id, is_cover DESC, sort_order ASC);

-- ── FAVORIS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favoris (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  annonce_id INTEGER     NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, annonce_id)
);

CREATE INDEX IF NOT EXISTS idx_favoris_user    ON favoris (user_id);
CREATE INDEX IF NOT EXISTS idx_favoris_annonce ON favoris (annonce_id);

-- ── SIGNALEMENTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signalements (
  id          SERIAL PRIMARY KEY,
  annonce_id  INTEGER      NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  user_id     INTEGER      DEFAULT NULL REFERENCES users(id),
  raison      VARCHAR(50)  NOT NULL
                CHECK (raison IN ('spam','arnaque','illicite','doublon','autre')),
  description TEXT         DEFAULT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','resolved','dismissed')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signalements_annonce ON signalements (annonce_id);
CREATE INDEX IF NOT EXISTS idx_signalements_status  ON signalements (status) WHERE status = 'pending';

-- ── PHONE VERIFICATION ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phone_verifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone       VARCHAR(20) NOT NULL,
  sid         VARCHAR(100) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_ver_user ON phone_verifications (user_id, created_at DESC);

-- ── ALERTES DE RECHERCHE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_alerts (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label              VARCHAR(200) NOT NULL,
  filters            JSONB        NOT NULL DEFAULT '{}',
  frequency          VARCHAR(20)  NOT NULL DEFAULT 'daily'
                       CHECK (frequency IN ('immediate', 'daily', 'weekly')),
  status             VARCHAR(20)  NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'paused', 'deleted')),
  nb_results         INTEGER      NOT NULL DEFAULT 0,
  last_sent_at       TIMESTAMPTZ  DEFAULT NULL,
  unsubscribe_token  VARCHAR(64)  NOT NULL UNIQUE,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_status_frequency
  ON search_alerts (status, frequency)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_alerts_user_id
  ON search_alerts (user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_filters
  ON search_alerts USING GIN (filters);

DROP TRIGGER IF EXISTS trg_alerts_updated_at ON search_alerts;
CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON search_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── MESSAGERIE (voir add_messaging.sql pour le détail complet) ────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id          SERIAL PRIMARY KEY,
  annonce_id  INTEGER     NOT NULL REFERENCES annonces(id)  ON DELETE CASCADE,
  buyer_id    INTEGER     NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  seller_id   INTEGER     NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','archived','blocked')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (annonce_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  conv_id     INTEGER     NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id   INTEGER     NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL DEFAULT 'text'
                CHECK (type IN ('text','offer','photo','audio','document','system')),
  content     TEXT        DEFAULT NULL,
  photo_url   VARCHAR(500) DEFAULT NULL,
  attachment_url VARCHAR(500) DEFAULT NULL,
  attachment_name VARCHAR(255) DEFAULT NULL,
  attachment_mime_type VARCHAR(120) DEFAULT NULL,
  attachment_size_bytes INTEGER DEFAULT NULL,
  read_at     TIMESTAMPTZ DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages (conv_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread  ON messages (conv_id) WHERE read_at IS NULL;

DROP TRIGGER IF EXISTS trg_conv_updated_at ON conversations;
CREATE TRIGGER trg_conv_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── PAIEMENTS (voir add_monetisation.sql) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(20) NOT NULL CHECK (type IN ('boost','subscription')),
  provider     VARCHAR(20) NOT NULL CHECK (provider IN ('stripe','payplug')),
  provider_ref VARCHAR(255) NOT NULL UNIQUE,
  amount_xpf   INTEGER     NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','succeeded','failed','refunded')),
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user   ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);

-- ── PUSH TOKENS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50)  NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT         DEFAULT '',
  href       VARCHAR(500) DEFAULT '/',
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read)
  WHERE is_read = FALSE;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_new_message BOOLEAN NOT NULL DEFAULT TRUE,
  push_new_message BOOLEAN NOT NULL DEFAULT TRUE,
  email_search_alert BOOLEAN NOT NULL DEFAULT TRUE,
  push_search_alert BOOLEAN NOT NULL DEFAULT FALSE,
  email_boost_activated BOOLEAN NOT NULL DEFAULT TRUE,
  email_offer_received BOOLEAN NOT NULL DEFAULT TRUE,
  email_listing_expiring BOOLEAN NOT NULL DEFAULT TRUE,
  email_listing_expired BOOLEAN NOT NULL DEFAULT TRUE,
  email_performance_report BOOLEAN NOT NULL DEFAULT TRUE,
  push_performance_report BOOLEAN NOT NULL DEFAULT FALSE,
  performance_report_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly'
    CHECK (performance_report_frequency IN ('daily', 'weekly', 'monthly', 'never')),
  new_message_unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  boost_activated_unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  offer_received_unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  listing_expiring_unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  listing_expired_unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  performance_report_unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  last_performance_report_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
  ON notification_preferences (user_id);

-- ── DOCUMENTS DE FACTURATION ────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS billing_documents (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         VARCHAR(20)  NOT NULL CHECK (provider IN ('stripe','payplug')),
  provider_ref     VARCHAR(255) NOT NULL,
  document_type    VARCHAR(20)  NOT NULL CHECK (document_type IN ('invoice','refund','receipt')),
  status           VARCHAR(30)  NOT NULL DEFAULT 'pending',
  amount_eur_cents INTEGER,
  amount_xpf       INTEGER,
  currency         VARCHAR(10)  DEFAULT 'EUR',
  pdf_url          TEXT,
  hosted_url       TEXT,
  payload          JSONB        NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_ref, document_type)
);

CREATE INDEX IF NOT EXISTS idx_billing_documents_user ON billing_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_billing_documents_provider_ref ON billing_documents (provider, provider_ref);

-- ── PRO DASHBOARD ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_stats (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES annonces(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  viewer_ip TEXT,
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_listing_stats_listing
  ON listing_stats (listing_id, viewed_at DESC);

CREATE TABLE IF NOT EXISTS listing_contacts (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES annonces(id) ON DELETE CASCADE,
  contacted_at TIMESTAMPTZ DEFAULT NOW(),
  contact_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_listing_contacts_listing
  ON listing_contacts (listing_id, contacted_at DESC);

CREATE TABLE IF NOT EXISTS listing_boosts (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES annonces(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  duration_days INTEGER NOT NULL,
  price_xpf INTEGER NOT NULL,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'cancelled')),
  stripe_payment_id TEXT,
  invoice_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_boosts_author
  ON listing_boosts (author_id, status, expires_at DESC);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  invoice_number TEXT UNIQUE NOT NULL,
  amount_xpf INTEGER NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'paid'
    CHECK (status IN ('paid', 'pending', 'cancelled')),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_created
  ON invoices (user_id, created_at DESC);

CREATE MATERIALIZED VIEW IF NOT EXISTS pro_listing_stats AS
SELECT
  l.author_id,
  l.id as listing_id,
  l.titre as title,
  cat.name as category,
  l.prix as price,
  l.status,
  l.created_at,
  COUNT(DISTINCT ls.id) as total_views,
  COUNT(DISTINCT ls.id) FILTER (
    WHERE ls.viewed_at > NOW() - INTERVAL '7 days'
  ) as views_7d,
  COUNT(DISTINCT ls.id) FILTER (
    WHERE ls.viewed_at > NOW() - INTERVAL '30 days'
  ) as views_30d,
  COUNT(DISTINCT lc.id) as total_contacts,
  COUNT(DISTINCT lc.id) FILTER (
    WHERE lc.contacted_at > NOW() - INTERVAL '7 days'
  ) as contacts_7d,
  CASE WHEN COUNT(DISTINCT ls.id) > 0
    THEN ROUND(
      COUNT(DISTINCT lc.id)::numeric /
      COUNT(DISTINCT ls.id) * 100, 1
    )
    ELSE 0
  END as conversion_rate,
  EXISTS(
    SELECT 1 FROM listing_boosts b
    WHERE b.listing_id = l.id
      AND b.status = 'active'
      AND b.expires_at > NOW()
  ) as is_boosted,
  (
    SELECT b.expires_at FROM listing_boosts b
    WHERE b.listing_id = l.id
      AND b.status = 'active'
      AND b.expires_at > NOW()
    ORDER BY b.expires_at DESC
    LIMIT 1
  ) as boost_expires_at
FROM listings l
LEFT JOIN listing_stats ls ON ls.listing_id = l.id
LEFT JOIN listing_contacts lc ON lc.listing_id = l.id
LEFT JOIN categories cat ON cat.id = l.category_id
GROUP BY l.author_id, l.id, l.titre, cat.name, l.prix, l.status, l.created_at;

CREATE INDEX IF NOT EXISTS idx_pro_listing_stats_listing_id
  ON pro_listing_stats (listing_id);

-- â”€â”€ ANALYTICS EVENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS analytics_events (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      DEFAULT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id   VARCHAR(80)  NOT NULL,
  event_name   VARCHAR(80)  NOT NULL,
  page_path    VARCHAR(255) NOT NULL,
  referrer     VARCHAR(500) DEFAULT NULL,
  device_type  VARCHAR(20)  NOT NULL DEFAULT 'web'
                 CHECK (device_type IN ('web','mobile','tablet','unknown')),
  metadata     JSONB        NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created
  ON analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_created
  ON analytics_events (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created
  ON analytics_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS push_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(200) NOT NULL UNIQUE,
  platform   VARCHAR(10)  NOT NULL CHECK (platform IN ('ios','android')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens (user_id);

-- ── Mise à jour du compteur nb_annonces sur users ─────────────────────────────
CREATE OR REPLACE FUNCTION sync_user_nb_annonces()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET nb_annonces = nb_annonces + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET nb_annonces = GREATEST(nb_annonces - 1, 0) WHERE id = OLD.user_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'deleted' THEN
      UPDATE users SET nb_annonces = GREATEST(nb_annonces - 1, 0) WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_nb_annonces ON annonces;
CREATE TRIGGER trg_sync_nb_annonces
  AFTER INSERT OR UPDATE OF status OR DELETE ON annonces
  FOR EACH ROW EXECUTE FUNCTION sync_user_nb_annonces();

-- ── WEBHOOK EVENTS (idempotence) ──────────────────────────────────────────────
-- Évite de traiter deux fois le même événement Stripe ou PayPlug
CREATE TABLE IF NOT EXISTS webhook_events (
  id           SERIAL PRIMARY KEY,
  event_id     VARCHAR(255) NOT NULL UNIQUE,  -- evt_xxx (Stripe) ou pay_xxx (PayPlug)
  provider     VARCHAR(20)  NOT NULL CHECK (provider IN ('stripe','payplug')),
  type         VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events (event_id);


-- ── MODÉRATION IMAGES ─────────────────────────────────────────────────────────
-- Colonne sur annonces
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS moderation_flag VARCHAR(100) DEFAULT NULL;

-- Table de logs Rekognition
CREATE TABLE IF NOT EXISTS image_moderation_logs (
  id          SERIAL PRIMARY KEY,
  annonce_id  INTEGER      NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  image_key   VARCHAR(500) NOT NULL UNIQUE,
  decision    VARCHAR(20)  NOT NULL CHECK (decision IN ('approved','blocked','review')),
  reason      VARCHAR(100) DEFAULT NULL,
  confidence  NUMERIC(5,2) NOT NULL DEFAULT 0,
  labels      JSONB        NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mod_logs_annonce  ON image_moderation_logs (annonce_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_decision ON image_moderation_logs (decision) WHERE decision != 'approved';

-- ── TRUST SCORE ────────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score  INTEGER     DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_level  VARCHAR(20) DEFAULT 'inconnu';
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN   NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_verified    BOOLEAN   NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS rides_as_driver INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rides_as_passenger INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ALTER COLUMN trust_score SET DEFAULT 100;

CREATE INDEX IF NOT EXISTS idx_users_trust_level ON users (trust_level);

-- ── RGPD ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rgpd_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      NOT NULL,
  action      VARCHAR(50)  NOT NULL,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rgpd_consentements (
  user_id    INTEGER      PRIMARY KEY,
  analytics  BOOLEAN      NOT NULL DEFAULT FALSE,
  marketing  BOOLEAN      NOT NULL DEFAULT FALSE,
  ip_address VARCHAR(45)  DEFAULT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rgpd_logs_user ON rgpd_logs (user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- CORRECTIFS — colonnes et tables manquantes détectées à l'audit
-- Toutes les instructions utilisent ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS
-- ═══════════════════════════════════════════════════════════════════════════

-- ── AUTH SOCIALE ─────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id    VARCHAR(255) DEFAULT NULL UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id     VARCHAR(255) DEFAULT NULL UNIQUE;

-- ── BAN TEMPORAIRE ───────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ  DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_since    TIMESTAMPTZ  DEFAULT NULL;

-- ── REFRESH TOKENS (révocation, rotation) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user    ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at);

-- ── RÉINITIALISATION MOT DE PASSE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  user_id     INTEGER      PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── SIGNALEMENTS — colonnes manquantes pour le code admin ────────────────────
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS reporter_id  INTEGER    REFERENCES users(id);
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS reason       VARCHAR(50) DEFAULT NULL;
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS comment      TEXT        DEFAULT NULL;
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS resolved_at  TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS resolved_by  INTEGER     REFERENCES users(id);
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS action_taken VARCHAR(50) DEFAULT NULL;

-- Migrer user_id → reporter_id si la colonne existait
UPDATE signalements SET reporter_id = user_id WHERE reporter_id IS NULL AND user_id IS NOT NULL;
-- Migrer raison → reason
UPDATE signalements SET reason = raison WHERE reason IS NULL AND raison IS NOT NULL;

-- ── PAYMENTS — colonnes manquantes ───────────────────────────────────────────
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_xpf  INTEGER     DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata    JSONB       DEFAULT '{}';

-- ── ADMIN LOGS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
  id          SERIAL PRIMARY KEY,
  admin_id    INTEGER      NOT NULL REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  target_type VARCHAR(50)  DEFAULT NULL,
  target_id   VARCHAR(100) DEFAULT NULL,
  metadata    JSONB        DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin   ON admin_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target  ON admin_logs (target_type, target_id);

-- ── AVIS UTILISATEURS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avis (
  id               SERIAL PRIMARY KEY,
  auteur_id        INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destinataire_id  INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note             SMALLINT     NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire      TEXT         DEFAULT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (auteur_id, destinataire_id)
);
CREATE INDEX IF NOT EXISTS idx_avis_destinataire ON avis (destinataire_id);

-- ── ANNONCES — boost visible dans les listings ────────────────────────────────
-- boosted_until est probablement déjà là (via migration 002), on le sécurise
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS boosted_until  TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS delete_reason  VARCHAR(50)  DEFAULT NULL;
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS phone          VARCHAR(20)  DEFAULT NULL;
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS is_negotiable   BOOLEAN      NOT NULL DEFAULT FALSE;
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS contre_quoi      TEXT         DEFAULT NULL; -- Ex: 'smartphone', 'vélo'
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS deleted_at      TIMESTAMPTZ  DEFAULT NULL;
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS view_count      INTEGER      NOT NULL DEFAULT 0;

-- Index pour soft-delete et tri par vues
CREATE INDEX IF NOT EXISTS idx_annonces_deleted_at ON annonces (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_annonces_view_count ON annonces (view_count DESC);
CREATE INDEX IF NOT EXISTS idx_annonces_active_created
  ON annonces (created_at DESC)
  WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_annonces_active_user_created
  ON annonces (user_id, created_at DESC)
  WHERE status = 'active' AND deleted_at IS NULL;

-- ── BON PLANS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bon_plans (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(120) NOT NULL,
  description      TEXT         NOT NULL,
  kind             VARCHAR(20)  NOT NULL CHECK (kind IN ('promo','event','concert','other')),
  target_audience  VARCHAR(20)  NOT NULL CHECK (target_audience IN ('particulier','pro')),
  commune_id       INTEGER      DEFAULT NULL REFERENCES communes(id),
  location_name    VARCHAR(120) DEFAULT NULL,
  event_date       DATE         DEFAULT NULL,
  duration_days    INTEGER      NOT NULL CHECK (duration_days IN (3, 7)),
  price_xpf        INTEGER      NOT NULL DEFAULT 0,
  is_free_included BOOLEAN      NOT NULL DEFAULT FALSE,
  normal_price_xpf INTEGER      DEFAULT NULL,
  promo_price_xpf  INTEGER      DEFAULT NULL,
  discount_pct     INTEGER      DEFAULT NULL CHECK (discount_pct IS NULL OR (discount_pct BETWEEN 0 AND 100)),
  conditions       TEXT         DEFAULT NULL,
  contact_name     VARCHAR(120) DEFAULT NULL,
  contact_phone    VARCHAR(30)   DEFAULT NULL,
  contact_email    VARCHAR(255)  DEFAULT NULL,
  website_url      VARCHAR(500)  DEFAULT NULL,
  social_links     JSONB         NOT NULL DEFAULT '{}'::jsonb,
  opening_hours    VARCHAR(255)  DEFAULT NULL,
  photos           JSONB         NOT NULL DEFAULT '[]'::jsonb,
  view_count       INTEGER       NOT NULL DEFAULT 0,
  share_count      INTEGER       NOT NULL DEFAULT 0,
  status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                    CHECK (status IN ('pending','active','rejected')),
  expires_at       TIMESTAMPTZ  NOT NULL,
  link_url         VARCHAR(500) DEFAULT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS normal_price_xpf INTEGER DEFAULT NULL;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS promo_price_xpf INTEGER DEFAULT NULL;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS discount_pct INTEGER DEFAULT NULL;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS conditions TEXT DEFAULT NULL;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS contact_name VARCHAR(120) DEFAULT NULL;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30) DEFAULT NULL;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) DEFAULT NULL;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS website_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(255) DEFAULT NULL;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bon_plans ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_bon_plans_status   ON bon_plans (status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_bon_plans_user     ON bon_plans (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bon_plans_commune  ON bon_plans (commune_id);

-- ── COVOITURAGE ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS covoiturages (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  departure          VARCHAR(120) NOT NULL,
  destination        VARCHAR(120) NOT NULL,
  stops              JSONB        NOT NULL DEFAULT '[]',
  ride_date          DATE         NOT NULL,
  ride_time          TIME         NOT NULL,
  seats_total        INTEGER      NOT NULL DEFAULT 1 CHECK (seats_total BETWEEN 1 AND 8),
  seats_reserved     INTEGER      NOT NULL DEFAULT 0 CHECK (seats_reserved >= 0),
  seats_remaining    INTEGER      NOT NULL DEFAULT 3 CHECK (seats_remaining >= 0),
  booking_mode       VARCHAR(20)  NOT NULL DEFAULT 'auto'
                          CHECK (booking_mode IN ('auto','manual')),
  recurrence_type    VARCHAR(20)  NOT NULL DEFAULT 'none'
                          CHECK (recurrence_type IN ('none','daily','weekly')),
  recurrence_days    JSONB        NOT NULL DEFAULT '[]',
  recurrence_until   DATE         DEFAULT NULL,
  recurrence_count   INTEGER      DEFAULT NULL,
  recurrence_parent_id INTEGER    DEFAULT NULL REFERENCES covoiturages(id) ON DELETE CASCADE,
  price_xpf          INTEGER      NOT NULL DEFAULT 0 CHECK (price_xpf >= 0),
  vehicle            VARCHAR(120) DEFAULT NULL,
  comfort            VARCHAR(120) DEFAULT NULL,
  luggage_allowed    VARCHAR(120) DEFAULT NULL,
  music_allowed      BOOLEAN      NOT NULL DEFAULT TRUE,
  no_smoking         BOOLEAN      NOT NULL DEFAULT TRUE,
  animals_allowed    BOOLEAN      NOT NULL DEFAULT FALSE,
  description        TEXT         NOT NULL,
  status             VARCHAR(20)  NOT NULL DEFAULT 'published'
                          CHECK (status IN ('published','full','cancelled','completed')),
  departure_commune_id   INTEGER  DEFAULT NULL REFERENCES communes(id),
  destination_commune_id  INTEGER  DEFAULT NULL REFERENCES communes(id),
  trust_score        INTEGER      NOT NULL DEFAULT 0,
  is_verified_driver BOOLEAN      NOT NULL DEFAULT FALSE,
  expires_at         TIMESTAMPTZ  NOT NULL,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ride_bookings (
  id               SERIAL PRIMARY KEY,
  ride_id          INTEGER      NOT NULL REFERENCES covoiturages(id) ON DELETE CASCADE,
  passenger_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','auto_confirmed','accepted','refused','cancelled')),
  booking_mode     VARCHAR(20)  NOT NULL
                          CHECK (booking_mode IN ('auto','manual')),
  message          TEXT         DEFAULT NULL,
  seats            INTEGER      NOT NULL DEFAULT 1 CHECK (seats BETWEEN 1 AND 8),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  responded_at     TIMESTAMPTZ  DEFAULT NULL,
  expires_at       TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  review_reminder_sent_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (ride_id, passenger_id)
);

CREATE TABLE IF NOT EXISTS covoiturage_bookings (
  id               SERIAL PRIMARY KEY,
  covoiturage_id   INTEGER      NOT NULL REFERENCES covoiturages(id) ON DELETE CASCADE,
  user_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seats            INTEGER      NOT NULL DEFAULT 1 CHECK (seats BETWEEN 1 AND 8),
  status           VARCHAR(20)  NOT NULL DEFAULT 'confirmed'
                          CHECK (status IN ('confirmed','cancelled','completed')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  cancelled_at     TIMESTAMPTZ  DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS covoiturage_reviews (
  id               SERIAL PRIMARY KEY,
  covoiturage_id   INTEGER      NOT NULL REFERENCES covoiturages(id) ON DELETE CASCADE,
  booking_id       INTEGER      DEFAULT NULL REFERENCES covoiturage_bookings(id) ON DELETE SET NULL,
  reviewer_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating           SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment          TEXT         DEFAULT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_reviews (
  id               SERIAL PRIMARY KEY,
  reviewer_id      INTEGER      REFERENCES users(id),
  reviewed_id      INTEGER      REFERENCES users(id),
  ride_id          INTEGER,
  rating           INTEGER      CHECK (rating BETWEEN 1 AND 5),
  comment          TEXT,
  role             TEXT         CHECK (role IN ('driver','passenger')),
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_covoiturages_status_date
  ON covoiturages (status, ride_date, ride_time);
CREATE INDEX IF NOT EXISTS idx_covoiturages_user_created
  ON covoiturages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_covoiturages_depart_dest
  ON covoiturages (departure_commune_id, destination_commune_id);
CREATE INDEX IF NOT EXISTS idx_covoiturage_bookings_ride
  ON covoiturage_bookings (covoiturage_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_ride
  ON ride_bookings (ride_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_passenger
  ON ride_bookings (passenger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_status
  ON ride_bookings (status, expires_at)
  WHERE status IN ('pending','auto_confirmed','accepted');
CREATE INDEX IF NOT EXISTS idx_covoiturage_reviews_ride
  ON covoiturage_reviews (covoiturage_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewed
  ON user_reviews (reviewed_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pro_reviews (
  id                SERIAL PRIMARY KEY,
  pro_id            INTEGER      REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id       INTEGER      REFERENCES users(id),
  rating            INTEGER      CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  verified_purchase BOOLEAN      DEFAULT FALSE,
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_reviews_pro
  ON pro_reviews (pro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_reviews_reviewer
  ON pro_reviews (reviewer_id, created_at DESC);

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

ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS active_from TIME;
ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS active_until TIME;
ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS active_days INTEGER[] DEFAULT '{1,2,3,4,5}';
ALTER TABLE auto_replies ADD COLUMN IF NOT EXISTS reply_delay_minutes INTEGER DEFAULT 0;

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

CREATE TABLE IF NOT EXISTS pro_transporters (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER      REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name       TEXT         NOT NULL,
  transport_type     TEXT[]       NOT NULL,
  vehicle_description TEXT,
  vehicle_capacity   INTEGER      DEFAULT 4,
  vehicle_photo_url  TEXT,
  license_number     TEXT,
  insurance_number   TEXT,
  base_price_xpf     INTEGER      DEFAULT 0,
  price_per_km_xpf   INTEGER      DEFAULT 0,
  service_zones      TEXT[],
  is_verified        BOOLEAN      DEFAULT FALSE,
  is_available       BOOLEAN      DEFAULT TRUE,
  rating             DECIMAL(3,2) DEFAULT 0,
  rides_completed    INTEGER      DEFAULT 0,
  created_at         TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_availability (
  id              SERIAL PRIMARY KEY,
  transporter_id  INTEGER      REFERENCES pro_transporters(id) ON DELETE CASCADE,
  day_of_week     INTEGER      CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      TIME         NOT NULL,
  end_time        TIME         NOT NULL,
  is_active       BOOLEAN      DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pro_availability_exceptions (
  id               SERIAL PRIMARY KEY,
  transporter_id   INTEGER      REFERENCES pro_transporters(id) ON DELETE CASCADE,
  exception_date   DATE         NOT NULL,
  is_unavailable   BOOLEAN      DEFAULT TRUE,
  start_time       TIME,
  end_time         TIME,
  reason           TEXT
);

CREATE TABLE IF NOT EXISTS pro_rides (
  id                  SERIAL PRIMARY KEY,
  transporter_id      INTEGER      REFERENCES pro_transporters(id),
  client_id           INTEGER      REFERENCES users(id),
  transport_type      TEXT         NOT NULL,
  departure           TEXT         NOT NULL,
  destination         TEXT         NOT NULL,
  departure_lat       DECIMAL(9,6),
  departure_lng       DECIMAL(9,6),
  destination_lat     DECIMAL(9,6),
  destination_lng     DECIMAL(9,6),
  ride_date           DATE         NOT NULL,
  ride_time           TIME         NOT NULL,
  passengers          INTEGER      DEFAULT 1,
  distance_km         DECIMAL(8,2),
  price_xpf           INTEGER      NOT NULL,
  status              TEXT         DEFAULT 'pending'
                           CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','refunded')),
  payment_status      TEXT         DEFAULT 'pending'
                           CHECK (payment_status IN ('pending','paid','refunded','failed')),
  stripe_payment_id   TEXT,
  invoice_number      TEXT,
  notes               TEXT,
  client_rating       INTEGER      CHECK (client_rating BETWEEN 1 AND 5),
  client_review       TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  confirmed_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pro_transporters_user
  ON pro_transporters (user_id);
CREATE INDEX IF NOT EXISTS idx_pro_transporters_verified_available
  ON pro_transporters (is_verified, is_available);
CREATE INDEX IF NOT EXISTS idx_pro_availability_transporter
  ON pro_availability (transporter_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_pro_availability_exceptions_transporter
  ON pro_availability_exceptions (transporter_id, exception_date);
CREATE INDEX IF NOT EXISTS idx_pro_rides_transporter
  ON pro_rides (transporter_id, ride_date DESC, ride_time DESC);
CREATE INDEX IF NOT EXISTS idx_pro_rides_client
  ON pro_rides (client_id, ride_date DESC, ride_time DESC);
CREATE INDEX IF NOT EXISTS idx_pro_rides_status
  ON pro_rides (status, payment_status);

ALTER TABLE pro_transporters ADD COLUMN IF NOT EXISTS pro_phone TEXT;
ALTER TABLE pro_transporters ADD COLUMN IF NOT EXISTS pro_website TEXT;
ALTER TABLE pro_transporters ADD COLUMN IF NOT EXISTS pro_hours TEXT;
ALTER TABLE pro_transporters ADD COLUMN IF NOT EXISTS pro_siret TEXT;

-- ── INDEX supplémentaires pour les performances ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_annonces_boosted  ON annonces (boosted_until) WHERE boosted_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_google      ON users (google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_apple       ON users (apple_id)  WHERE apple_id  IS NOT NULL;
-- CATALOGUE PRODUITS PRO
CREATE TABLE IF NOT EXISTS products (
  id                       SERIAL PRIMARY KEY,
  owner_id                 INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                    TEXT         NOT NULL,
  slug                     TEXT         NOT NULL,
  description              TEXT         NOT NULL,
  price_xpf                INTEGER      NOT NULL DEFAULT 0,
  compare_at_price_xpf     INTEGER      DEFAULT NULL,
  stock_quantity           INTEGER      NOT NULL DEFAULT 0,
  sku                      TEXT         DEFAULT NULL,
  brand                    TEXT         DEFAULT NULL,
  category_id              INTEGER      DEFAULT NULL REFERENCES categories(id),
  commune_id               INTEGER      DEFAULT NULL REFERENCES communes(id),
  unit_label               TEXT         DEFAULT NULL,
  cover_image_url          TEXT         DEFAULT NULL,
  is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
  is_featured              BOOLEAN      NOT NULL DEFAULT FALSE,
  published_listing_count   INTEGER      NOT NULL DEFAULT 0,
  last_published_listing_id INTEGER      DEFAULT NULL REFERENCES annonces(id) ON DELETE SET NULL,
  last_published_at        TIMESTAMPTZ  DEFAULT NULL,
  archived_at              TIMESTAMPTZ  DEFAULT NULL,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_owner_slug ON products (owner_id, slug);
CREATE INDEX IF NOT EXISTS idx_products_owner ON products (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_commune ON products (commune_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (owner_id, is_active, archived_at);

CREATE TABLE IF NOT EXISTS product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT         NOT NULL,
  position    INTEGER      NOT NULL DEFAULT 0,
  alt_text    TEXT         DEFAULT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images (product_id, position, id);

-- ── PURGE AUTOMATIQUE DES TOKENS EXPIRÉS (appelé par pg_cron ou un cron job) ─
-- Exemple de cron job à ajouter : 0 3 * * * psql -U troca -d troca_prod -c "SELECT cleanup_expired_tokens();"
CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS void AS $$
BEGIN
  DELETE FROM refresh_tokens WHERE expires_at < NOW();
  DELETE FROM password_reset_tokens WHERE expires_at < NOW();
  DELETE FROM rgpd_logs WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_analytics_events() RETURNS void AS $$
BEGIN
  DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
