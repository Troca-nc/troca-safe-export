\getenv pgbouncer_auth_password PGBOUNCER_AUTH_PASSWORD

CREATE ROLE pgbouncer_auth WITH LOGIN PASSWORD :'pgbouncer_auth_password';

CREATE SCHEMA IF NOT EXISTS pgbouncer;
REVOKE ALL ON SCHEMA pgbouncer FROM public;
GRANT USAGE ON SCHEMA pgbouncer TO pgbouncer_auth;

CREATE OR REPLACE FUNCTION pgbouncer.user_lookup(
  IN i_username text,
  OUT uname text,
  OUT phash text
) RETURNS record
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pgbouncer
AS $$
BEGIN
  SELECT usename, passwd
    INTO uname, phash
    FROM pg_catalog.pg_shadow
   WHERE usename = i_username;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION pgbouncer.user_lookup(text) FROM public;
GRANT EXECUTE ON FUNCTION pgbouncer.user_lookup(text) TO pgbouncer_auth;
