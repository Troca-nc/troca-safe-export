# Améliorations de Sécurité - Kalico

Dernière mise à jour : 2026-05-25

## Vérifications effectuées

| ID | Tâche | Statut | Fichiers modifiés | Test de validation |
|---|---|---|---|---|
| AUTH-001 | Révocation des tokens | ✅ Implémenté | `backend/src/routes/auth.js`, `backend/src/services/authAccountService.js`, `backend/src/middleware/auth.js`, `backend/src/services/tokenService.js`, `backend/src/middleware/verifyToken.js` | Déconnexion → token inutilisable (401) |
| PAY-001 | Vérification webhook PayPlug | ✅ Implémenté | `backend/src/services/payplugService.js`, `backend/src/routes/payment.route.js` | Signature invalide → 401 |
| DB-001 | Validation Joi stricte | ✅ Implémenté | `backend/src/services/listingMetadata.js` | Champ non défini / valeur invalide → 400 |
| RGPD-001 | Masquage des PII dans les logs | ✅ Implémenté | `backend/src/services/errorLogStore.js`, `backend/src/middleware/errorHandler.js` | Logs sans PII |

## Tests de validation

- AUTH-001 : déconnexion → token révoqué (401).
- PAY-001 : webhook avec signature invalide → 401.
- DB-001 : champ non défini → 400.
- RGPD-001 : logs masqués.

## Améliorations supplémentaires

- CSRF double-submit activé via `backend/src/middleware/csrf.js` et cookie `kalico_csrf`.
- Cookies sécurisés centralisés via `backend/src/config/cookies.js`.
- Limitation de taille des uploads déjà présente sur les routes d'upload.
- Headers de sécurité Nginx présents sur le vhost public `nginx/sites/kalico.nc.conf`.
- Scan Trivy ajouté en CI via `.github/workflows/security-scan.yml`.
