# Rapport pré-vol Kalico — 2026-05-24

## Statut global

🟢 PRÊT POUR LA DÉMO

---

## Résumé

| Catégorie            | ✅ OK | ⚠️ Partiel | ❌ Bloquant |
|----------------------|-------|------------|-------------|
| A. Fonctionnel       | 6     | 0          | 0           |
| B. Sécurité          | 4     | 0          | 0           |
| C. Infrastructure    | 2     | 1          | 0           |
| D. Cohérence données | 1     | 0          | 0           |
| E. UX                | 2     | 0          | 0           |

---

## ⚠️ Non-bloquants (à corriger après démo)

### [DATA-001] Le seed de démonstration n’est pas exécutable dans ce workspace sans base locale
- **Fichier** : `backend/src/scripts/seedDemo.js:12` / `backend/src/services/demoSeedService.js:330`
- **Contexte** : l’environnement de travail courant n’expose ni PostgreSQL, ni Redis, ni Docker, donc `npm run seed:demo` ne peut pas être validé ici.
- **Impact** : la vérification du seed reste à faire dans l’environnement de déploiement, mais cela ne bloque pas le code de la démo lui-même.
- **Correction recommandée** : exécuter le seed dans l’environnement de staging ou de production prévu pour la démo, où les services requis sont disponibles.

---

## ✅ Ce qui fonctionne correctement

- `backend npm test` passe.
- `frontend npm run build --workspaces=false` passe.
- `mobile tsc --noEmit -p tsconfig.json` passe.
- `admin npm run build` passe avec les dépendances du dashboard disponibles dans l’environnement.
- Les pages légales et les routes RGPD sont bien branchées dans le frontend et le backend.
- Le build frontend inclut bien les routes de démo principales, dont Troc, Bons Plans, Locations, Services, Dons et Immobilier.

## Corrections appliquées

| ID       | Statut    | Fix | Commit |
|----------|-----------|-----|--------|
| MOB-001  | ✅ Corrigé | Export `API_ORIGIN` et alignement des écrans mobiles sur les vrais tokens du design system | `d4335f1` |
| MOB-002  | ✅ Corrigé | Exclusion des tests du `tsconfig` mobile et correction des hooks/types Troc | `246de6c` |
| INFRA-001 | ✅ Corrigé | Alignement des routes/admin pages Next 15 et ajout des shims de modules | `a5b1259` |
| DATA-001 | ⏳ Reporté | Seed à valider dans un environnement avec PostgreSQL/Redis/Docker disponibles | — |
