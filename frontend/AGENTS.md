# AGENTS.md — Kalico NC, refonte visuelle v2

Ce fichier est lu automatiquement par Codex. Il fixe les règles de travail pour
la refonte. En cas de conflit, cet ordre fait foi :
1. ce fichier ;
2. `docs/design/METHODE.md` (déroulé d'une page) ;
3. la fiche de la page en cours, `docs/design/specs/NN-*.md` ;
4. `DESIGN.md` (système visuel) ;
5. la maquette `frontend/design/*.dc.html`.

## Périmètre

- Tu travailles sur **une seule fiche à la fois**, celle que l'humain t'indique.
- Tu ne modifies que les fichiers listés dans la section « Fichiers » de la fiche,
  plus ceux que tu crées pour elle. Si un autre fichier doit changer, tu t'arrêtes
  et tu écris une QUESTION dans `docs/design/PROGRESS.md`.
- Tu ne changes ni les routes, ni les signatures d'API, ni le schéma de base de
  données, sauf si la fiche le demande dans « Côté serveur ».
- Tu ne passes jamais à la fiche suivante sans que l'humain te le demande.

## Style

- Couleurs, rayons, ombres, typo : **uniquement** les classes Tailwind du thème
  Kalico (`bg-cream`, `text-ink`, `rounded-card`, `shadow-card`, `font-display`,
  `text-eyebrow`…) ou les variables `var(--color-*)`. Aucun hex en dur dans un
  composant.
- Pas de `style={{…}}` sauf pour une valeur réellement dynamique (largeur d'une
  barre de progression, angle de la balance du trocomètre).
- `accent-strong` (#A94F0A) en fond de bouton, `accent-text` (#9E4E06) en texte
  orange sur crème. `#B85C00`, `bg-white`, `nc-*`, `--coral`, `--ocean` sont interdits.
- Corps de texte ≥ 15 px, champs ≥ 16 px, zones cliquables ≥ 44 px.
- Groupes d'éléments : flex ou grid avec `gap`.

## Données

- **Aucune donnée inventée dans un composant.** Les maquettes contiennent des
  exemples (noms, prix, compteurs) : ce sont des exemples, pas des données.
- Toute donnée vient de `src/lib/data/<domaine>.ts`. En mode démo
  (`NEXT_PUBLIC_DEMO_DATA=true`), ces fonctions renvoient les fixtures de
  `src/demo/fixtures/`. Sinon, elles appellent l'API réelle.
- Les chiffres « vitrine » (nombre de membres, visites…) passent par
  `src/content/placeholders.ts` tant que l'API n'existe pas.
- Détail complet : `docs/design/DONNEES-DEMO.md`.

## Vérifications obligatoires avant de rendre la main

```bash
npm run lint
npx tsc --noEmit
npm run build
node scripts/check-design.mjs --changed
```

Les quatre doivent passer. Sinon tu corriges, ou tu notes le blocage dans
`PROGRESS.md` et tu t'arrêtes.

## Fin de tâche

Tu mets à jour la ligne de la page dans `docs/design/PROGRESS.md` (statut,
fichiers touchés, écarts avec la maquette, questions), puis tu t'arrêtes.
