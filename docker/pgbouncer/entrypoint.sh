#!/bin/sh
set -eu

DB_USER="${DB_USER:-troca}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-troca}"
PGBOUNCER_PORT="${PGBOUNCER_PORT:-6432}"
PGBOUNCER_POOL_MODE="${PGBOUNCER_POOL_MODE:-transaction}"
PGBOUNCER_MAX_CLIENT_CONN="${PGBOUNCER_MAX_CLIENT_CONN:-500}"
PGBOUNCER_DEFAULT_POOL_SIZE="${PGBOUNCER_DEFAULT_POOL_SIZE:-50}"
PGBOUNCER_RESERVE_POOL_SIZE="${PGBOUNCER_RESERVE_POOL_SIZE:-20}"
PGBOUNCER_SERVER_IDLE_TIMEOUT="${PGBOUNCER_SERVER_IDLE_TIMEOUT:-600}"
PGBOUNCER_LISTEN_ADDR="${PGBOUNCER_LISTEN_ADDR:-0.0.0.0}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
AUTH_TYPE="${PGBOUNCER_AUTH_TYPE:-md5}"

if [ -z "$DB_PASSWORD" ]; then
  echo "[pgbouncer] DB_PASSWORD manquant" >&2
  exit 1
fi

MD5_HASH=$(printf '%s%s' "$DB_PASSWORD" "$DB_USER" | md5sum | awk '{print $1}')
printf '"%s" "md5%s"\n' "$DB_USER" "$MD5_HASH" > /etc/pgbouncer/userlist.txt

cat > /etc/pgbouncer/pgbouncer.generated.ini <<EOF
[databases]
$DB_NAME = host=$POSTGRES_HOST port=$POSTGRES_PORT dbname=$DB_NAME

[pgbouncer]
listen_addr = $PGBOUNCER_LISTEN_ADDR
listen_port = $PGBOUNCER_PORT
auth_type = $AUTH_TYPE
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = $PGBOUNCER_POOL_MODE
max_client_conn = $PGBOUNCER_MAX_CLIENT_CONN
default_pool_size = $PGBOUNCER_DEFAULT_POOL_SIZE
reserve_pool_size = $PGBOUNCER_RESERVE_POOL_SIZE
server_idle_timeout = $PGBOUNCER_SERVER_IDLE_TIMEOUT
ignore_startup_parameters = extra_float_digits
admin_users = $DB_USER
stats_users = $DB_USER
log_connections = 1
log_disconnections = 1
EOF

exec pgbouncer /etc/pgbouncer/pgbouncer.generated.ini
