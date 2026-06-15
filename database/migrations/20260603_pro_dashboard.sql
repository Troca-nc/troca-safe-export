-- ============================================================
-- Kalico - Phase 2 Espace Pro
-- Stats annonces, boosts, factures et vue agrégée
-- ============================================================

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
  user_id INTEGER REFERENCES users(id),
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
  ON listing_boosts (user_id, status, expires_at DESC);

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
  l.user_id,
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
FROM annonces l
LEFT JOIN listing_stats ls ON ls.listing_id = l.id
LEFT JOIN listing_contacts lc ON lc.listing_id = l.id
LEFT JOIN categories cat ON cat.id = l.category_id
GROUP BY l.user_id, l.id, l.titre, cat.name, l.prix, l.status, l.created_at;

CREATE INDEX IF NOT EXISTS idx_pro_listing_stats_listing_id
  ON pro_listing_stats (listing_id);

ALTER TABLE annonces
  ADD COLUMN IF NOT EXISTS renewed_at TIMESTAMPTZ DEFAULT NULL;
