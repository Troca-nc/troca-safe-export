#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production.local}"
BASE_URL="${2:-${BASE_URL:-https://troca.nc}}"

echo "Troca launch day checklist"
echo "Environment: ${ENV_FILE}"
echo "Base URL: ${BASE_URL}"
echo

echo "[1/4] Preflight"
bash scripts/preflight.sh "${ENV_FILE}"
echo

echo "[2/4] Smoke test"
bash scripts/smoke-test.sh "${BASE_URL}"
echo

echo "[3/4] Manual checks"
echo "- Open the home page"
echo "- Open a listing"
echo "- Sign in"
echo "- Publish a test listing"
echo "- Send a message"
echo "- Upload a photo"
echo

echo "[4/4] Decision"
echo "If all checks passed, the release is green."
