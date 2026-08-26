#!/bin/sh
set -eu

CONTAINER_NAME="${NGINX_CONTAINER_NAME:-kalico_nginx}"
RETENTION_DAYS="${NGINX_LOG_RETENTION_DAYS:-14}"
LOCK_DIR="/tmp/kalico-nginx-log-rotation.lock"

case "$RETENTION_DAYS" in
  ''|*[!0-9]*)
    echo "[nginx-log-rotation] NGINX_LOG_RETENTION_DAYS must be a non-negative integer" >&2
    exit 1
    ;;
esac

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "[nginx-log-rotation] Another rotation is already running" >&2
  exit 1
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT INT TERM

if ! docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null | grep -qx true; then
  echo "[nginx-log-rotation] Container $CONTAINER_NAME is not running" >&2
  exit 1
fi

if [ "${1:-}" = "--dry-run" ]; then
  docker exec "$CONTAINER_NAME" sh -c '
    for file in /var/log/nginx/access.log /var/log/nginx/error.log; do
      [ -f "$file" ] || continue
      printf "%s|" "$(basename "$file")"
      wc -c < "$file"
    done
  '
  exit 0
fi

docker exec "$CONTAINER_NAME" sh -eu -c '
  retention_days="$1"
  timestamp=$(date -u +%Y%m%dT%H%M%SZ)
  rotated_files=""

  for name in access error; do
    source="/var/log/nginx/$name.log"
    [ -s "$source" ] || continue
    destination="$source-$timestamp"
    mv "$source" "$destination"
    rotated_files="$rotated_files $destination"
  done

  if [ -n "$rotated_files" ]; then
    nginx -s reopen
    sleep 1
    for file in $rotated_files; do
      gzip "$file"
    done
  fi

  find /var/log/nginx -maxdepth 1 -type f -name "*.log-*.gz" -mtime "+$retention_days" -delete
' sh "$RETENTION_DAYS"

echo "[nginx-log-rotation] Rotation completed"
