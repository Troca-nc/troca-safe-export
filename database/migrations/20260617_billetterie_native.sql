-- Kalico — Sprint 3: billetterie native

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  bon_plan_id INTEGER REFERENCES bon_plans(id) ON DELETE CASCADE,
  organizer_id INTEGER REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  venue_name VARCHAR(200),
  venue_address TEXT,
  commune_id INTEGER REFERENCES communes(id),
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  end_time TIME,
  cover_image_url TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  category VARCHAR(50)
    CHECK (category IN (
      'concert', 'festival', 'sport', 'marche',
      'conference', 'exposition', 'cinema',
      'spectacle', 'autre'
    )),
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'published', 'cancelled', 'completed'
    )),
  has_ticketing BOOLEAN DEFAULT FALSE,
  max_capacity INTEGER,
  tickets_sold INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  organizer_name VARCHAR(200),
  organizer_email VARCHAR(255),
  organizer_phone VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_xpf INTEGER NOT NULL DEFAULT 0,
  quantity_total INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0,
  CONSTRAINT quantity_check CHECK (quantity_sold + quantity_reserved <= quantity_total)
);

CREATE TABLE IF NOT EXISTS ticket_orders (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  buyer_id INTEGER REFERENCES users(id),
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(200) NOT NULL,
  buyer_phone VARCHAR(30),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'reserved', 'paid',
      'cancelled', 'refunded', 'expired'
    )),
  total_xpf INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_client_secret TEXT,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES ticket_orders(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id),
  ticket_type_id INTEGER REFERENCES ticket_types(id),
  buyer_name VARCHAR(200),
  buyer_email VARCHAR(255),
  price_xpf INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  qr_code_url TEXT,
  is_scanned BOOLEAN DEFAULT FALSE,
  scanned_at TIMESTAMPTZ,
  scanned_by INTEGER REFERENCES users(id),
  scan_location TEXT,
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN (
      'active', 'used', 'cancelled', 'refunded'
    )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_token ON tickets(token);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_event ON ticket_orders(event_id, status);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_expires ON ticket_orders(expires_at) WHERE status = 'reserved';
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id, is_active, position);

