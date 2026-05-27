# Audit Troca — 2026-05-27

## Résumé exécutif

| Sévérité | Nombre |
|----------|--------|
| 🔴 Critique | 1 |
| 🟠 Majeur | 9 |
| 🟡 Mineur | 1 |
| 🔵 Info | 1 |

**Total : 12 problèmes identifiés**

---

## Problèmes critiques 🔴

### [SEC-001] Refresh tokens exposés au JavaScript et stockés côté client
- **Fichier** : `backend/src/routes/auth.js:81-173`, `backend/src/routes/auth.social.js:60-146`, `frontend/src/lib/tokenStorage.ts:1-28`, `frontend/src/store/authStore.ts:97-216`, `mobile/lib/tokenStorage.ts:1-62`, `mobile/store/authStore.ts:67-108`
- **Description** : Les endpoints d’authentification renvoient `access_token` et `refresh_token` dans la réponse JSON, puis le frontend les persiste dans `sessionStorage` côté web et dans `SecureStore`/`localStorage` côté mobile/web. Le refresh token n’est pas géré comme cookie `HttpOnly`.
- **Impact** : Un XSS, une extension compromise ou un contexte navigateur vulnérable peut exfiltrer un refresh token et permettre de prolonger une session. Sur mobile web fallback, le token reste aussi accessible depuis du stockage JS.
- **Correction recommandée** : Passer à un flux où le refresh token est émis et renouvelé via cookie `HttpOnly`, `Secure`, `SameSite`, avec suppression de la persistance JS pour le refresh token. Garder l’access token très court et le renouvellement côté serveur.

---

## Problèmes majeurs 🟠

### [AUTH-001] Déconnexion incomplète car le bearer access token n’est pas toujours révoqué
- **Fichier** : `backend/src/routes/auth.js:163-173`, `frontend/src/store/authStore.ts:206-215`, `mobile/store/authStore.ts:105-108`
- **Description** : Le backend ne blackliste l’access token qu’à condition qu’un `Authorization: Bearer ...` soit présent. Or les flux logout côté frontend/mobile envoient surtout le `refresh_token` dans le body, sans garantir l’envoi du bearer.
- **Impact** : Un access token déjà émis peut rester valide jusqu’à expiration, même après déconnexion apparente.
- **Correction recommandée** : Unifier la stratégie de logout: soit envoyer explicitement le bearer access token au logout, soit centraliser l’invalidation côté serveur avec un état de session/rotation qui révoque access + refresh de manière fiable.

### [DB-001] `users.commune_id` n’a pas de clé étrangère vers `communes(id)`
- **Fichier** : `database/schema.sql:32-49`
- **Description** : La colonne `commune_id` de `users` est indexée mais n’est reliée à aucune contrainte `FOREIGN KEY`, contrairement à d’autres tables du schéma.
- **Impact** : Des références orphelines ou invalides peuvent exister si une commune est supprimée ou si la donnée est altérée.
- **Correction recommandée** : Ajouter une FK explicite vers `communes(id)` et prévoir une migration de nettoyage des valeurs existantes.

### [DB-002] Schéma `search_alerts` incohérent entre `schema.sql`, migration et code
- **Fichier** : `database/schema.sql:232-243`, `database/migrations/004_add_search_alerts.sql:3-101`, `backend/src/routes/alert.route.js:202-291`, `backend/src/jobs/scheduler.js:610-764`
- **Description** : `schema.sql` définit encore l’ancienne forme de `search_alerts` (`active`, `last_sent`), alors que la migration 004 et les routes utilisent `frequency`, `status`, `nb_results`, `last_sent_at`, `unsubscribe_token` et `updated_at`.
- **Impact** : Une base recréée depuis `schema.sql` n’a pas la même structure que le code courant; les alertes de recherche peuvent casser sur une installation propre ou après restauration.
- **Correction recommandée** : Réconcilier `schema.sql` avec l’état migré réel, ou documenter clairement que `schema.sql` n’est pas suffisant sans les migrations.

