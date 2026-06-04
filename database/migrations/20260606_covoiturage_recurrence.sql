ALTER TABLE covoiturages
  ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) NOT NULL DEFAULT 'none'
    CHECK (recurrence_type IN ('none', 'daily', 'weekly'));

ALTER TABLE covoiturages
  ADD COLUMN IF NOT EXISTS recurrence_days JSONB NOT NULL DEFAULT '[]';

ALTER TABLE covoiturages
  ADD COLUMN IF NOT EXISTS recurrence_until DATE DEFAULT NULL;

ALTER TABLE covoiturages
  ADD COLUMN IF NOT EXISTS recurrence_count INTEGER DEFAULT NULL;

ALTER TABLE covoiturages
  ADD COLUMN IF NOT EXISTS recurrence_parent_id INTEGER DEFAULT NULL REFERENCES covoiturages(id) ON DELETE CASCADE;
