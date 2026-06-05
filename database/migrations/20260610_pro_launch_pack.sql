CREATE TABLE IF NOT EXISTS pro_launch_packs (
  id                       SERIAL PRIMARY KEY,
  pro_id                   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  status                   VARCHAR(20)  NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed')),
  call_scheduled_at        TIMESTAMPTZ  DEFAULT NULL,
  call_phone               TEXT         DEFAULT NULL,
  call_notes               TEXT         DEFAULT NULL,
  completed_at             TIMESTAMPTZ  DEFAULT NULL,
  expires_at               TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_pro_launch_packs_updated_at ON pro_launch_packs;
CREATE TRIGGER trg_pro_launch_packs_updated_at
  BEFORE UPDATE ON pro_launch_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS pro_onboarding_steps (
  id              SERIAL PRIMARY KEY,
  pack_id         INTEGER      NOT NULL REFERENCES pro_launch_packs(id) ON DELETE CASCADE,
  pro_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_key        VARCHAR(60)  NOT NULL,
  title           TEXT         NOT NULL,
  points          INTEGER      NOT NULL DEFAULT 1,
  completed_at    TIMESTAMPTZ  DEFAULT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (pro_id, step_key)
);

DROP TRIGGER IF EXISTS trg_pro_onboarding_steps_updated_at ON pro_onboarding_steps;
CREATE TRIGGER trg_pro_onboarding_steps_updated_at
  BEFORE UPDATE ON pro_onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_pro_onboarding_steps_pro_key
  ON pro_onboarding_steps (pro_id, step_key);
