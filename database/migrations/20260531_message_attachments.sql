ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attachment_mime_type VARCHAR(120) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attachment_size_bytes INTEGER DEFAULT NULL;

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_type_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_type_check
  CHECK (type IN ('text', 'offer', 'photo', 'audio', 'document', 'system'));
