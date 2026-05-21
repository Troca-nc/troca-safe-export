#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production.local}"
BACKEND_REPLICAS="${2:-2}"
FRONTEND_REPLICAS="${3:-2}"

if [ ! -f "$ENV_FILE" ]; then
  echo "[deploy-scale] Fichier env introuvable: $ENV_FILE" >&2
  exit 1
fi

echo "[deploy-scale] Deploiement multi-instance"
echo "[deploy-scale] Env: $ENV_FILE"
echo "[deploy-scale] Backend replicas: $BACKEND_REPLICAS"
echo "[deploy-scale] Frontend replicas: $FRONTEND_REPLICAS"

docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d --remove-orphans --build postgres redis pgbouncer worker
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d --remove-orphans --build --scale backend="$BACKEND_REPLICAS" --scale frontend="$FRONTEND_REPLICAS" backend frontend
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d --remove-orphans nginx

echo "[deploy-scale] Stack lancee"
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" ps
