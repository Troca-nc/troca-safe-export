# Audit Troca — 2026-05-24

## Résumé exécutif

| Sévérité | Nombre |
|---|---:|
| 🔴 Critique | 1 |
| 🟠 Majeur | 3 |
| 🟡 Mineur | 1 |
| 🔵 Info | 1 |

**Total : 6 problèmes identifiés**

---

## Problèmes critiques 🔴

### [SEC-001] Jetons d'authentification stockés côté navigateur en `localStorage`
- **Fichier** : `frontend/src/lib/api.ts:54-56, 151-155, 192-228` ; `frontend/src/store/authStore.ts:151-153, 203-205`
- **Description** : le frontend web lit, stocke et renvoie les `access_token` et `refresh_token` via `localStorage`.
- **Impact** : une faille XSS ou un script injecté peut exfiltrer les jetons et permettre une prise de contrôle de compte.
- **Correction recommandée** : déplacer le `refresh_token` dans un cookie `HttpOnly` `Secure` avec `SameSite` strict et éviter tout stockage persistant lisible par JavaScript.

---

## Problèmes majeurs 🟠

### [AUTH-001] Déconnexion sans révocation serveur de l'access token
- **Fichier** : `backend/src/routes/auth.js:161-166` ; `backend/src/config/jwt.js:60-104`
- **Description** : la route `/logout` ne supprimait que le `refresh_token` côté client.
- **Impact** : un jeton volé restait utilisable jusqu'à son expiration naturelle.
- **Correction recommandée** : ajouter une stratégie de révocation serveur pour les access tokens et la vérifier dans `verifyAccessToken`.

### [PAY-001] Webhook PayPlug authentifié de manière indirecte seulement
- **Fichier** : `backend/src/routes/payment.route.js:1242-1279` ; `backend/src/services/payplugService.js:181-186`
- **Description** : le webhook PayPlug reposait sur une vérification indirecte via l'API PayPlug.
- **Impact** : l'authenticité du callback était plus fragile que celle du webhook Stripe.
- **Correction recommandée** : appliquer une vérification de signature ou de secret partagé avant tout traitement métier.

### [DB-001] Validation des métadonnées immobilier trop permissive
- **Fichier** : `backend/src/services/listingMetadata.js:139-172`
- **Description** : la catégorie `immobilier` utilisait un fallback trop permissif.
- **Impact** : des payloads mal formés ou incomplets pouvaient être persistés.
- **Correction recommandée** : remplacer ce fallback par un schéma Joi strict.

---

## Problèmes mineurs 🟡

### [UX-001] Le setup TOTP admin affichait un faux QR code non scannable
- **Fichier** : `admin/src/app/setup/page.tsx:12-38` ; `admin/src/lib/qr.ts:22-51`
- **Description** : la page de première configuration pouvait prêter à confusion avec un visuel non standard.
- **Impact** : le parcours d'activation pouvait échouer côté utilisateur.
- **Correction recommandée** : rendre le flux explicitement manuel ou utiliser un vrai QR scannable.

---

## Informations 🔵

### [RGPD-001] Les logs d'erreur contiennent encore des données personnelles
- **Fichier** : `backend/src/services/errorLogStore.js:7-35` ; `backend/src/middleware/errorHandler.js:19-32`
- **Description** : les erreurs journalisaient des champs PII et des fragments de payload métier.
- **Impact** : les logs Redis et l'interface admin exposaient des données personnelles au-delà du strict nécessaire.
- **Correction recommandée** : minimiser les champs journalisés, élargir la redaction et limiter la conservation.

---

## Ce qui fonctionne bien ✅

- La surface API globale a un rate limiter dédié sur `/api/`, avec des limiters spécialisés pour l'authentification, les paiements, les uploads et la messagerie.
- Les routes publiques CORS passent par une whitelist explicite.
- Les webhooks Stripe vérifient la signature et appliquent une idempotence via `webhook_events`.
- Les routes de modification d'annonces vérifient la propriété de la ressource avant `PUT`, `DELETE` et actions liées.
- Le handler d'erreurs masque le stack trace en production pour les réponses 500.
- Le backend admin est isolé derrière un token séparé et un rate limit dédié.
- Le statut d'abonnement est recalculé à la lecture à partir de `current_period_end`.
- Les tokens mobiles sont stockés via `SecureStore` sur les builds non web.
- La validation des métadonnées par catégorie sert de base saine aux nouveaux types.

---

## Corrections appliquées

| ID | Statut | Commit |
|---|---|---|
| SEC-001 | ✅ Corrigé | 09a832a |
| AUTH-001 | ✅ Corrigé | 849f3a2, f05c6f2 |
| PAY-001 | ✅ Corrigé | 3bac1c3 |
| DB-001 | ✅ Corrigé | 7ad3523 |
| UX-001 | ✅ Corrigé | 9452ccb |
| RGPD-001 | ✅ Corrigé | ce3c109 |

