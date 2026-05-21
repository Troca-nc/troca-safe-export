# Troca - Guide de mise en production

## Mode hors ligne

If you are not using external services, the application can run with a much smaller set of local variables:

- `BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRES`
- `JWT_REFRESH_EXPIRES`

Leave payment, SMS, email, OAuth, AWS and Expo secrets blank to disable those flows cleanly. The backend and mobile UI now detect empty or placeholder values and switch those integrations off.

### Lancement local hors ligne

Build the local images first, then start the stack with the local env file:

```bash
docker build -t troca/backend:offline ./backend
docker build -t troca/frontend:offline ./frontend
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d postgres redis backend frontend
```

Optional:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d nginx
```

Health checks:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3000
```

## Mode multi-instance pour la charge

Quand la stack doit supporter davantage de trafic, utiliser:

```bash
bash scripts/deploy-scale.sh .env.production.local 2 2
```

Ou, de façon explicite:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build postgres redis pgbouncer worker backend frontend nginx
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --scale backend=2 --scale frontend=2 backend frontend
```

Ordre conseille:
1. `postgres`
2. `redis`
3. `pgbouncer`
4. `worker`
5. `backend`
6. `frontend`
7. `nginx`

Rappels:
- `RUN_JOBS=false` sur les instances `backend`
- `RUN_JOBS=true` sur `worker`
- `DB_HOST=pgbouncer` pour tous les processus applicatifs
- `DB_PORT=6432`
- `REDIS_URL` partage pour cache, rate limit et websocket bridge

## Prerequis serveur

- VPS Ubuntu 22.04+ ou 24.04
- Docker + Docker Compose installes
- Domaine `troca.nc` pointant vers l'IP du serveur
- Ports 80 et 443 ouverts

---

## Etape 1 - Variables d'environnement

Copier et remplir le fichier de configuration:

```bash
cp .env.production .env.production.local
nano .env.production.local
```

Variables minimales a renseigner:

- `BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `BACKEND_IMAGE`
- `FRONTEND_IMAGE`
- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `AWS_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYPLUG_SECRET_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`

---

## Etape 2 - Certificat SSL

La premiere fois seulement:

```bash
chmod +x scripts/init-ssl.sh
bash scripts/init-ssl.sh troca.nc admin@troca.nc
```

Ce script genere le certificat Let's Encrypt dans les volumes nommes utilises par la stack.

---

## Etape 3 - Demarrer la stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.local pull backend frontend
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build
```

Verifier l'etat:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Ordre attendu:

1. `postgres` et `redis` passent leur healthcheck
2. `backend` demarre
3. `frontend` demarre
4. `nginx` proxifie le trafic

---

## Etape 4 - Base de donnees

Le schema est monte automatiquement au premier demarrage de PostgreSQL.

Vérification:

```bash
docker exec -it troca_postgres psql -U troca -d troca_prod -c "\dt"
```

Si besoin, appliquer manuellement les scripts SQL:

```bash
docker exec -i troca_postgres psql -U troca -d troca_prod < database/schema.sql
docker exec -i troca_postgres psql -U troca -d troca_prod < database/migrations/001_add_messaging.sql
docker exec -i troca_postgres psql -U troca -d troca_prod < database/migrations/002_add_monetisation.sql
docker exec -i troca_postgres psql -U troca -d troca_prod < database/migrations/003_add_phone_verification.sql
docker exec -i troca_postgres psql -U troca -d troca_prod < database/migrations/004_add_search_alerts.sql
docker exec -i troca_postgres psql -U troca -d troca_prod < database/migrations/005_add_push_tokens.sql
```

---

## Etape 5 - Compte admin

```bash
docker exec -it troca_postgres psql -U troca -d troca_prod -c \
  "UPDATE users SET is_admin = TRUE WHERE email = 'admin@troca.nc';"
```

---

## Etape 6 - Paiements

### Stripe

Configurer le webhook:

- Endpoint: `https://troca.nc/api/payment/webhooks/stripe`
- Evenements:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

### PayPlug

Configurer:

- Endpoint: `https://troca.nc/api/payment/webhooks/payplug`
- Clé secrète: `PAYPLUG_SECRET_KEY`
- Clé publique: `PAYPLUG_PUBLIC_KEY`

---

## Etape 7 - Verification finale

```bash
curl https://troca.nc/api/health
```

Reponse attendue:

```json
{"ok":true,"service":"troca-backend","db":"2026-..."}
```

---

## Commandes utiles

```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml restart nginx
docker exec troca_backup /backup.sh
docker compose -f docker-compose.prod.yml --env-file .env.production.local pull backend frontend
docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build --no-deps backend frontend
```

---

## Renouvellement SSL

La tache cron ajoutee par `scripts/install.sh` execute chaque jour:

```bash
cd /opt/troca && docker compose -f docker-compose.prod.yml --env-file .env.production.local exec -T certbot certbot renew --quiet && docker compose -f docker-compose.prod.yml --env-file .env.production.local restart nginx
```
