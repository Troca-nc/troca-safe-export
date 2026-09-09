ALTER TABLE troc_proposals
  ADD COLUMN IF NOT EXISTS completion_confirmations INTEGER[] NOT NULL DEFAULT '{}'::int[];
