#!/bin/sh
set -eu

SERVER_NAME="${SERVER_NAME:-51.255.161.64.nip.io}"
NGINX_SSL_ENABLED="${NGINX_SSL_ENABLED:-false}"

SRC_DIR="/etc/nginx/conf.d"
RENDER_DIR="/tmp/nginx-rendered"

rm -rf "$RENDER_DIR"
mkdir -p "$RENDER_DIR/conf.d"

# The base nginx.conf is static. We keep a writable copy under /tmp so the
# rendered server snippets can be included from a clean bootstrap directory.
cp /etc/nginx/nginx.conf "$RENDER_DIR/nginx.conf"

render_site_block() {
  src="$1"
  dest="$2"
  mode="$3"
  tmp="$dest.tmp"

  envsubst '$SERVER_NAME' < "$src" > "$tmp"

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
    envsubst '$SERVER_NAME' < "$SRC_DIR/admin.kalico.nc.conf" > "$RENDER_DIR/conf.d/admin.kalico.nc.conf"
  fi
else
  render_site_block "$SRC_DIR/kalico.nc.conf" "$RENDER_DIR/conf.d/kalico.nc.conf" "http"
fi

exec nginx -c "$RENDER_DIR/nginx.conf" -g 'daemon off;'
