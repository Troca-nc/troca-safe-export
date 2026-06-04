ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pro_quote_template JSONB NOT NULL DEFAULT '{}'::jsonb;
