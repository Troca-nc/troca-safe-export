# Troca QA Non-Regression Plan

Ce document regroupe la stratégie d'exécution des tests pour les environnements locaux, preview Vercel et production.

## 1. Périmètre des suites

### Smoke
- `tests/smoke/public.smoke.spec.ts`
- `tests/smoke/particulier.smoke.spec.ts`
- `tests/smoke/pro.smoke.spec.ts`

### Visuel
- `tests/visual/home-hero.spec.ts`

### Charge
- `tests/performance/critical-routes.js`

### Paiement
- `tests/e2e/payment.stripe.spec.ts`

## 2. Matrice d'exécution

### Local
Objectif: valider rapidement les parcours critiques avant ouverture d'une PR.

Commandes:
```bash
npm run test:e2e -- --project=smoke
npx playwright test tests/visual/home-hero.spec.ts
```

Critères de sortie:
- 0 échec sur les smoke
- 0 différence screenshot non approuvée
- aucun log console bloquant

### Preview Vercel
Objectif: vérifier le rendu réel de l'application déployée sur une URL externe.

Variables:
- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_BACKEND_URL`
- `PLAYWRIGHT_USE_LOCAL_SERVER=false`

Commandes:
```bash
PLAYWRIGHT_BASE_URL=https://<preview>.vercel.app PLAYWRIGHT_USE_LOCAL_SERVER=false npm run test:e2e -- --project=smoke
PLAYWRIGHT_BASE_URL=https://<preview>.vercel.app PLAYWRIGHT_USE_LOCAL_SERVER=false npx playwright test tests/visual/home-hero.spec.ts
```

Critères de sortie:
- home, annonces, pros et appels d'offres joignables
- hero visuel conforme sur Desktop Chrome, iPhone 13 et Samsung Galaxy S22

### Production
Objectif: exécuter un contrôle final avant promotion ou publication.

Commandes:
```bash
PLAYWRIGHT_BASE_URL=https://<prod-domain> PLAYWRIGHT_USE_LOCAL_SERVER=false npm run test:e2e -- --project=smoke
PLAYWRIGHT_BASE_URL=https://<prod-domain> PLAYWRIGHT_USE_LOCAL_SERVER=false npx playwright test tests/visual/home-hero.spec.ts
```

Critères de sortie:
- pas d'erreur console bloquante
- pas de 404/500 sur les pages publiques majeures
- rendu visuel stable

## 3. Stratégie de sécurité

### Snyk
- Scanner les dépendances à chaque push et pull request.
- Bloquer la PR sur `High` et `Critical`.
- Secrets requis: `SNYK_TOKEN`.

### Règle de branche
- Le workflow `ci.yml` doit être déclaré comme required status check dans GitHub.
- Le déploiement ne doit pas être autorisé si le scan sécurité échoue.

## 4. Stratégie de charge

Le scénario `k6` cible:
- `GET /`
- `GET /pro/dashboard`
- `GET /abonnement`

Paramètres:
- 50 VU simultanés
- durée: 2 minutes
- seuil d'erreur HTTP < 1%
- p95 < 1200 ms

Commande:
```bash
k6 run tests/performance/critical-routes.js
```

## 5. Paiement Stripe

Le test `tests/e2e/payment.stripe.spec.ts` est volontairement opt-in.

Activation:
```bash
STRIPE_E2E_ENABLED=true npx playwright test tests/e2e/payment.stripe.spec.ts --project=pro
```

Variables conseillées:
- `STRIPE_E2E_ENABLED`
- `STRIPE_TEST_KEY`
- `NEXT_PUBLIC_STRIPE_PK`

Note:
- les secrets Stripe ne doivent jamais être committés
- ils doivent être stockés dans GitHub Secrets ou dans l'environnement de déploiement

## 6. Boucle d'auto-correction

Quand une exécution échoue:
1. Lire le rapport Playwright et les traces dans `test-results/`
2. Identifier le composant ou le flux cassé
3. Corriger le code source
4. Rejouer le test ciblé avant de relancer la suite complète

## 7. Ordre recommandé

1. `playwright test --list`
2. smoke public
3. smoke particulier
4. smoke pro
5. visuel hero
6. k6
7. paiement Stripe opt-in