### [DB-003] Schéma des images d’annonce en décalage avec le code (`position` vs `sort_order` / `is_cover`)
- **Fichier** : `database/schema.sql:179-189`, `backend/src/routes/upload.js:130-262`, `backend/src/routes/annonces.js:302-306,805-806`, `backend/src/services/demoSeedService.js:279,447-453`
- **Description** : Le schéma de `annonce_images` déclare `position`, alors que le code lit et écrit `sort_order` et `is_cover`.
- **Impact** : Sur un schéma reconstruit depuis `schema.sql`, l’ordre des photos et la gestion de la couverture peuvent devenir incohérents ou se casser.
- **Correction recommandée** : Uniformiser les colonnes entre schéma, seed et routes, puis migrer les données existantes vers un seul modèle.

### [ERR-001] `SearchAutocomplete` contient une expression invalide qui bloque la build frontend
- **Fichier** : `frontend/src/components/ui/SearchAutocomplete.tsx:31-35,84-90`
- **Description** : La fonction `getHistory()` contient `JSON.parse(sessionStorage.getItem(HISTORY_KEY) ? '[]')`, et la boucle d’initialisation des suggestions utilise `for (const l of data.data ? [])`, deux expressions mal formées.
- **Impact** : La build frontend échoue déjà sur ce fichier; la barre de recherche/autocomplete ne peut pas être validée tant que cette corruption syntaxique reste présente.
- **Correction recommandée** : Remettre une logique de parsing et de mapping correcte, puis relancer la build pour vérifier qu’aucune autre erreur masquée ne subsiste.

### [ERR-002] `useAlerts` a une logique de rafraîchissement cassée
- **Fichier** : `frontend/src/hooks/useAlerts.ts:33-37`
- **Description** : Le `refresh()` contient une affectation invalide (`setAlerts((payload as AlertsResponse).data ? (payload as { data?: SearchAlert[] }).data ? [])`) qui ne peut pas produire un tableau d’alertes valide.
- **Impact** : La liste d’alertes ne peut pas être hydratée correctement; l’écran de gestion des alertes est au minimum dégradé, et la compilation peut échouer dès que ce fichier est évalué.
- **Correction recommandée** : Restaurer un mapping clair de `response.data.data` vers `setAlerts`, avec une validation de type explicite.

### [ERR-003] `useImageUpload` renvoie des métadonnées d’upload corrompues
- **Fichier** : `frontend/src/hooks/useImageUpload.ts:47-77`
- **Description** : Le mapping `toUploadedImage()` et l’initialisation `serializeInitial()` contiennent plusieurs ternaires mal formés (`thumbnail_url: payload.thumbnail_url ? null`, `medium_url: payload.medium_url ? payload.url ? null`, `order: image.order ? index`, etc.).
- **Impact** : Le flux d’upload d’images peut produire des objets invalides, perdre l’ordre des images ou casser selon l’endroit où ce hook est consommé.
- **Correction recommandée** : Remettre un mapping explicite et typé des métadonnées retournées par l’API, puis vérifier l’upload et le tri des images.

### [ERR-004] `useMessaging` contient plusieurs expressions invalides qui fragilisent la messagerie
- **Fichier** : `frontend/src/hooks/useMessaging.ts:71-77,129-166,194-204,283-287`
- **Description** : Plusieurs lignes de récupération/mapping sont mal formées (`const list: Conversation[] = data.data ? []`, `sender_id: Number(currentUserId.current ? 0)`, `const msgs: Message[] = data.data?.messages ? []`, `cursorRef.current = data.pagination?.before ? null`).
- **Impact** : La liste de conversations, le chargement des messages et l’envoi optimiste peuvent devenir vides ou incohérents; la feature messagerie est à risque de compilation ou de comportement erroné.
- **Correction recommandée** : Réécrire uniquement les branches de parsing/mapping touchées avec des valeurs de secours claires et des tests ciblés sur les flux de conversation.

