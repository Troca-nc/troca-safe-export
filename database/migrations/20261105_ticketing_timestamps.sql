-- Align the native ticketing schema with the reservation and payment services.
-- Both services update these timestamps on every inventory/order transition.

ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE ticket_orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
