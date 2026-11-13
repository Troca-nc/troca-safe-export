ALTER TABLE ticket_orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'ticket_orders_payment_method_check'
  ) THEN
    ALTER TABLE ticket_orders
      ADD CONSTRAINT ticket_orders_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('free', 'onsite', 'stripe'));
  END IF;
END $$;
