-- Run this migration alone after backup, not the unreconciled migration runner.
-- Preserve the existing allowed types. No data updates, provider or status changes.
DO $$
DECLARE
  payment_table regclass := 'payments'::regclass;
  type_attribute smallint;
  previous_expression text;
BEGIN
  PERFORM set_config('lock_timeout', '5s', true);
  EXECUTE format('LOCK TABLE %s IN ACCESS EXCLUSIVE MODE', payment_table);
  SELECT attnum INTO type_attribute FROM pg_attribute
    WHERE attrelid = payment_table AND attname = 'type' AND NOT attisdropped;
  SELECT pg_get_expr(conbin, conrelid) INTO previous_expression FROM pg_constraint
    WHERE conrelid = payment_table AND conname = 'payments_type_check'
      AND contype = 'c' AND convalidated
      AND conkey = ARRAY[type_attribute]::smallint[];
  IF previous_expression IS NULL THEN
    RAISE EXCEPTION 'Expected validated, type-only payments_type_check; inspect schema before migrating';
  END IF;
  -- The expression comes from PostgreSQL's catalog, not application input.
  EXECUTE format(
    'ALTER TABLE %s ADD CONSTRAINT payments_type_check_p0_expanded CHECK ((%s) OR type IN (''campaign'', ''event_ticket''))',
    payment_table, previous_expression
  );
  EXECUTE format('ALTER TABLE %s DROP CONSTRAINT payments_type_check', payment_table);
  EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT payments_type_check_p0_expanded TO payments_type_check', payment_table);
END $$;
