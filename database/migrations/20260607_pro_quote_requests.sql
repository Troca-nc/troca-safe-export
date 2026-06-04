CREATE TABLE IF NOT EXISTS pro_quote_requests (
  id SERIAL PRIMARY KEY,
  pro_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  need_type TEXT NOT NULL,
  commune TEXT NOT NULL,
  budget_xpf INTEGER,
  desired_date TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_quote_requests_pro ON pro_quote_requests (pro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_quote_requests_requester ON pro_quote_requests (requester_user_id, created_at DESC);