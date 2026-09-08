CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  rid CHAR(7) NOT NULL UNIQUE,
  ridet CHAR(10) NOT NULL,
  legal_name TEXT NOT NULL,
  ridet_verified_at TIMESTAMPTZ,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT companies_rid_format CHECK (rid ~ '^[0-9]{7}$'),
  CONSTRAINT companies_ridet_format CHECK (ridet ~ '^[0-9]{10}$'),
  CONSTRAINT companies_ridet_matches_rid CHECK (LEFT(ridet, 7) = rid)
);

CREATE TABLE IF NOT EXISTS company_members (
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, user_id),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members (company_id);
