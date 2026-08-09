# Audit pré-déploiement — Kalico

Date : 2026-08-09
Mode : **Audit uniquement** — aucun fichier n'a été modifié pendant cette analyse.
Périmètre : `D:\kalico` (frontend, backend, nginx, docker, mobile) hors `node_modules` et `.git`.

Référence consultée : `CODEX_RULES.md` (règles d'encodage UTF-8, dark mode, textes visibles, devise officielle).

> Note méthodologique : ce rapport s'appuie sur des recherches automatisées (grep, lecture de fichiers, `npm audit`) exécutées en lecture seule. Certains constats (ex. contenu réel de `.env.production.local` sur le VPS) sont corroborés par les logs d'un déploiement réel effectué plus tôt dans la session (voir AXE 6, point 6.1).

---

## AXE 1 — SÉCURITÉ

### 1.1 — Mentions légales incomplètes (identité juridique)
**Fichiers** : `frontend/src/app/mentions-legales/page.tsx:23-27,35-37`, `frontend/src/app/politique-de-confidentialite/page.tsx:104`
**Description** : Les champs obligatoires (raison sociale, forme juridique, numéro RIDET, adresse du siège, téléphone, directeur de publication, identité de l'hébergeur) contiennent littéralement le texte placeholder « à renseigner avant publication ».
**Priorité** : **CRITIQUE**
**Suggestion** : Compléter ces champs avec les informations légales réelles de la société avant toute mise en ligne publique — publier un site marchand sans mentions légales complètes est une infraction en droit français/NC.

### 1.2 — Routes `/api/demo/seed` et `/api/demo/seed` (DELETE) sans authentification
**Fichier** : `backend/src/routes/demo.route.js:12-21,32,44`
**Description** : Ces endpoints de réinitialisation/suppression du jeu de données démo ne sont protégés par aucun middleware d'authentification, uniquement par la condition applicative `DEMO_MODE === 'true' || NODE_ENV !== 'production'` (ligne 12-14). Si `NODE_ENV` n'est pas strictement égal à `'production'` sur le serveur de déploiement, n'importe quel visiteur non authentifié peut déclencher un reset complet des données de démonstration.
**Priorité** : **CRITIQUE**
**Suggestion** : Vérifier explicitement la valeur de `NODE_ENV` sur le VPS de prod (`echo $NODE_ENV` dans le conteneur `backend`), s'assurer qu'il vaut exactement `production`, et envisager de retirer entièrement le montage de `demo.route.js` en production plutôt que de compter sur une variable d'environnement.

### 1.3 — Page `/qa` : connexion instantanée à un compte admin sans mot de passe saisi
**Fichiers** : `frontend/src/app/qa/page.tsx` (entier), `frontend/src/lib/demoApi.ts:9-28,34-46`
**Description** : La page publique `/qa` (protégée uniquement par une balise `<meta name="robots" content="noindex">`, pas d'authentification ni de garde serveur) permet une connexion en un clic à 4 comptes démo prédéfinis, dont un compte **admin**, avec mot de passe `Demo1234!` embarqué en dur côté client. Aucun `middleware.ts` Next.js n'intercepte cette route.
**Priorité** : **CRITIQUE**
**Suggestion** : Exclure la route `/qa` du build de production (variable de build, ou suppression du dossier avant `next build` prod), ou a minima la protéger par une vérification serveur stricte de `NODE_ENV === 'production'` côté page (`notFound()` si prod) en plus de la protection backend.

### 1.4 — Dépendances avec vulnérabilités connues, dont une sans correctif (`xlsx`)
**Fichiers** : `frontend/package.json`, `backend/package.json` (résultats `npm audit`)
**Description** : `npm audit` remonte 8 vulnérabilités **high** côté frontend et 8 (7 high + 1 low) côté backend. Notable : `xlsx` (Prototype Pollution + ReDoS, GHSA-4r6h-8v6p-xvw6 / GHSA-5pgg-2g8v-p4x9) **n'a aucun correctif disponible**, et le projet a une fonctionnalité d'import de fichiers (`backend/src/routes/import.route.js`) qui traite potentiellement des fichiers Excel envoyés par des utilisateurs/pros. `sharp` (traitement d'images uploadées) et `pdfjs-dist` sont aussi concernés par des CVE avec correctif disponible mais non appliqué.
**Priorité** : **CRITIQUE**
**Suggestion** : Lancer `npm audit fix` (frontend et backend) pour les paquets avec correctif (`postcss`, `sharp`, `socket.io-parser`, `undici`). Pour `xlsx`, évaluer une bascule vers une alternative maintenue (`exceljs`) ou isoler le traitement de fichiers Excel dans un sandbox/worker dédié tant qu'aucun correctif n'existe, puisque ce paquet traite des fichiers potentiellement fournis par des tiers.

### 1.5 — Fuite de PII (nom + email de l'acheteur) sans authentification via `/scan/[token]`
**Fichier** : `frontend/src/app/scan/[token]/page.tsx:43-70,121-122`
**Description** : `getTicket(token)` est appelé sans vérification d'authentification et affiche `buyer_name`/`buyer_email` avant même que l'utilisateur ne soit connecté — l'authentification n'intervient qu'au moment du scan effectif (ligne 77-83), pas à la lecture des données du billet.
**Priorité** : **CRITIQUE**
**Suggestion** : Exiger l'authentification (ou au minimum masquer le nom/email complet, ex. `j***@***`) dès l'affichage initial du billet, avant l'action de scan.

### 1.6 — Bypass OTP en dur (`123456`) actif hors `NODE_ENV=production`
**Fichier** : `backend/src/services/phoneOtpService.js:13,60,280-357`
**Description** : Un code OTP fixe `123456` est actif dès que `DEMO_MODE === 'true'` **ou** `NODE_ENV !== 'production'`. Comportement similaire dans `passwordResetDeliveryService.js:13` et `fretWorkflowService.js:53`.
**Priorité** : **CRITIQUE** (conditionnel à la config `NODE_ENV` réelle du VPS — voir 6.1)
**Suggestion** : Confirmer que `NODE_ENV=production` est bien injecté dans le conteneur `backend` en prod (pas seulement dans `frontend`). Documenter ce garde-fou dans le runbook de déploiement comme point de vérification obligatoire.

### 1.7 — CSP avec `'unsafe-inline'` sur `script-src`
**Fichiers** : `nginx/sites/kalico.nc.conf:181-192`, `nginx/sites/admin.kalico.nc.conf:71-82`
**Description** : Les deux Content-Security-Policy autorisent `'unsafe-inline'` en `script-src`, ce qui neutralise une grande partie de la protection anti-XSS qu'une CSP est censée apporter.
**Priorité** : **MOYEN**
**Suggestion** : Migrer vers des nonces (`script-src 'self' 'nonce-xxx'`) générés par requête, ou un hash de scripts inline, pour retirer `'unsafe-inline'`.

### 1.8 — `location /uploads/` redéfinit `add_header` et peut perdre les headers de sécurité hérités
**Fichier** : `nginx/sites/kalico.nc.conf:255` (bloc `location /uploads/`)
**Description** : En nginx, si un bloc `location` définit au moins un `add_header`, les `add_header` du `server{}` parent (HSTS, CSP, X-Frame-Options lignes 172-192) ne sont **pas hérités automatiquement**. Le bloc `/uploads/` ne redéfinit que `X-Content-Type-Options` (sans `always`), risquant de servir les fichiers uploadés sans HSTS/CSP/X-Frame-Options.
**Priorité** : **MOYEN**
**Suggestion** : Dupliquer explicitement tous les headers de sécurité dans le bloc `location /uploads/`, ou passer par un `include security_headers.conf;` commun à tous les blocs `location` qui redéfinissent `add_header`.

### 1.9 — `search.route.js` : route `/suggestions` sans application explicite du middleware `optionalAuth`
**Fichier** : `backend/src/routes/search.route.js:201`
**Description** : `optionalAuth` est importé (ligne 9) mais ne semble pas appliqué à la déclaration de la route ligne 201. Probablement intentionnel (recherche publique) mais à confirmer — un oubli d'application de middleware est un pattern d'erreur courant.
**Priorité** : **FAIBLE**
**Suggestion** : Confirmer intentionnellement que cette route doit rester publique sans logique liée à l'utilisateur connecté ; sinon appliquer `optionalAuth` explicitement pour cohérence avec le reste du fichier.

### 1.10 — `backend/src/routes/uploads.js:28` — `GET /:id` public sans vérification de propriété/visibilité
**Fichier** : `backend/src/routes/uploads.js:28`
**Description** : Aucune vérification n'a été identifiée confirmant que le fichier demandé est bien public (vs. document pro confidentiel, pièce jointe privée de conversation, etc.).
**Priorité** : **MOYEN**
**Suggestion** : Vérifier au cas par cas selon le type de fichier stocké si un contrôle d'accès est nécessaire (ex. documents pro KYC ne doivent pas être servis par ID seul).

### 1.11 — TODO non résolus concernant la sécurité des tokens
**Fichiers** : `backend/src/routes/auth.js:155`, `backend/src/services/authAccountService.js:410`
**Description** : `// TODO: test refresh rotation after deploy with Redis blacklist enabled.` — suggère que la révocation des refresh tokens via Redis blacklist n'a pas été testée en conditions réelles.
**Priorité** : **MOYEN**
**Suggestion** : Exécuter ce test de révocation avant le lancement (déconnexion forcée / rotation de token doit effectivement invalider l'ancien token).

---

## AXE 2 — CODE MORT ET DÉMO

### 2.1 — Logique "mode démo" imbriquée dans les flux de production réels
**Fichiers** : `frontend/src/lib/api.ts:459-528`, `frontend/src/store/authStore.ts:32-283`, `backend/src/routes/payment.route.js` (9 branches `if (demoModeEnabled)`), `backend/src/routes/bonPlans.route.js:29,375-852`, `backend/src/services/campaignsService.js:527-530`, `backend/src/services/eventTicketingService.js:298-431`, `backend/src/services/demoSeedService.js` (mot de passe démo en clair `Demo1234!`, ligne 8)
**Description** : Le code de paiement (Stripe/PayPlug), de billetterie et de bons plans contient des branches conditionnelles `demoModeEnabled` intégrées directement dans les routes de production, plutôt qu'isolées.
**Priorité** : **MOYEN**
**Suggestion** : Ce n'est pas bloquant si `DEMO_MODE=false` est garanti en prod, mais représente une dette technique et un risque si la variable est mal positionnée (cf. 1.2/1.6). À terme, isoler complètement le code démo (feature flag au niveau build, ou module séparé non inclus dans le bundle de prod).

### 2.2 — `console.log` en dur dans le code applicatif backend
**Fichiers** : `backend/src/utils/logger.js:68` (logger officiel, transite tout le logging via `console.log` brut sans sink externe visible), `backend/src/services/emailService.js:45`, `backend/src/services/pushService.js:103`, `backend/src/routes/payment.route.js:1527,1593,1608`
**Description** : Voir aussi AXE 6.3 pour le détail des données potentiellement sensibles logguées.
**Priorité** : **FAIBLE**
**Suggestion** : Confirmer qu'un agrégateur de logs externe capture bien stdout en prod (le `console.log` du logger n'est pas un problème en soi si stdout est collecté correctement par Docker/l'infra).

### 2.3 — Composants frontend inutilisés (aucun import trouvé)
**Fichiers** :
`frontend/src/components/annonces/AnnonceSimilaires.tsx`, `ImageUploader.tsx`, `SaveSearchAlert.tsx`, `ShareFloating.tsx`, `frontend/src/components/auth/AuthMapPanel.tsx`, `frontend/src/components/home/CategoryHighlightsSection.tsx`, `HomeSpotlightSection.tsx`, `TrocListingsPreview.tsx`, `frontend/src/components/monetisation/PaymentProviderSelector.tsx`, `frontend/src/components/OnboardingWizard.tsx`, `frontend/src/components/profil/TrustBadge.tsx`, `frontend/src/components/services/ServiceDirectoryPage.tsx`, `frontend/src/components/transport/AvailabilityManager.tsx`, `frontend/src/components/troc/TrocCard.tsx`, `TrocProposalsPanel.tsx`, `frontend/src/components/ui/EmptyStates.tsx`, `SearchAutocomplete.tsx`, `frontend/src/lib/useTourEngine.ts`, `frontend/src/hooks/useInfiniteTrocListings.ts`
**Description** : Aucun autre fichier du projet n'importe ces modules (vérifié par recherche du nom de fichier dans tout `frontend/src`). Note : `ImageUploader.tsx` apparaît aussi en AXE 3/5 (balise `<img>` sans width/height) — code mort qui reste néanmoins listé dans d'autres audits, à vérifier qu'il ne s'agit pas d'un faux positif (import dynamique/lazy non détecté par grep simple).
**Priorité** : **FAIBLE**
**Suggestion** : Vérifier manuellement (ou avec `ts-prune`/`knip`) avant suppression, certains peuvent être importés dynamiquement (`next/dynamic`) ce que le grep simple ne détecte pas toujours.

### 2.4 — Route `/qa` et `/scan` : protection insuffisante
Voir 1.3 (`/qa`) et 1.5 (`/scan/[token]`). `frontend/src/app/scan/page.tsx` (scanner caméra) est public sans authentification, ce qui est acceptable si l'action de scan elle-même est protégée (elle l'est, cf. 1.5).
**Priorité** : voir 1.3/1.5

---

## AXE 3 — PERFORMANCE

### 3.1 — Balises `<img>` natives au lieu de `next/image` (23 occurrences)
**Fichiers** : `frontend/src/components/layout/Header.tsx:523`, `app/appels-offres/AppelsOffresClient.tsx:133`, `components/pro/ProductsManager.tsx:982`, `components/messages/MessagesPage.tsx:589`, `components/PublishWizard/PublishWizard.tsx:258`, `components/messages/ConversationList.tsx:142`, `components/covoiturage/PassengerProfileModal.tsx:164`, `app/annonces/preview/page.tsx:185`, `app/admin/enseignes/page.tsx:131`, `app/profil/page.tsx:494`, `app/evenements/[id]/page.tsx:198`, `components/annonces/ImageUploader.tsx:71`, `components/annonces/AnnonceDetailSections.tsx:281,470`, `app/covoiturage/transport/[id]/page.tsx:183,191`, `app/coupon/[code]/page.tsx:90`, `app/bons-plans/publier/page.tsx:348`, `app/covoiturage/conducteur/[id]/page.tsx:225,233`, `app/bons-plans/enseigne/[slug]/page.tsx:114`, `app/pro/dashboard/coupons/page.tsx:238`
**Description** : Ces images ne bénéficient pas de l'optimisation automatique (lazy-loading, formats modernes, redimensionnement) de `next/image`. Elles n'ont également ni `width` ni `height` explicites (voir 8.4), aggravant le risque de CLS.
**Priorité** : **MOYEN**
**Suggestion** : Remplacer par `next/image` avec `width`/`height` ou `fill` dans un conteneur `relative` dimensionné, en priorité sur les pages à fort trafic (`profil/page.tsx`, `Header.tsx`, `MessagesPage.tsx`).

### 3.2 — `First Load JS` élevé sur certaines routes (constaté lors du build de production)
**Constat** (issu du build réel exécuté cette session) : `/pro/[id]` et `/pro/vitrine-exemple` : **332 kB** First Load JS ; `/pro/dashboard/parametres` : 301 kB ; `/pro/dashboard` : 260/273 kB ; `/pro/dashboard/import` : 243-244 kB — toutes au-dessus du seuil de 200 kB.
**Priorité** : **MOYEN**
**Suggestion** : Analyser ces routes avec `@next/bundle-analyzer` pour identifier les dépendances lourdes (probablement liées à l'éditeur/carte/upload dans `pro/dashboard/import` et aux composants de vitrine pro) et envisager du code-splitting / imports dynamiques (`next/dynamic`).

### 3.3 — Appels `fetch()` sans `cache`/`revalidate` sur des pages à fort trafic
**Fichiers** : `frontend/src/components/home/HomePage.tsx:87,88,89,145` (bons plans, covoiturage, annonces récentes sur la page d'accueil), `frontend/src/app/annonces/page.tsx:895` (listing principal), `frontend/src/app/covoiturage/page.tsx:403`
**Description** : Contrairement à d'autres appels équivalents côté Server Components qui utilisent `next: { revalidate }` (ex. `publicStorefrontData.ts`, `profil/[id]/layout.tsx`), ces fetch n'ont aucune stratégie de cache, sur des pages consultées très fréquemment.
**Priorité** : **MOYEN**
**Suggestion** : Ajouter `next: { revalidate: N }` adapté à la fraîcheur de données requise (ex. 60-300s) sur les fetch de la page d'accueil et du listing d'annonces.

---

## AXE 4 — SEO ET MÉTADONNÉES

### 4.1 — 82 pages `page.tsx` sans `metadata` ni `generateMetadata`
**Fichiers notables (publics, à fort enjeu SEO)** : `frontend/src/app/annonces/page.tsx`, `bons-plans/page.tsx`, `covoiturage/page.tsx`, `evenements/page.tsx`, `immobilier/page.tsx`, `locations/page.tsx`, `services/page.tsx`, `dons/page.tsx`, `fret/page.tsx`, `connexion/page.tsx`, `inscription/page.tsx`, `favoris/page.tsx` (+ liste complète dans les résultats de recherche, environ 50 pages publiques concernées hors zones admin/dashboard pro).
**Description** : Beaucoup de ces pages sont des Client Components (`'use client'`), ce qui interdit structurellement `export const metadata` dans le fichier lui-même ; aucun `generateMetadata` de niveau layout parent ne compense.
**Priorité** : **MOYEN**
**Suggestion** : Pour les pages publiques à fort trafic (annonces, covoiturage, bons-plans, evenements, immobilier, locations, services, fret), déplacer le rendu de contenu dans un composant client séparé et ajouter un `layout.tsx` ou wrapper Server Component avec `generateMetadata`.

### 4.2 — Page `/annonces` (listing principal) sans balise `<h1>`
**Fichier** : `frontend/src/app/annonces/page.tsx`
**Description** : Aucune balise `<h1>` trouvée sur cette page ni dans le `Header` global — c'est probablement la 2ᵉ page la plus visitée du site après l'accueil.
**Priorité** : **MOYEN**
**Suggestion** : Ajouter un `<h1>` (peut être visuellement discret via CSS mais présent dans le DOM) type "Toutes les annonces" ou dynamique selon les filtres actifs.

### 4.3 — `/appels-offres` : aucun `<h1>` détecté
**Fichier** : `frontend/src/app/appels-offres/AppelsOffresClient.tsx`
**Priorité** : **FAIBLE**
**Suggestion** : Ajouter un `<h1>` de section en haut de page.

### 4.4 — robots.txt / sitemap.xml
**Fichiers** : `frontend/src/app/robots.ts`, `frontend/src/app/sitemap.ts`
**Description** : Présents et utilisant la convention officielle Next.js (équivalent fonctionnel à des route handlers dédiés). **Aucun problème détecté.**
**Priorité** : n/a (conforme)

---

## AXE 5 — ACCESSIBILITÉ

### 5.1 — `<img>` sans `alt` dans une popup carte (HTML injecté hors JSX)
**Fichier** : `frontend/src/components/annonces/AnnoncesMap.tsx:119`
**Description** : Chaîne de caractères HTML injectée dynamiquement (popup Leaflet) contenant `<img src="${l.cover_url}" ...>` sans attribut `alt`.
**Priorité** : **FAIBLE**
**Suggestion** : Ajouter `alt=""` (image décorative dans une popup) dans le template de chaîne.

### 5.2 — Boutons icône seule sans `aria-label`
**Fichiers** :
- `frontend/src/components/admin/AdminLayout.tsx:158` (déconnexion — a un `title` mais pas `aria-label`)
- `frontend/src/components/covoiturage/PassengerProfileModal.tsx:151` (fermeture, aucun texte ni `aria-label`)
- `frontend/src/components/covoiturage/RideReviewModal.tsx:105` (fermeture, idem)
- `frontend/src/components/monetisation/BoostModal.tsx:128` (fermeture, idem)
- `frontend/src/components/profil/AlertsManager.tsx:127,140` (pause/suppression alerte, `title` seul)
- `frontend/src/app/admin/annonces/page.tsx:135,193` (suppression / rafraîchir — ligne 193 sans `title` ni `aria-label` du tout)
- `frontend/src/app/admin/users/page.tsx:239` (rafraîchir, sans `title` ni `aria-label`)
**Description** : Boutons ne comportant qu'une icône SVG, sans texte visible ni `aria-label`, inaccessibles aux lecteurs d'écran.
**Priorité** : **MOYEN**
**Suggestion** : Ajouter `aria-label="Fermer"`, `aria-label="Supprimer"`, `aria-label="Rafraîchir"` etc. sur chacun de ces boutons — correction rapide et à fort impact accessibilité.

### 5.3 — Contraste insuffisant de la couleur corail `#e8832a` sur fond clair
**Fichiers** : `frontend/src/app/globals.css:329` (`.btn-ghost { color: var(--coral) }`), `frontend/src/app/globals.css:760` (`.legal-content a { color: var(--coral) }` — liens dans le texte courant des pages CGU/CGV/mentions légales/politique de confidentialité), `globals.css:394` (`.badge-primary`, petit texte)
**Description** : Ratio de contraste `#e8832a` sur blanc ≈ **2,7:1**, en dessous du seuil AA (4,5:1 texte normal / 3:1 texte large). Concerne particulièrement les liens hypertexte dans les pages légales et le texte des boutons secondaires.
**Priorité** : **MOYEN**
**Suggestion** : Foncer légèrement la teinte pour le texte (ex. `#c96a1a` ou plus sombre) tout en gardant `#e8832a` pour les usages non-textuels (fonds de bouton larges, où le contraste texte-blanc-sur-corail est probablement suffisant à vérifier séparément).

### 5.4 — Incohérence de nommage : deux couleurs différentes nommées "coral"
**Fichiers** : `frontend/tailwind.config.js:13` (`coral: '#0A7EA4'`, un bleu) vs `frontend/src/app/globals.css:10` (`--coral: #e8832a`, un orange)
**Description** : Les classes Tailwind `text-coral`/`bg-coral` (117+191 usages dans le repo) pointent vers un bleu `#0A7EA4`, tandis que la variable CSS `var(--coral)` utilisée dans `globals.css` pointe vers un orange `#e8832a`. Illustration concrète : `globals.css:288-291`, le bouton `.btn-primary` a un fond orange mais une ombre portée teintée en bleu — signe d'une désynchronisation entre les deux systèmes.
**Priorité** : **FAIBLE**
**Suggestion** : Renommer l'une des deux variables pour lever l'ambiguïté (ex. `--accent-orange` vs `coral` réservé au bleu, ou l'inverse selon l'intention design réelle — à trancher avec DESIGN.md).

---

## AXE 6 — INFRASTRUCTURE

### 6.1 — Variables d'environnement non définies en production (constaté lors du déploiement réel de cette session)
**Constat direct** : lors du déploiement effectué plus tôt dans cette session (`docker compose ... up -d --build --no-deps frontend` sur le VPS `51.255.161.64`), Docker Compose a émis des dizaines de warnings `"<VAR>" variable is not set. Defaulting to a blank string`, incluant : `AWS_SECRET_ACCESS_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_BUCKET`, `AWS_REGION`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MENSUEL`, `STRIPE_PRICE_PRO_ANNUEL`, `PAYPLUG_SECRET_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_CLIENT_ID`, `APPLE_PRIVATE_KEY`, `ADMIN_ALERT_EMAIL`, `ADMIN_TOTP_SECRET`, `MAX_FILE_SIZE_MB`, `MAX_IMAGES_PER_LISTING`, `NEXT_PUBLIC_STRIPE_PK`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_SHOW_DEMO_BAR`, `BACKEND_IMAGE`.
**Description** : Ceci indique que ces variables ne sont **pas définies** dans le fichier `.env.production.local` chargé sur le VPS au moment du déploiement (ou n'ont pas été correctement exportées vers l'environnement de `docker compose`). Si confirmé, cela signifie que les paiements Stripe/PayPlug, les SMS Twilio (OTP par SMS), la connexion Apple, l'upload S3/AWS, et le captcha Turnstile pourraient être **non fonctionnels en production**.
**Priorité** : **CRITIQUE**
**Suggestion** : Avant le lancement, exécuter sur le VPS `cat /opt/kalico/.env.production.local | grep -E 'STRIPE|TWILIO|AWS|APPLE|TURNSTILE'` (sans afficher les valeurs secrètes en clair dans un canal partagé) pour confirmer si ces variables sont réellement absentes ou seulement mal exportées par le script de déploiement (`set -a && source ...`). Si absentes, les renseigner avant le lancement commercial.

### 6.2 — Variables référencées dans le code mais absentes de `.env.production.example`
**Fichier de référence** : `D:\kalico\.env.production.example`
**Variables backend manquantes** : `CONTACT_EMAIL` (`backend/src/routes/contact.route.js:12`), `TURNSTILE_SECRET_KEY` (`backend/src/services/turnstile.js:9-10` — seule la variante publique `NEXT_PUBLIC_TURNSTILE_SITE_KEY` figure dans l'exemple, pas la clé secrète serveur), `TROC_MATCHING_ENABLED`/`TROC_CYCLE_EXPIRY_HOURS`/`TROC_CYCLE_MAX_DEPTH`/`TROC_PROPOSAL_EXPIRY_DAYS`, `MAX_IMPORT_FILE_SIZE_MB`, `MAX_PRO_DOCUMENT_SIZE_MB`, `MAX_CHAT_FILE_SIZE_MB`, `MAX_AUDIO_FILE_SIZE_MB`, `OBSERVABILITY_ROLE`, `BON_PLAN_VIEWS_FLUSH_INTERVAL_MS`, `TWILIO_PHONE_NUMBER`/`TWILIO_FROM_PHONE`/`TWILIO_SMS_FROM_NUMBER`/`TWILIO_FROM_NUMBER`/`TWILIO_MESSAGING_FROM`.
**Variables frontend manquantes** : `NEXT_PUBLIC_APPLE_CLIENT_ID`, `NEXT_PUBLIC_NODE_ENV`.
**Priorité** : **MOYEN**
**Suggestion** : Compléter `.env.production.example` avec ces variables (notamment `TURNSTILE_SECRET_KEY`, absente alors que la clé publique y figure — asymétrie suspecte) pour fiabiliser les futurs déploiements et éviter l'oubli constaté en 6.1.

### 6.3 — Services Docker Compose sans `healthcheck`
**Fichier** : `docker-compose.prod.yml`
**Services concernés** : `nginx` (ligne 49), `backend` (ligne 152), `certbot` (ligne 77), `backup` (ligne 260). (`postgres`, `redis`, `pgbouncer`, `worker`, `frontend`, `admin` ont bien un healthcheck.)
**Priorité** : **MOYEN**
**Suggestion** : Ajouter un `healthcheck` a minima sur `backend` (ex. `curl -f http://localhost:PORT/api/health`) et `nginx` (ex. `curl -f http://localhost/health` ou test de config), pour permettre à `docker compose`/l'orchestrateur de détecter un service backend down et déclencher un restart automatique.

### 6.4 — Logs backend potentiellement sensibles
**Fichiers** : `backend/src/services/emailService.js:45` (logue l'adresse email complète du destinataire en mode simulation SMTP non configuré), `backend/src/services/pushService.js:103` (30 premiers caractères d'un token push device), `backend/src/routes/payment.route.js:1527,1593,1608` (userId, planId, annonceId dans les logs webhook Payplug).
**Priorité** : **FAIBLE**
**Suggestion** : Envisager le masquage partiel de l'email dans `emailService.js:45` (ex. `j***@domain.com`) et confirmer que le simulateur SMTP ne peut pas s'activer silencieusement en prod si `SMTP_HOST` est mal configuré (cf. point connexe en 2.1).

### 6.5 — `experimental.instrumentationHook` obsolète et non documenté
**Fichier** : `frontend/next.config.js:15-17`
**Description** : Le build de production affiche le warning `experimental.instrumentationHook is no longer needed, because instrumentation.js is available by default` (confirmé lors du build réel exécuté cette session). Ce point n'est documenté dans aucun `README.md`/`CHANGELOG.md` à la racine (seule mention trouvée : `AUDIT_EXPORT.md:883`, un rapport d'audit antérieur, pas une doc projet).
**Priorité** : **FAIBLE**
**Suggestion** : Supprimer le bloc `experimental: { instrumentationHook: true }` de `next.config.js` (Next.js 15.5 n'en a plus besoin), ce qui supprimera le warning au build.

### 6.6 — Fichiers frontend contenant des octets NUL intercalés dans les commentaires
**Fichiers** : `frontend/src/components/profil/AlertsManager.tsx`, `frontend/src/app/admin/annonces/page.tsx`, `frontend/src/app/admin/signalements/page.tsx`, `frontend/src/app/admin/users/page.tsx`
**Description** : Vérifié directement (`xxd`) — ces fichiers contiennent des séquences d'octets `\x00` intercalées dans des commentaires (ex. `// ␀␀ Page de gestion des alertes utilisateur ␀␀␀␀...`), probablement un artefact d'un outil de correction d'encodage antérieur qui a remplacé du texte plus long par un texte plus court sans tronquer le buffer. Le build de production compile ces fichiers sans erreur (les octets NUL restent dans une ligne de commentaire `//`, donc syntaxiquement inoffensifs pour le parseur JS), mais ces fichiers sont détectés comme "binaires" par les outils standards (`grep`, `git diff`), ce qui gêne toute revue de code ou recherche future sur ces fichiers.
**Priorité** : **MOYEN**
**Suggestion** : Ouvrir ces 4 fichiers et supprimer manuellement les octets NUL résiduels dans les commentaires concernés (ne touche pas au code fonctionnel). Vérifier si d'autres fichiers touchés par les mêmes commits historiques de correction de mojibake (`bbc638e`, `9cee715`, `84abab7` selon l'historique git) présentent le même défaut.

---

## AXE 7 — CONFORMITÉ LÉGALE

### 7.1 — Mentions légales incomplètes
Voir 1.1 (CRITIQUE) — champs d'identité juridique non renseignés.

### 7.2 — Politique de confidentialité incomplète sur l'identité juridique
**Fichier** : `frontend/src/app/politique-de-confidentialite/page.tsx:104`
**Description** : Même lacune que 1.1 — "forme juridique et RIDET à renseigner avant publication". Le reste du document (192 lignes) est en revanche substantiel : tableau détaillé des données collectées, finalités, bases légales, durées de conservation, sous-traitants nommés (AWS, Stripe, PayPlug, Twilio, Expo), droits RGPD.
**Priorité** : **CRITIQUE**
**Suggestion** : Compléter le champ d'identité du responsable de traitement avant publication — un registre RGPD sans identité légale du responsable de traitement n'est pas conforme.

### 7.3 — CGV très courtes (61 lignes) pour un document devant couvrir tous les cas de vente
**Fichier** : `frontend/src/app/cgv/page.tsx`
**Description** : Contient une grille tarifaire précise et réelle (Pro mensuel/annuel, boosts, bons plans, badge conducteur vérifié, en XPF) et les moyens de paiement, mais ne semble pas couvrir en détail la procédure de réclamation/médiation, ni les mentions légales de vendeur habituellement attendues dans des CGV complètes.
**Priorité** : **MOYEN**
**Suggestion** : Faire relire par un juriste local (droit commercial NC) avant lancement commercial effectif, en particulier la clause de rétractation et la procédure de médiation de la consommation.

### 7.4 — CGU : absence de tribunal compétent précis
**Fichier** : `frontend/src/app/cgu/page.tsx:142`
**Description** : Mentionne le droit applicable (Nouvelle-Calédonie) mais le contenu détaillé de la clause de juridiction n'a pas pu être confirmé comme complet.
**Priorité** : **FAIBLE**
**Suggestion** : Vérifier avec un juriste que la clause attributive de compétence est complète et opposable.

### 7.5 — Aucun script de tracking tiers implémenté — `CookieManager` n'a rien à bloquer actuellement
**Fichier** : `frontend/src/components/legal/CookieManager.tsx` (178 lignes)
**Description** : Le composant gère correctement une préférence de consentement (`localStorage` + persistance serveur via `rgpdApi.setConsent()`), mais recherche exhaustive dans tout `frontend/src` (gtag, GTM, Hotjar, Clarity, PostHog, Mixpanel, Matomo, Plausible, Facebook Pixel) : **aucune occurrence**. Il n'y a donc actuellement aucun tracking à gater par consentement — le mécanisme de blocage n'a jamais été mis à l'épreuve.
**Priorité** : **FAIBLE** (informatif, pas un défaut en soi)
**Suggestion** : Le jour où un outil d'analytics sera intégré, s'assurer que son chargement est conditionné à `consent.analytics === true` — le composant `CookieManager` est prêt à recevoir cette logique mais elle n'existe pas encore.

### 7.6 — Suppression de compte : fonctionnalité présente et correctement implémentée
**Fichiers** : `frontend/src/app/parametres/page.tsx:448-479` (UI, confirmation par saisie de `SUPPRIMER MON COMPTE`), `frontend/src/lib/api.ts:1279`, `backend/src/routes/rgpd.route.js` (anonymisation + log RGPD)
**Description** : Fonctionnalité conforme à l'Art. 17 RGPD, avec anonymisation sous 30 jours annoncée à l'utilisateur et traçabilité (`rgpd_logs`).
**Priorité** : n/a (conforme) — **aucun problème détecté**

---

## AXE 8 — QUALITÉ ET FONCTIONNALITÉ

### 8.1 — Page catégorie sans état vide dédié
**Fichier** : `frontend/src/app/annonces/categorie/[categorie]/page.tsx:65-96`
**Description** : Affiche un compteur `{stats.nb_annonces}` mais ne rend pas de liste ni de message d'état vide dédié si le nombre est 0 (affiche juste "0 annonce disponible" sans CTA).
**Priorité** : **FAIBLE**
**Suggestion** : Ajouter un message/CTA engageant (ex. lien vers dépôt d'annonce) quand `nb_annonces === 0`, cohérent avec le récent traitement appliqué à `HomeSections.tsx`.

### 8.2 — Formulaires sans bibliothèque de validation détectable
**Fichiers (21)** : `annonces/nouvelle/page.tsx:348`, `fret/page.tsx:536`, `bons-plans/publier/page.tsx:178`, `evenements/publier/page.tsx:193`, `TrocProposalForm.tsx:67`, `ContactForm.tsx:135`, `pro/dashboard/coupons/page.tsx:123`, `pro/dashboard/parametres/page.tsx:363`, `pro/dashboard/publicite/page.tsx:224`, `covoiturage/page.tsx` (×3), `covoiturage/transport/[id]/page.tsx:268`, `appels-offres/AppelsOffresClient.tsx:549`, `avis/[token]/page.tsx:261`, `bons-plans/enseigne/[slug]/page.tsx:213`, `ServiceDirectoryPage.tsx:288`, `BookingButton.tsx:154`, `pro/transport/inscription/page.tsx:156`, `ProPublicClient.tsx:826`, `Header.tsx:392`, `HomeSections.tsx:212`
**Description** : Ces formulaires ont un `onSubmit` géré (pas de soumission native) mais n'importent ni `zod`, ni `yup`, ni `react-hook-form` — validation probablement faite manuellement (attributs HTML `required`, checks inline), non vérifiée systématiquement ligne par ligne.
**Priorité** : **FAIBLE**
**Suggestion** : Pas nécessairement un défaut si la validation manuelle est correcte ; à auditer au cas par cas sur les formulaires les plus critiques (paiement, dépôt d'annonce, pro/dashboard/parametres).

### 8.3 — `error.tsx` / `global-error.tsx` / `not-found.tsx` : pas de fuite de stack trace
**Fichiers** : `frontend/src/app/error.tsx`, `frontend/src/app/global-error.tsx`, `frontend/src/app/not-found.tsx`
**Description** : Vérifié — `error.message`/`error.stack` ne sont jamais rendus dans le JSX, seulement loggués via `console.error` côté client. **Aucun problème détecté.**
**Priorité** : n/a (conforme)

### 8.4 — Balises `<img>` natives sans `width`/`height` (risque de CLS)
**Fichiers** : les 22 fichiers listés en 3.1 (liste identique — mêmes balises `<img>` natives, aucune n'a `width=`/`height=` explicite, dimensionnement uniquement via classes CSS).
**Priorité** : **MOYEN**
**Suggestion** : Voir 3.1 — la migration vers `next/image` avec `width`/`height` résout simultanément ce point et l'optimisation de performance.

### 8.5 — `ListingImage.tsx` : fragilité structurelle si `fill={false}` est un jour passé sans `width`/`height`
**Fichier** : `frontend/src/components/ListingImage.tsx:28,48-61`
**Description** : Le wrapper n'expose pas de prop `width`/`height`, seulement `fill` (`true` par défaut). Aucun appel actuel avec `fill={false}` n'a été trouvé (donc pas de bug actif), mais la prochaine personne qui l'utilisera avec `fill={false}` fera planter le rendu `next/image` (qui exige `width`+`height` si `fill` n'est pas `true`).
**Priorité** : **FAIBLE**
**Suggestion** : Ajouter une contrainte TypeScript (types conditionnels) obligeant `width`+`height` quand `fill` n'est pas passé ou vaut `false`.

---

## RÉSUMÉ

| Priorité | Nombre de points |
|---|---|
| **CRITIQUE** | 8 |
| **MOYEN** | 17 |
| **FAIBLE** | 12 |

**Détail des points CRITIQUES** :
1. Mentions légales incomplètes — identité juridique non renseignée (1.1)
2. `POST/DELETE /api/demo/seed` sans authentification (1.2)
3. Page `/qa` — connexion admin instantanée sans mot de passe saisi, exposée publiquement (1.3)
4. Dépendance `xlsx` avec vulnérabilité sans correctif + 7 autres CVE high (frontend/backend) (1.4)
5. Fuite PII (nom + email acheteur) non authentifiée via `/scan/[token]` (1.5)
6. Bypass OTP en dur `123456` hors `NODE_ENV=production` (1.6)
7. Politique de confidentialité incomplète — identité juridique manquante (7.2)
8. Variables d'environnement critiques (Stripe, PayPlug, Twilio, AWS, Apple, Turnstile) probablement absentes sur le VPS de production, constaté lors du déploiement réel de cette session (6.1)

### Recommandation

**NO-GO** pour un lancement commercial public immédiat.

Les points 1, 4, 6, 7 et 8 du résumé ci-dessus touchent à la fois à la conformité légale obligatoire (mentions légales/RGPD incomplètes — non-négociable avant mise en ligne publique) et à des risques de sécurité concrets (accès admin non protégé, endpoint de reset de données sans authentification, dépendance vulnérable sans correctif traitant des fichiers utilisateurs, fonctionnalités de paiement/SMS/upload potentiellement non fonctionnelles faute de configuration). Ces éléments sont individuellement rapides à corriger (quelques heures à 1-2 jours au total) mais doivent être traités avant l'ouverture au public, en particulier :
- Compléter les mentions légales et la politique de confidentialité (bloquant légalement).
- Vérifier et sécuriser `/qa` et `/api/demo/*` avant la mise en production (`NODE_ENV` strict + exclusion du build prod).
- Confirmer la configuration réelle des variables d'environnement sur le VPS (point 6.1) — sans quoi paiement, SMS et upload S3 risquent d'être cassés dès le premier client.
- Traiter `xlsx` et les autres CVE high avant d'exposer la fonctionnalité d'import de fichiers.

Les points MOYEN (performance, SEO, accessibilité, healthchecks) sont recommandés avant lancement mais ne sont pas bloquants au sens strict — ils peuvent être traités en parallèle ou en tout début de post-lancement s'il y a une contrainte de calendrier forte, à l'exception du point 6.1 qui doit être vérifié avant toute transaction réelle.
