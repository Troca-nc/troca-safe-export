# Changelog

## [1.0.0-rc1] - 2026-06-14

### Baseline production-ready
- Backend durci : Docker déterministe, secrets via env, audit clean
- Frontend : injection NEXT_PUBLIC_* corrigée pour les builds prod
- Admin : reconstruit, audit clean
- Mobile : overrides pnpm appliqués, peer deps résolus
- CI/CD : workflows durcis, jobs de scan non-bloquants sur warnings
- Docker prod : docker-compose.prod.yml corrigé, backup Dockerfile ajouté
- Preflight : scripts/preflight.sh strict et fiable
- Runbook : runbook de prod réaligné sur l'architecture actuelle
- Repo : artefacts QA purgés, .gitignore et .dockerignore blindés

## [1.1.0] - 2026-05-25

### Sécurité

- Correction de la révocation des tokens d'accès via la blacklist Redis.
- Vérification des signatures des webhooks PayPlug.
- Validation stricte des métadonnées de listings avec Joi.
- Masquage des PII dans les logs d'erreur.
- Ajout des helpers de compatibilité `tokenService` et `verifyToken`.
- Ajout du CSRF double-submit et du scan Trivy CI.
