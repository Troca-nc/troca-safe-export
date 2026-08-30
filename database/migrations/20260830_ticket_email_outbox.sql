-- Only new paid orders are enqueued by application code. No historical backfill.
CREATE TABLE ticket_email_outbox (
  id BIGSERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL UNIQUE REFERENCES ticket_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dead', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  last_error_code TEXT
);
CREATE INDEX ticket_email_outbox_pending_idx
  ON ticket_email_outbox (available_at, id) WHERE status = 'pending';
