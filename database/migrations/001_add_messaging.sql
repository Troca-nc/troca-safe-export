-- ── Migration SQL — Messagerie Troca ─────────────────────────────────────────

-- ── Conversations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id           SERIAL PRIMARY KEY,
  annonce_id   INTEGER     NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  buyer_id     INTEGER     NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  seller_id    INTEGER     NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'archived', 'blocked')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 1 seule conversation par (annonce, acheteur)
  UNIQUE (annonce_id, buyer_id)
);

-- Colonnes d'archivage côté acheteur et vendeur (soft archive par utilisateur)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_archived_buyer  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_archived_seller BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_conv_buyer_id  ON conversations (buyer_id);
CREATE INDEX IF NOT EXISTS idx_conv_seller_id ON conversations (seller_id);
CREATE INDEX IF NOT EXISTS idx_conv_updated   ON conversations (updated_at DESC);

-- ── Messages ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  conv_id     INTEGER     NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id   INTEGER     NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL DEFAULT 'text'
                CHECK (type IN ('text', 'offer', 'photo', 'system')),
  content     TEXT        DEFAULT NULL,
  photo_url   VARCHAR(500) DEFAULT NULL,
  read_at     TIMESTAMPTZ DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_id    ON messages (conv_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender     ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (conv_id, sender_id)
  WHERE read_at IS NULL;

-- ── Offres de prix ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_offers (
  id            SERIAL PRIMARY KEY,
  message_id    INTEGER     NOT NULL REFERENCES messages(id) ON DELETE CASCADE UNIQUE,
  conv_id       INTEGER     NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  buyer_id      INTEGER     NOT NULL REFERENCES users(id),
  amount_xpf    INTEGER     NOT NULL CHECK (amount_xpf > 0),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','declined','countered','expired')),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  responded_at  TIMESTAMPTZ DEFAULT NULL,
  counter_offer_id INTEGER  DEFAULT NULL REFERENCES message_offers(id)
);

CREATE INDEX IF NOT EXISTS idx_offers_conv_id ON message_offers (conv_id);
CREATE INDEX IF NOT EXISTS idx_offers_status  ON message_offers (status, expires_at)
  WHERE status = 'pending';

-- ── Tokens push Expo ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(200) NOT NULL UNIQUE,
  platform    VARCHAR(10)  NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens (user_id);

-- ── Trigger updated_at conversations ─────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_conv_updated_at ON conversations;
CREATE TRIGGER trg_conv_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Vue nb messages non lus par user ─────────────────────────────────────────
CREATE OR REPLACE VIEW user_unread_counts AS
SELECT
  CASE WHEN c.buyer_id  = m.sender_id THEN c.seller_id
       ELSE c.buyer_id END          AS user_id,
  c.id                              AS conv_id,
  COUNT(*)                          AS unread_count
FROM messages m
JOIN conversations c ON c.id = m.conv_id
WHERE m.read_at IS NULL
GROUP BY 1, 2;

-- ── Expiration des offres (à appeler via cron) ────────────────────────────────
CREATE OR REPLACE FUNCTION expire_pending_offers()
RETURNS INTEGER AS $$
DECLARE expired_count INTEGER;
BEGIN
  UPDATE message_offers
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;
