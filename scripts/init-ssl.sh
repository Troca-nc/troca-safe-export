#!/bin/bash
# ============================================================
# init-ssl.sh — Obtenir le certificat SSL Let's Encrypt
# À exécuter UNE SEULE FOIS avant docker compose up
# Usage : bash scripts/init-ssl.sh troca.nc admin@troca.nc
# ============================================================

set -eu

DOMAIN="${1:-troca.nc}"
EMAIL="${2:-admin@troca.nc}"
CERTBOT_WWW="troca_certbot_www"
CERTBOT_CONF="troca_certbot_conf"

echo "🔐 Initialisation SSL pour $DOMAIN..."

# Créer les volumes nommés si nécessaire
docker volume create "$CERTBOT_WWW" >/dev/null
docker volume create "$CERTBOT_CONF" >/dev/null

TMP_CONF="$(mktemp)"
cleanup() {
  rm -f "$TMP_CONF"
  docker stop certbot_temp >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Étape 1 : démarrer un Nginx temporaire qui sert le webroot ACME
echo ""
echo "Étape 1 — Démarrage du serveur ACME temporaire..."
cat > "$TMP_CONF" <<EOF
server {
  listen 80;
  server_name ${DOMAIN} www.${DOMAIN};

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 200 'ACME challenge server';
    add_header Content-Type text/plain;
  }
}
EOF

docker run -d --rm \
  --name certbot_temp \
  -p 80:80 \
  -v "$CERTBOT_WWW:/var/www/certbot" \
  -v "$TMP_CONF:/etc/nginx/conf.d/default.conf:ro" \
  nginx:1.25-alpine \
  nginx -g "daemon off;"

sleep 3

# Étape 2 : obtenir le certificat avec le webroot partagé
echo ""
echo "Étape 2 — Demande du certificat Let's Encrypt..."
docker run --rm \
  -v "$CERTBOT_CONF:/etc/letsencrypt" \
  -v "$CERTBOT_WWW:/var/www/certbot" \
  certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

echo ""
echo "✅ Certificat obtenu pour $DOMAIN et www.$DOMAIN"
echo ""
echo "Vous pouvez maintenant lancer :"
echo "  docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build"
echo ""
echo "⚠️  Le certificat expire dans 90 jours."
echo "    Le renouvellement est déclenché par la tache cron ajoutee par scripts/install.sh."
