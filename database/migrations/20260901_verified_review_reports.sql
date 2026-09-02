CREATE TABLE IF NOT EXISTS verified_review_reports (
  id BIGSERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES verified_reviews(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_verified_review_reports_review
  ON verified_review_reports (review_id, created_at DESC);
