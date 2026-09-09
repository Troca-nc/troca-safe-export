#!/usr/bin/env bash
# ============================================================
# Kalico — Sauvegarde automatique du service
# Exécuté chaque nuit à 2h00
# Conserve 30 jours de sauvegardes locales
# Upload vers AWS S3 pour archivage long terme
#
# FIX SÉCURITÉ : Les variables sensibles (DB_USER, DB_PASSWORD,
# AWS_ACCESS_KEY_ID, etc.) sont injectées directement par Docker
# via la section `environment` du docker-compose.prod.yml.
# Plus besoin de "source .env.production" qui exposait les secrets
# dans l'environnement shell et les logs système.
# ============================================================

set -eu

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
FILENAME="kalico_${DATE}.tar.gz.age"
FILEPATH="${BACKUP_DIR}/${FILENAME}"
STAGING_DIR="$(mktemp -d)"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"

trap 'rm -rf "$STAGING_DIR"' EXIT
umask 077

mkdir -p "$BACKUP_DIR"

# Vérification que les variables requises sont bien injectées
: "${PGUSER:?Variable PGUSER manquante — vérifiez docker-compose.prod.yml}"
: "${PGPASSWORD:?Variable PGPASSWORD manquante — vérifiez docker-compose.prod.yml}"
: "${PGDATABASE:?Variable PGDATABASE manquante — vérifiez docker-compose.prod.yml}"
: "${PGHOST:?Variable PGHOST manquante — vérifiez docker-compose.prod.yml}"
: "${BACKUP_AGE_RECIPIENT:?Variable BACKUP_AGE_RECIPIENT manquante — configurez la clé publique age de restauration}"

echo "[$(date)] Début de la sauvegarde..."

# ── Capture cohérente des données et de la configuration ──
# Les variables PGHOST, PGUSER, PGPASSWORD, PGDATABASE sont
# automatiquement lues par pg_dump depuis l'environnement Docker
pg_dump \
  --no-password \
  --file "$STAGING_DIR/postgres.sql"

cp -a /source/uploads "$STAGING_DIR/uploads"
cp -a /source/letsencrypt "$STAGING_DIR/letsencrypt"
cp /source/config/.env.production.local "$STAGING_DIR/.env.production.local"
cp -a /recovery/config-template "$STAGING_DIR/config-template"

tar -C "$STAGING_DIR" -czf - \
  postgres.sql uploads letsencrypt .env.production.local config-template \
  | age --recipient "$BACKUP_AGE_RECIPIENT" --output "$FILEPATH"

SIZE=$(du -sh "$FILEPATH" | cut -f1)
echo "[$(date)] Sauvegarde créée : $FILENAME ($SIZE)"

# ── Upload vers S3 ──────────────────────────────────────
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY et AWS_BUCKET
# sont injectés par Docker, jamais lus depuis un fichier .env
if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ] && [ -n "${AWS_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
  aws s3 cp \
    "$FILEPATH" \
    "s3://${AWS_BUCKET}/backups/${FILENAME}" \
    --storage-class STANDARD_IA \
    --region "$AWS_REGION"

  echo "[$(date)] Upload S3 réussi"
else
  echo "[$(date)] AWS/S3 indisponible ou incomplet — upload S3 ignoré"
fi

# ── Rotation : garder 30 jours ──────────────────────────
find "$BACKUP_DIR" -name "kalico_*.tar.gz.age" -mtime +30 -delete
echo "[$(date)] Anciennes sauvegardes nettoyées"

echo "[$(date)] ✅ Sauvegarde terminée : $FILENAME"
