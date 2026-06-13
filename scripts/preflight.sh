#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

load_env_file() {
  local file="$1"
  local line key value

  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "${line//[[:space:]]/}" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue

    key="${line%%=*}"
    value="${line#*=}"

    key="${key#export }"
    key="${key#${key%%[![:space:]]*}}"
    key="${key%${key##*[![:space:]]}}"

    if [[ -z "$key" || "$key" == "$line" ]]; then
      continue
    fi

    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    printf -v "$key" '%s' "$value"
    export "$key"
  done < "$file"
}

load_env_file "$ENV_FILE"

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

production_required_vars=(
  BACKEND_IMAGE
  FRONTEND_IMAGE
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  ADMIN_EMAIL
  ADMIN_PASSWORD_HASH
  ADMIN_TOTP_SECRET
  ADMIN_API_TOKEN
  ADMIN_ALERT_EMAIL
  NEXT_PUBLIC_STRIPE_PK
  NEXT_PUBLIC_GOOGLE_CLIENT_ID
  NEXT_PUBLIC_TURNSTILE_SITE_KEY
  NEXT_PUBLIC_SHOW_DEMO_BAR
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  PAYPLUG_SECRET_KEY
  PAYPLUG_WEBHOOK_SECRET
  TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN
  TWILIO_VERIFY_SID
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  APPLE_CLIENT_ID
  APPLE_TEAM_ID
  APPLE_KEY_ID
  APPLE_PRIVATE_KEY
  INTERNAL_API_TOKEN
  AWS_BUCKET
  AWS_REGION
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
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

if [[ "$ENV_FILE" == *production* ]]; then
  for key in "${production_required_vars[@]}"; do
    value="${!key:-}"
    if is_placeholder "$value"; then
      echo "Missing required production variable: $key" >&2
      missing=1
    fi
  done
fi

if [[ -n "${JWT_SECRET:-}" && ${#JWT_SECRET} -lt 64 ]]; then
  echo "JWT_SECRET too short (min 64 chars)" >&2
  missing=1
fi

if [[ "$missing" -ne 0 ]]; then
  echo "Preflight failed" >&2
  exit 1
fi

echo "Preflight OK"