### [SEC-002] Les en-têtes de sécurité sont partiels: CSP et HSTS ne sont pas configurés
- **Fichier** : `frontend/next.config.js:61-71`, `backend/src/index.js:76-96`
- **Description** : Le frontend ajoute `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` et `Permissions-Policy`, mais aucune `Content-Security-Policy` ni `Strict-Transport-Security` n’est définie dans le repo; côté backend, seuls les CORS sont configurés.
- **Impact** : L’application n’a pas de barrière CSP documentée dans le code pour limiter l’impact d’un XSS, et la politique de transport strict n’est pas visible au niveau du projet.
- **Correction recommandée** : Ajouter une CSP adaptée au site et une HSTS si le déploiement HTTPS le permet, idéalement au niveau du reverse proxy ou des headers Next/HTTP.

---

## Problèmes mineurs 🟡

### [PERF-001] Plusieurs requêtes de production utilisent `SELECT *`
- **Fichier** : `backend/src/routes/annonces.js:462,626`, `backend/src/routes/covoiturage.route.js:415`, `backend/src/jobs/scheduler.js:433`, `backend/src/services/trocWorkflowService.js:762`
- **Description** : Des requêtes de lecture en production récupèrent toutes les colonnes via `SELECT *` ou `c.*`.
- **Impact** : Surfetching, couplage fort au schéma et coût inutile sur certaines routes chaudes.
- **Correction recommandée** : Remplacer les `SELECT *` par des listes de colonnes explicites dans les chemins fréquentés.

---

## Informations 🔵

### [SEC-003] Helper SQL d’admin fragile si réutilisé hors constantes internes
- **Fichier** : `backend/src/routes/admin.routes.js:71-87`
- **Description** : Le helper `countDaysSeries()` interpolate `tableName`, `dateColumn` et `extraWhere` directement dans la requête SQL. Le code actuel semble l’utiliser avec des valeurs internes, mais la surface est fragile.
- **Impact** : Si ce helper est réutilisé avec des entrées non strictement contrôlées, il devient un point d’injection SQL difficile à auditer.
- **Correction recommandée** : Restreindre ce helper à des constantes sûres, ou le remplacer par une API plus explicite qui n’accepte que des identifiants validés.

---

## Ce qui fonctionne bien ✅

- Les secrets critiques sont externalisés via l’environnement, et `backend/src/config/jwt.js` impose une clé JWT configurée en production.
- Les routes d’authentification et de paiement utilisent des validateurs `Joi` et des rate limiters dédiés.
- Les webhooks Stripe et PayPlug vérifient leur signature et alimentent une table d’events pour l’idempotence.
- Les routes de modification sensibles côté annonces/upload/messages appliquent des gardes d’authentification et des contrôles d’accès ciblés.
- Le backend applique une whitelist CORS explicite plutôt qu’un `*`.
- Le mobile natif utilise `SecureStore` pour les tokens, ce qui est préférable à un simple stockage en clair.
- Le schéma SQL contient déjà des index utiles sur plusieurs champs filtrés fréquemment.
---

## Corrections appliquÃ©es

| ID | Statut | Commit |
|----|--------|--------|
| SEC-001 | âœ… CorrigÃ© | `1ce6b42` |
| AUTH-001 | âœ… CorrigÃ© | `b9d8ffe` |
| DB-001 | âœ… CorrigÃ© | `9d9a488` |
| DB-002 | âœ… CorrigÃ© | `e672fb9` |
| DB-003 | âœ… CorrigÃ© | `ccf43bb` |
| ERR-001 | âœ… CorrigÃ© | `445f728` |
| ERR-002 | âœ… CorrigÃ© | `c4e9c4b` |
| ERR-003 | âœ… CorrigÃ© | `ac9775b` |
| ERR-004 | âœ… CorrigÃ© | `68c0beb` |
| SEC-002 | âœ… CorrigÃ© | `1030b51` |
| PERF-001 | âœ… CorrigÃ© | `7952902` |
| SEC-003 | âœ… CorrigÃ© | `79200d7` |

