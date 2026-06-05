CREATE TABLE IF NOT EXISTS pro_quotes (
  id                     SERIAL PRIMARY KEY,
  pro_id                 INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_user_id      INTEGER      DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  source_quote_request_id INTEGER     DEFAULT NULL REFERENCES pro_quote_requests(id) ON DELETE SET NULL,
  quote_number           TEXT         NOT NULL UNIQUE,
  share_token            TEXT         NOT NULL UNIQUE,
  requester_name         TEXT         NOT NULL,
  requester_email        TEXT         NOT NULL,
  requester_phone        TEXT         DEFAULT NULL,
  commune                TEXT         NOT NULL,
  subject                TEXT         NOT NULL,
  client_note            TEXT         DEFAULT NULL,
  items                  JSONB        NOT NULL DEFAULT '[]'::jsonb,
  subtotal_xpf           INTEGER      NOT NULL DEFAULT 0,
  tax_rate               NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount_xpf         INTEGER      NOT NULL DEFAULT 0,
  total_xpf              INTEGER      NOT NULL DEFAULT 0,
  validity_days          INTEGER      NOT NULL DEFAULT 30,
  status                 VARCHAR(20)  NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'refused', 'expired', 'converted')),
  valid_until            TIMESTAMPTZ  DEFAULT NULL,
  sent_at                TIMESTAMPTZ  DEFAULT NULL,
  viewed_at              TIMESTAMPTZ  DEFAULT NULL,
  accepted_at            TIMESTAMPTZ  DEFAULT NULL,
  refused_at             TIMESTAMPTZ  DEFAULT NULL,
  refused_reason         TEXT         DEFAULT NULL,
  converted_listing_id   INTEGER      DEFAULT NULL REFERENCES annonces(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_pro_quotes_updated_at ON pro_quotes;
CREATE TRIGGER trg_pro_quotes_updated_at
  BEFORE UPDATE ON pro_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_pro_quotes_pro_created ON pro_quotes (pro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_quotes_requester_created ON pro_quotes (requester_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_quotes_status ON pro_quotes (status, created_at DESC);
