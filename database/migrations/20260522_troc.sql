-- Troc v1: listings troc, propositions, cycles, badges, swipes.

ALTER TABLE annonces
  ADD COLUMN IF NOT EXISTS is_troc BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS troc_accepts_complement_xpf BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS troc_complement_max_xpf INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS troc_wants TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS troc_status VARCHAR(20) NOT NULL DEFAULT 'open';

UPDATE annonces
   SET is_troc = TRUE,
       troc_wants = CASE
         WHEN array_length(regexp_split_to_array(COALESCE(contre_quoi, ''), '[,;/|]+'), 1) IS NULL
           THEN ARRAY[contre_quoi]
         ELSE regexp_split_to_array(contre_quoi, '[,;/|]+')
       END,
       troc_status = 'open'
 WHERE COALESCE(TRIM(contre_quoi), '') <> '';

UPDATE annonces
   SET is_troc = COALESCE(is_troc, FALSE),
       troc_accepts_complement_xpf = COALESCE(troc_accepts_complement_xpf, FALSE),
       troc_complement_max_xpf = COALESCE(troc_complement_max_xpf, 0),
       troc_wants = COALESCE(troc_wants, '{}'::text[]),
       troc_status = COALESCE(troc_status, 'open')
 WHERE is_troc IS NULL
    OR troc_accepts_complement_xpf IS NULL
    OR troc_complement_max_xpf IS NULL
    OR troc_wants IS NULL
    OR troc_status IS NULL;

ALTER TABLE annonces
  DROP CONSTRAINT IF EXISTS annonces_troc_status_check;

ALTER TABLE annonces
  ADD CONSTRAINT annonces_troc_status_check
  CHECK (troc_status IN ('open', 'negotiating', 'completed', 'cancelled'));

ALTER TABLE annonces
  DROP CONSTRAINT IF EXISTS annonces_troc_complement_check;

ALTER TABLE annonces
  ADD CONSTRAINT annonces_troc_complement_check
  CHECK (
    (troc_accepts_complement_xpf = FALSE AND troc_complement_max_xpf = 0)
    OR troc_complement_max_xpf >= 0
  );

CREATE INDEX IF NOT EXISTS idx_annonces_is_troc
  ON annonces (is_troc, troc_status, created_at DESC)
  WHERE is_troc = TRUE AND deleted_at IS NULL;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(30) NOT NULL DEFAULT 'listing_chat',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_conversation_type_check;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_conversation_type_check
  CHECK (conversation_type IN ('listing_chat', 'troc_negotiation', 'troc_cycle'));

CREATE INDEX IF NOT EXISTS idx_conversations_type
  ON conversations (conversation_type);

CREATE TABLE IF NOT EXISTS troc_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id INTEGER NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  proposer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offered_listing_ids INTEGER[] NOT NULL DEFAULT '{}'::int[],
  offered_description TEXT,
  offered_photos TEXT[] NOT NULL DEFAULT '{}'::text[],
  complement_xpf INTEGER NOT NULL DEFAULT 0,
  complement_direction VARCHAR(10) NOT NULL DEFAULT 'none'
    CHECK (complement_direction IN ('none', 'i_pay', 'they_pay')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'seen', 'accepted', 'declined', 'countered', 'expired', 'completed')),
  counter_proposal_id UUID REFERENCES troc_proposals(id) ON DELETE SET NULL,
  message TEXT,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_troc_proposals_listing
  ON troc_proposals (listing_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_troc_proposals_proposer
  ON troc_proposals (proposer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_troc_proposals_expires
  ON troc_proposals (expires_at, status)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_troc_proposals_conversation
  ON troc_proposals (conversation_id);

CREATE TABLE IF NOT EXISTS troc_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids INTEGER[] NOT NULL,
  listing_ids INTEGER[] NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'all_accepted', 'broken', 'completed')),
  confirmations INTEGER[] NOT NULL DEFAULT '{}'::int[],
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours')
);

CREATE INDEX IF NOT EXISTS idx_troc_cycles_status
  ON troc_cycles (status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_troc_cycles_participants
  ON troc_cycles USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_troc_cycles_listings
  ON troc_cycles USING GIN (listing_ids);

CREATE TABLE IF NOT EXISTS troc_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge VARCHAR(30) NOT NULL CHECK (badge IN ('first_troc', 'regular_trader', 'master_trader', 'cycle_master')),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge)
);

CREATE INDEX IF NOT EXISTS idx_troc_badges_user
  ON troc_badges (user_id, earned_at DESC);

CREATE TABLE IF NOT EXISTS troc_swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('right', 'left')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_troc_swipes_user
  ON troc_swipes (user_id, direction, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_troc_swipes_listing
  ON troc_swipes (listing_id, created_at DESC);
