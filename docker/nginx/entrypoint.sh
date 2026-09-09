#!/bin/sh
set -eu

SERVER_NAME="${SERVER_NAME:-51.255.161.64.nip.io}"
ADMIN_SERVER_NAME="${ADMIN_SERVER_NAME:-admin.51.255.161.64.nip.io}"
: "${NGINX_SSL_ENABLED:?NGINX_SSL_ENABLED must be explicitly set to true or false}"
: "${ADMIN_ALLOWLIST:?ADMIN_ALLOWLIST must contain trusted admin IPv4 addresses or CIDR ranges}"

case "$NGINX_SSL_ENABLED" in
  true|false) ;;
  *)
    echo "ERROR: NGINX_SSL_ENABLED must be exactly true or false." >&2
    exit 1
    ;;
esac

SRC_DIR="/etc/nginx/conf.d"
RENDER_DIR="/tmp/nginx-rendered"

rm -rf "$RENDER_DIR"
mkdir -p "$RENDER_DIR/conf.d"

# The base nginx.conf is static. We keep a writable copy under /tmp so the
# rendered server snippets can be included from a clean bootstrap directory.
cp /etc/nginx/nginx.conf "$RENDER_DIR/nginx.conf"

# Render one fail-closed allowlist shared by both admin server variants.
# Strict validation prevents Nginx directive injection.
allowlist_file="$RENDER_DIR/admin-allowlist.inc"
: > "$allowlist_file"
old_ifs="$IFS"
IFS=','
for network in $ADMIN_ALLOWLIST; do
  network="$(printf '%s' "$network" | tr -d '[:space:]')"
  if ! printf '%s' "$network" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}(/[0-9]{1,2})?$'; then
    echo "ERROR: invalid ADMIN_ALLOWLIST entry: $network" >&2
    exit 1
  fi
  printf 'allow %s;\n' "$network" >> "$allowlist_file"
done
IFS="$old_ifs"
printf 'allow 127.0.0.1;\ndeny all;\n' >> "$allowlist_file"

render_site_block() {
  src="$1"
  dest="$2"
  mode="$3"
  tmp="$dest.tmp"

  envsubst '$SERVER_NAME $ADMIN_SERVER_NAME' < "$src" > "$tmp"

  if [ "$mode" = "https" ]; then
    awk '
      /^# >>> HTTPS_BEGIN/ { keep=1; next }
      /^# <<< HTTPS_END/ { keep=0; next }
      keep { print }
    ' "$tmp" > "$dest"
  else
    awk '
      /^# >>> HTTP_ONLY_BEGIN/ { keep=1; next }
      /^# <<< HTTP_ONLY_END/ { keep=0; next }
      keep { print }
    ' "$tmp" > "$dest"
  fi

  rm -f "$tmp"
}

if [ "$NGINX_SSL_ENABLED" = "true" ]; then
  render_site_block "$SRC_DIR/kalico.nc.conf" "$RENDER_DIR/conf.d/kalico.nc.conf" "https"
  if [ -f "$SRC_DIR/admin.kalico.nc.conf" ]; then
    render_site_block "$SRC_DIR/admin.kalico.nc.conf" "$RENDER_DIR/conf.d/admin.kalico.nc.conf" "https"
  fi
else
  render_site_block "$SRC_DIR/kalico.nc.conf" "$RENDER_DIR/conf.d/kalico.nc.conf" "http"
  if [ -f "$SRC_DIR/admin.kalico.nc.conf" ]; then
    render_site_block "$SRC_DIR/admin.kalico.nc.conf" "$RENDER_DIR/conf.d/admin.kalico.nc.conf" "http"
  fi
fi

exec nginx -c "$RENDER_DIR/nginx.conf" -g 'daemon off;'
