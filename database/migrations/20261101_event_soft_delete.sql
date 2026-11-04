ALTER TABLE events
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_events_active_organizer
  ON events (organizer_id, created_at DESC)
  WHERE deleted_at IS NULL;
