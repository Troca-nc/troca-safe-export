#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${BASE_URL:-https://troca.nc}}"

check() {
  local url="$1"
  local label="$2"
  echo "Checking ${label}: ${url}"
  curl -fsS "${url}" >/dev/null
}

echo "Troca smoke test"
echo "Base URL: ${BASE_URL}"

check "${BASE_URL}/api/health" "API health"
check "${BASE_URL}/" "Home"
check "${BASE_URL}/annonces" "Listings"
check "${BASE_URL}/sitemap.xml" "Sitemap"
check "${BASE_URL}/robots.txt" "Robots"
check "${BASE_URL}/mentions-legales" "Legal notice"
check "${BASE_URL}/contact" "Contact"

echo "Smoke test passed"
