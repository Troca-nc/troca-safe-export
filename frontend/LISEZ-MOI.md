# Kalico v2 · paquet Codex : installation

Le contenu de ce dossier se copie **à la racine de `frontend/`**, en respectant
l'arborescence. Rien n'écrase ton code, à l'exception de `src/styles/kalico-tokens.css`
s'il existe déjà.

```
frontend/
├── AGENTS.md                      ← règles, lues automatiquement par Codex
├── DESIGN.md                      ← système visuel
├── design/                        ← maquettes (s'ouvrent dans un navigateur)
├── docs/design/
│   ├── METHODE.md                 ← déroulé d'une page en 7 étapes
│   ├── DONNEES-DEMO.md            ← règles des données de démonstration
│   ├── PROGRESS.md                ← suivi, tenu par Codex
│   ├── tailwind.kalico.js         ← thème à fusionner (fiche 00)
│   └── specs/00-…19-*.md          ← une fiche par page
├── scripts/check-design.mjs       ← contrôles automatiques
└── src/
    ├── styles/kalico-tokens.css
    ├── lib/demo.ts
    ├── content/placeholders.ts
    └── components/demo/           ← DemoRibbon, Placeholder
```

## Mise en route

1. Copier le dossier, puis commit : `design: paquet Codex v2`.
2. Dans `package.json`, ajouter :
   `"check:design": "node scripts/check-design.mjs --changed"` et
   `"check:launch": "node scripts/check-design.mjs --launch"`.
3. Dans `.env.local` : `NEXT_PUBLIC_DEMO_DATA=true`.
4. Ouvrir Codex sur `frontend/`, **nouvelle session**, et coller :

   > Applique `docs/design/METHODE.md` à la fiche `docs/design/specs/00-fondations.md`.
   > Commence par l'étape 1 et montre-moi l'inventaire avant d'écrire du code.

5. Relire l'inventaire, répondre aux questions, puis :

   > L'inventaire est validé. Continue les étapes 2 à 7 et arrête-toi.

6. Relire la PR, fusionner, **nouvelle session**, fiche suivante.

## Ordre

00 fondations → 01 en-tête et pied de page → 02 à 19 dans l'ordre des numéros.
Les fiches 00 et 01 sont obligatoires avant les autres.

## Au lancement

1. `NEXT_PUBLIC_DEMO_DATA=false` en production.
2. Remplacer chaque chiffre de `src/content/placeholders.ts` et passer
   `provisional` à `false`.
3. `npm run check:launch` doit passer.
