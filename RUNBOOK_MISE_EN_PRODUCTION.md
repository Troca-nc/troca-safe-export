# Runbook de mise en production - Troca

Ce runbook suit la stack corrigee:
- `docker-compose.prod.yml` pour l'orchestration
- images backend/frontend publiees sur GHCR
- uploads partages via volume Docker
- backup PostgreSQL automatise
- SSL via Let's Encrypt

## Mode hors ligne

If you are running locally without external providers, keep the following services disabled by leaving their variables blank:

- Stripe
- PayPlug
- Twilio
- SMTP
- Google OAuth
- Apple Sign-In
- AWS / S3
- Expo access token

For this mode, the truly required values are limited to:

- `BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRES`
- `JWT_REFRESH_EXPIRES`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

The backend now fails closed when critical secrets are missing, and the UI disables the offline integrations instead of showing broken flows.

### Démarrage local hors ligne

```bash
docker build -t troca/backend:offline ./backend
docker build -t troca/frontend:offline ./frontend
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d postgres redis backend frontend
```

To include the reverse proxy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d nginx
```

Smoke tests:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3000
```

## 1. Pre-requis

- Domaine `troca.nc` et `www.troca.nc` pointes vers le VPS
- Ports `80` et `443` ouverts
- Docker et Docker Compose installes
- Acces SSH au serveur
- Compte GitHub avec les secrets de deploiement configures

## 2. Fichiers a preparer sur le serveur

1. Copier le projet dans le repertoire de deploiement.
2. Renommer le template `.env.production` en `.env.production.local`.
3. Renseigner toutes les valeurs de production.

### Variables indispensables dans `.env.production.local`

- Base:
  - `BASE_URL=https://troca.nc`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
  - `REDIS_PASSWORD`
  - `JWT_SECRET`
  - `JWT_ACCESS_EXPIRES`
  - `JWT_REFRESH_EXPIRES`
  - `JWT_EXPIRES_IN`
  - `JWT_REFRESH_EXPIRES_IN`
- Docker images:
  - `BACKEND_IMAGE=ghcr.io/quidammm/troca/backend:latest`
  - `FRONTEND_IMAGE=ghcr.io/quidammm/troca/frontend:latest`
- Frontend public:
  - `NEXT_PUBLIC_API_URL=https://troca.nc/api`
  - `NEXT_PUBLIC_STRIPE_PK`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY`
  - `NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY`
  - `NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY`
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO_PLUS_MONTHLY`
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO_PLUS_YEARLY`
  - `NEXT_PUBLIC_PAYPLUG_PLAN_PRO_PLUS_MONTHLY`
  - `NEXT_PUBLIC_PAYPLUG_PLAN_PRO_PLUS_YEARLY`
- Backend secrets:
  - `AWS_BUCKET`
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `PAYPLUG_SECRET_KEY`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_VERIFY_SID`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `APPLE_CLIENT_ID`
  - `APPLE_TEAM_ID`
  - `APPLE_KEY_ID`
  - `APPLE_PRIVATE_KEY`
  - `INTERNAL_API_TOKEN`
  - `ADMIN_EMAIL`

### Variables mobile

Dans `mobile/.env` et dans les profiles EAS:
- `EXPO_PUBLIC_API_URL=https://troca.nc/api`
- `EXPO_PUBLIC_STRIPE_PK`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

## 3. Secrets GitHub Actions

Dans le repo GitHub, configurer:
- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_SSH_KEY`
- `DEPLOY_PATH`
- `BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_STRIPE_PK`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY`
- `NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY`
- `NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO_PLUS_MONTHLY`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO_PLUS_YEARLY`
- `NEXT_PUBLIC_PAYPLUG_PLAN_PRO_PLUS_MONTHLY`
- `NEXT_PUBLIC_PAYPLUG_PLAN_PRO_PLUS_YEARLY`
- `INTERNAL_API_TOKEN`

## 4. Premiere mise en ligne

### 4.0 Preflight local

Avant toute mise en ligne, verifier les variables de prod:

```bash
bash scripts/preflight.sh .env.production.local
```

Si le script echoue:
- corriger les valeurs `CHANGEME`
- renseigner les secrets manquants
- reexecuter jusqu a obtenir `Preflight OK`

Pour un lancement complet en une seule commande de controle:

```bash
bash scripts/launch-day.sh .env.production.local https://troca.nc
```

### 4.1 Certificat SSL

Depuis le repertoire de deploiement:

```bash
bash scripts/init-ssl.sh troca.nc admin@troca.nc
```

Ce script:
- cree les volumes Docker du certificat
- demarre un nginx temporaire pour le challenge ACME
- genere le certificat Let's Encrypt

### 4.2 Demarrer la stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build
```

