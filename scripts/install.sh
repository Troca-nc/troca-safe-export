#!/bin/bash
# ============================================================
# Troca - Script de deploiement initial
# A executer UNE SEULE FOIS sur le serveur AWS
# Ubuntu 24.04 LTS - ap-southeast-2 (Sydney)
# ============================================================

set -eu

DEPLOY_PATH="${DEPLOY_PATH:-/opt/troca}"
DOMAIN="${DOMAIN:-troca.nc}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"

if [ -z "$ADMIN_EMAIL" ]; then
  echo "ERROR: Definissez ADMIN_EMAIL avant de lancer ce script."
  echo "Exemple: ADMIN_EMAIL=admin@troca.nc DOMAIN=troca.nc bash scripts/install.sh"
  exit 1
fi

echo "Installation de Troca sur le serveur..."
echo "Chemin : $DEPLOY_PATH"
echo "Domaine : $DOMAIN"

# 1. Paquets systeme
apt-get update
apt-get upgrade -y
apt-get install -y curl git ufw fail2ban unzip

# 2. Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
systemctl enable docker

# 3. Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "Firewall configure"

# 4. Fail2ban
systemctl enable fail2ban
systemctl start fail2ban
echo "Fail2ban active"

# 5. Structure du projet
mkdir -p "${DEPLOY_PATH}"
mkdir -p "${DEPLOY_PATH}/nginx/logs"
cd "${DEPLOY_PATH}"

# 6. Cloner le repo
REPO_URL="${REPO_URL:-https://github.com/Troca-nc/troca-safe-export.git}"
if [ ! -d .git ]; then
  git clone "$REPO_URL" .
  echo "Code clone"
else
  echo "Depot deja present, mise a jour depuis git"
  git pull
fi

# 7. Variables d'environnement
if [ ! -f .env.production.local ]; then
  cp .env.example .env.production.local
fi

echo ""
echo "Editez ${DEPLOY_PATH}/.env.production.local avant de continuer."
echo "nano ${DEPLOY_PATH}/.env.production.local"
read -r -p "Appuyez sur Entree une fois le fichier .env edite..."

# 8. SSL avec Let's Encrypt
echo "Generation du certificat SSL pour $DOMAIN..."
bash scripts/init-ssl.sh "$DOMAIN" "$ADMIN_EMAIL"
echo "SSL configure"

# 9. Recuperer les images backend / frontend
docker compose -f docker-compose.prod.yml --env-file .env.production.local pull backend frontend

# 10. Demarrage des services
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build
echo "Services demarres"

# 11. Verification sante
sleep 20
if curl -sf "https://${DOMAIN}/api/health"; then
  echo ""
  echo "Troca est en ligne sur https://${DOMAIN}"
else
  echo "Probleme detecte. Verifiez les logs : docker compose logs"
  exit 1
fi

# 12. Cron pour le renouvellement SSL
TMP_CRON="$(mktemp)"
crontab -l 2>/dev/null > "$TMP_CRON" || true
grep -v "certbot renew" "$TMP_CRON" | grep -v "restart nginx" > "${TMP_CRON}.clean" || true
echo "0 12 * * * cd ${DEPLOY_PATH} && docker compose -f docker-compose.prod.yml --env-file .env.production.local exec -T certbot certbot renew --quiet && docker compose -f docker-compose.prod.yml --env-file .env.production.local restart nginx" >> "${TMP_CRON}.clean"
crontab "${TMP_CRON}.clean"
rm -f "$TMP_CRON" "${TMP_CRON}.clean"
echo "Renouvellement SSL automatique configure"

echo ""
echo "=============================================="
echo "Troca deploye avec succes !"
echo "Site  : https://${DOMAIN}"
echo "Admin : https://${DOMAIN}/admin"
echo "Logs  : docker compose logs -f"
echo "=============================================="
