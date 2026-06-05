ALTER TABLE pro_booking_settings
  ADD COLUMN IF NOT EXISTS services_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weekly_hours_json JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE pro_bookings
  ADD COLUMN IF NOT EXISTS service_title TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS service_price_xpf INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS service_duration_minutes INTEGER DEFAULT NULL;

ALTER TABLE pro_launch_packs
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ DEFAULT NULL;
