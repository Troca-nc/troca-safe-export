ALTER TABLE events
  ADD COLUMN IF NOT EXISTS allow_organizer_messages BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE conversations
  ALTER COLUMN annonce_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_conversation_type_check;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_conversation_type_check
  CHECK (conversation_type IN ('listing_chat', 'event_chat', 'troc_negotiation', 'troc_cycle'));

ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_context_check;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_context_check
  CHECK (
    (annonce_id IS NOT NULL AND event_id IS NULL)
    OR (annonce_id IS NULL AND event_id IS NOT NULL AND conversation_type = 'event_chat')
  );

CREATE INDEX IF NOT EXISTS idx_conversations_event
  ON conversations (event_id)
  WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_event_buyer
  ON conversations (event_id, buyer_id)
  WHERE event_id IS NOT NULL;
