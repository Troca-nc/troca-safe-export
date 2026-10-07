ALTER TABLE pro_quotes
  ADD COLUMN IF NOT EXISTS tgc_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deposit_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_amount_xpf INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due_xpf INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS paid_declared_by_user_id INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_note TEXT DEFAULT NULL;

UPDATE pro_quotes
SET tgc_breakdown = jsonb_build_array(jsonb_build_object(
      'rate', tax_rate,
      'base_xpf', subtotal_xpf,
      'amount_xpf', tax_amount_xpf
    )),
    balance_due_xpf = total_xpf
WHERE tgc_breakdown = '[]'::jsonb
  AND deposit_amount_xpf = 0;

ALTER TABLE pro_quotes
  DROP CONSTRAINT IF EXISTS pro_quotes_status_check;

ALTER TABLE pro_quotes
  ADD CONSTRAINT pro_quotes_status_check
  CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'refused', 'expired', 'converted', 'paid'));

ALTER TABLE pro_quotes
  DROP CONSTRAINT IF EXISTS pro_quotes_deposit_percent_check;

ALTER TABLE pro_quotes
  ADD CONSTRAINT pro_quotes_deposit_percent_check
  CHECK (deposit_percent >= 0 AND deposit_percent <= 100);

CREATE TABLE IF NOT EXISTS pro_quote_templates (
  id                SERIAL PRIMARY KEY,
  pro_id            INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT         NOT NULL,
  subject           TEXT         NOT NULL,
  client_note       TEXT         DEFAULT NULL,
  items             JSONB        NOT NULL DEFAULT '[]'::jsonb,
  validity_days     INTEGER      NOT NULL DEFAULT 30 CHECK (validity_days BETWEEN 1 AND 365),
  deposit_percent   NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (deposit_percent >= 0 AND deposit_percent <= 100),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (pro_id, name)
);

DROP TRIGGER IF EXISTS trg_pro_quote_templates_updated_at ON pro_quote_templates;
CREATE TRIGGER trg_pro_quote_templates_updated_at
  BEFORE UPDATE ON pro_quote_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_pro_quote_templates_pro_updated
  ON pro_quote_templates (pro_id, updated_at DESC);