### 4.3 Verifier l'etat des containers

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local ps
docker compose -f docker-compose.prod.yml --env-file .env.production.local logs -f backend
```

### 4.4 Verifier la base

Si la base est vierge, le schema est applique automatiquement.

Sinon, appliquer les migrations manuellement:

```bash
set -a
. ./.env.production.local
set +a
docker exec -i troca_postgres psql -U "$DB_USER" -d "$DB_NAME" < database/schema.sql
docker exec -i troca_postgres psql -U "$DB_USER" -d "$DB_NAME" < database/migrations/001_add_messaging.sql
docker exec -i troca_postgres psql -U "$DB_USER" -d "$DB_NAME" < database/migrations/002_add_monetisation.sql
docker exec -i troca_postgres psql -U "$DB_USER" -d "$DB_NAME" < database/migrations/003_add_phone_verification.sql
docker exec -i troca_postgres psql -U "$DB_USER" -d "$DB_NAME" < database/migrations/004_add_search_alerts.sql
docker exec -i troca_postgres psql -U "$DB_USER" -d "$DB_NAME" < database/migrations/005_add_push_tokens.sql
```

### 4.5 Creer le compte admin

```bash
set -a
. ./.env.production.local
set +a
docker exec -i troca_postgres psql -U "$DB_USER" -d "$DB_NAME" -c "UPDATE users SET is_admin = TRUE WHERE email = 'admin@troca.nc';"
```

## 5. Checks de mise en prod

### API

```bash
curl http://localhost:3001/api/health
curl https://troca.nc/api/health
```

### Navigateur

- Ouvrir `https://troca.nc`
- Verifier l'affichage du home
- Ouvrir une annonce
- Se connecter
- Publier une annonce

### Test de fumee

Depuis le repertoire de deploiement:

```bash
bash scripts/smoke-test.sh https://troca.nc
```

Ce script verifie:
- `/api/health`
- `/`
- `/annonces`
- `/sitemap.xml`
- `/robots.txt`
- `/mentions-legales`
- `/contact`

### Upload

- Televerser une image sur une annonce de test
- Verifier que l'image est bien servie via `https://troca.nc/uploads/...`

### Messagerie

- Envoyer un message de test
- Verifier la connexion websocket

### Paiements

- Tester Stripe en mode live avec une transaction tres faible si possible
- Tester PayPlug si le compte est active
- Verifier les webhooks dans les logs backend

## 6. Deploiement courant

Le workflow GitHub Actions fait deja:
- tests backend
- build et push des images backend/frontend
- deploiement SSH sur le serveur

En operation normale, le bon flux est:
1. Merge vers `main`
2. Attendre la fin du workflow
3. Verifier les healthchecks
4. Verifier rapidement le front, les uploads et la messagerie

## 6bis. Mode multi-instance (cible ~10k)

Pour une charge plus elevee, la stack doit tourner avec:
- `pgbouncer` entre le backend et PostgreSQL
- `worker` dedie aux jobs cron
- 2 a 3 replicas de `backend`
- 2 replicas de `frontend` si le front est chaud
- Redis partage pour le cache, le rate limit et le temps reel

### Ordre de demarrage recommande

1. `postgres`
2. `redis`
3. `pgbouncer`
4. `worker`
5. `backend`
6. `frontend`
7. `nginx`

### Commande de deploiement

Le plus simple est d'utiliser le script dedie:

```bash
bash scripts/deploy-scale.sh .env.production.local 2 2
```

Si tu veux l'ecrire manuellement:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build postgres redis pgbouncer worker backend frontend nginx
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --scale backend=2 --scale frontend=2 backend frontend
```

Si la charge augmente, on peut passer temporairement a:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --scale backend=3 --scale frontend=2 backend frontend
```

### Points de vigilance

- Ne pas lancer plusieurs fois les jobs cron sur plusieurs instances de backend.
- Garder `RUN_JOBS=false` sur les instances API.
- Garder `RUN_JOBS=true` uniquement sur le service `worker`.
- Si Redis tombe, le cache et le rate limit passent en mode degrade, mais le scale horizontal est nettement moins efficace.
- Verifier que Nginx peut resoudre les replicas Docker apres chaque redemarrage.

## 7. Backup

### Test manuel

```bash
docker exec troca_backup /backup.sh
```

### Verification

- Le fichier `.sql.gz` doit apparaitre dans le volume `/backups`
- L'upload S3 doit apparaitre dans le bucket
- Les logs du conteneur `troca_backup` doivent montrer la planification cron a 2h00

## 8. Restauration

```bash
set -a
. ./.env.production.local
set +a
gunzip -c backup.sql.gz | docker exec -i troca_postgres psql -U "$DB_USER" -d "$DB_NAME"
```

Avant restauration:
1. Stopper temporairement l'ecriture sur la plateforme si possible
2. Faire une sauvegarde actuelle
3. Tester la restauration sur un environnement de preprod si disponible

## 9. Rollback

Si un deploy casse la prod:

1. Identifier le SHA precedent qui marchait.
2. Dans `.env.production.local`, remplacer:
   - `BACKEND_IMAGE=ghcr.io/quidammm/troca/backend:<sha>`
   - `FRONTEND_IMAGE=ghcr.io/quidammm/troca/frontend:<sha>`
3. Redemarrer:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local pull backend frontend
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

## 10. Commandes utiles

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local logs -f
docker compose -f docker-compose.prod.yml --env-file .env.production.local restart backend
docker compose -f docker-compose.prod.yml --env-file .env.production.local restart frontend
docker compose -f docker-compose.prod.yml --env-file .env.production.local restart nginx
docker image prune -f
```

## 11. Points de surveillance les 48 premieres heures

- Erreurs 5xx dans les logs Nginx
- Fuites memoire backend
- Delais de reponse de la base PostgreSQL
- Uploads d'images
- Webhooks Stripe et PayPlug
- Emails transactionnels
- Renouvellement SSL
