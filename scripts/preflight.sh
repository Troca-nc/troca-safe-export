#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

source "$ENV_FILE"

required_vars=(
  BASE_URL
  DB_NAME
  DB_USER
  DB_PASSWORD
  REDIS_PASSWORD
  JWT_SECRET
  JWT_ACCESS_EXPIRES
  JWT_REFRESH_EXPIRES
  NEXT_PUBLIC_API_URL
)

missing=0

is_placeholder() {
  local value="${1:-}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  [[ -z "$value" ]] && return 0
  local lowered="${value,,}"
  [[ "$lowered" == *"changeme"* ]] && return 0
  [[ "$lowered" == *"dev_secret_change_in_prod"* ]] && return 0
  [[ "$lowered" == *"coller_la_cle_ici"* ]] && return 0
  [[ "$lowered" == *"placeholder"* ]] && return 0
  return 1
}

for key in "${required_vars[@]}"; do
  value="${!key:-}"
  if is_placeholder "$value"; then
    echo "Missing required variable: $key" >&2
    missing=1
  fi
done

if [[ -n "${JWT_SECRET:-}" && ${#JWT_SECRET} -lt 64 ]]; then
  echo "JWT_SECRET too short (min 64 chars)" >&2
  missing=1
fi

if [[ "$missing" -ne 0 ]]; then
  echo "Preflight failed" >&2
  exit 1
fi

echo "Preflight OK"
