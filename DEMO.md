# Lancer la demo Troca NC

## Demarrage rapide

Depuis la racine du depot :

```bash
npm run seed
npm run dev
```

Les scripts racine chargent automatiquement `.env.demo`.

Note importante: `.env.demo` est prévu pour le lancement local via `start-demo.cmd` ou les scripts npm du projet. Ne le passez pas directement à `docker compose --env-file`, car la valeur bcrypt de `ADMIN_PASSWORD_HASH` contient des `\$` et peut provoquer de l'interpolation inattendue.

Sous Windows, vous pouvez aussi lancer :

```bat
start-demo.cmd
```

## Pre-requis locaux

```bash
npm run migrate
```

Avant de lancer la demo, assurez-vous que PostgreSQL et Redis sont disponibles sur `localhost`.
Si votre base est deja initialisee, les migrations ne s'appliquent qu'une seule fois.

## Services lances par `npm run dev`

- Backend API sur `http://localhost:3001`
- Frontend web sur `http://localhost:3000`
- Dashboard admin sur `http://localhost:3002`

Le mobile Expo se lance separement si necessaire :

```bash
cd mobile
npx expo start
```

## Comptes de demo

| Role | Email | Mot de passe |
|------|-------|--------------|
| Particulier | `particulier@demo.troca.nc` | `Demo1234!` |
| Pro | `pro@demo.troca.nc` | `Demo1234!` |
| Bon plan | `bonplan@demo.troca.nc` | `Demo1234!` |
| Admin demo web/mobile | `admin@demo.troca.nc` | `Demo1234!` |
| Admin back-office | `admin@troca.nc` | `admin1234` |

Code SMS universel : `123456`
Code TOTP admin : `123456`

## Ce que la demo couvre

- Annonces classiques
- Troc avec Troc-o-metre, propositions et cycles
- Covoiturage avec alertes trajet
- Services entre particuliers
- Locations courte duree
- Immobilier
- Dons d'objets
- Bons Plans
- Abonnements Pro
- Chat temps reel
- Dashboard admin
- Pages legales et RGPD
