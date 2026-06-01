# Changelog

## [1.1.0] - 2026-05-25

### Sécurité

- Correction de la révocation des tokens d'accès via la blacklist Redis.
- Vérification des signatures des webhooks PayPlug.
- Validation stricte des métadonnées de listings avec Joi.
- Masquage des PII dans les logs d'erreur.
- Ajout des helpers de compatibilité `tokenService` et `verifyToken`.
- Ajout du CSRF double-submit et du scan Trivy CI.
