CREATE TABLE IF NOT EXISTS pro_booking_settings (
  id                    SERIAL PRIMARY KEY,
  pro_id                INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  is_enabled            BOOLEAN      NOT NULL DEFAULT FALSE,
  title                 TEXT         NOT NULL DEFAULT 'Prendre rendez-vous',
  subtitle              TEXT         NOT NULL DEFAULT 'Réservez un créneau directement avec ce professionnel.',
  location_label        TEXT         NOT NULL DEFAULT 'Lieu du rendez-vous',
  location_text         TEXT         DEFAULT NULL,
  instructions          TEXT         DEFAULT NULL,
  slot_duration_minutes INTEGER      NOT NULL DEFAULT 30,
  advance_notice_hours  INTEGER      NOT NULL DEFAULT 24,
  max_days_ahead        INTEGER      NOT NULL DEFAULT 30,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_pro_booking_settings_updated_at ON pro_booking_settings;
CREATE TRIGGER trg_pro_booking_settings_updated_at
  BEFORE UPDATE ON pro_booking_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS pro_booking_slots (
  id          SERIAL PRIMARY KEY,
  pro_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at   TIMESTAMPTZ  NOT NULL,
  ends_at     TIMESTAMPTZ  NOT NULL,
  label       TEXT         DEFAULT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'booked', 'blocked', 'cancelled')),
  source      VARCHAR(20)  NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'dashboard', 'public')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_pro_booking_slots_updated_at ON pro_booking_slots;
CREATE TRIGGER trg_pro_booking_slots_updated_at
  BEFORE UPDATE ON pro_booking_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_pro_booking_slots_pro_start
  ON pro_booking_slots (pro_id, starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_pro_booking_slots_status
  ON pro_booking_slots (status, starts_at ASC);

CREATE TABLE IF NOT EXISTS pro_bookings (
  id                  SERIAL PRIMARY KEY,
  pro_id              INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_user_id   INTEGER      DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  slot_id             INTEGER      DEFAULT NULL REFERENCES pro_booking_slots(id) ON DELETE SET NULL,
  requester_name      TEXT         NOT NULL,
  requester_email     TEXT         NOT NULL,
  requester_phone     TEXT         DEFAULT NULL,
  commune             TEXT         DEFAULT NULL,
  subject             TEXT         NOT NULL,
  details             TEXT         DEFAULT NULL,
  starts_at           TIMESTAMPTZ  NOT NULL,
  ends_at             TIMESTAMPTZ  DEFAULT NULL,
  status              VARCHAR(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  source              VARCHAR(20)  NOT NULL DEFAULT 'public'
    CHECK (source IN ('public', 'dashboard')),
  confirmed_at        TIMESTAMPTZ  DEFAULT NULL,
  declined_at         TIMESTAMPTZ  DEFAULT NULL,
  cancelled_at        TIMESTAMPTZ  DEFAULT NULL,
  completed_at        TIMESTAMPTZ  DEFAULT NULL,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_pro_bookings_updated_at ON pro_bookings;
CREATE TRIGGER trg_pro_bookings_updated_at
  BEFORE UPDATE ON pro_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_pro_bookings_pro_start
  ON pro_bookings (pro_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_bookings_requester
  ON pro_bookings (requester_user_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_bookings_status
  ON pro_bookings (status, starts_at DESC);
