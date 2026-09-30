# Méthode : une page, sept étapes

Chaque fiche `docs/design/specs/NN-*.md` se traite avec ce déroulé, sans en
sauter une étape. Chaque étape a un résultat vérifiable.

## 0. Préparer

- Branche : `design/NN-nom` depuis `main` à jour.
- Lire, dans cet ordre : la fiche, les sections de `DESIGN.md` qu'elle cite,
  la maquette. La maquette s'ouvre dans un navigateur ; son code est lisible,
  toutes les valeurs de style sont en ligne.
- Dans la maquette, **tout ce qui vient de `renderVals()` est un exemple**.
  La structure, les libellés d'interface et les styles sont la cible.

## 1. Inventaire (aucun code)

Écrire dans `PROGRESS.md`, sous la page :
- les fichiers existants trouvés (`rg` sur la route et les composants cités) ;
- pour chaque section de la fiche : composant existant réutilisé, modifié ou créé ;
- les données nécessaires et leur source actuelle (API existante, à créer, ou démo).

Si un élément de la fiche n'a pas d'équivalent dans le code et demande du
serveur, le noter en QUESTION. Ne pas l'inventer.

## 2. Données

- Types dans `src/types/` (ou à côté du domaine, selon l'existant).
- Fonctions dans `src/lib/data/<domaine>.ts` : une par besoin de la fiche.
- Fixtures dans `src/demo/fixtures/<domaine>.ts`, conformes à
  `DONNEES-DEMO.md`.
- Aucun composant n'importe `src/demo/`.

Résultat : `npx tsc --noEmit` passe.

## 3. Composants

- Construire les sections dans l'ordre de la fiche.
- Réutiliser `src/components/ui/*` et les composants partagés de la fiche 01.
- Uniquement les tokens (voir `AGENTS.md`).

Résultat : la page s'affiche en mode démo et ressemble à la maquette à 1440 px.

## 4. États

Pour chaque section qui charge des données : chargement (squelette),
vide (texte de la fiche), erreur (message + réessayer), non connecté si la page
l'exige. Les textes sont dans la fiche ; s'il en manque un, QUESTION.

## 5. Responsive

Vérifier à 1440, 1024, 768 et 390 px. Règles de bascule : `DESIGN.md` § 3.3.
Aucun débordement horizontal, aucun texte coupé.

## 6. Vérifier

```bash
npm run lint && npx tsc --noEmit && npm run build
node scripts/check-design.mjs --changed
```

Puis comparer côte à côte la page et la maquette, section par section, avec la
liste « Critères d'acceptation » de la fiche. Cocher chaque critère dans
`PROGRESS.md`. Un critère non tenu = un écart noté, avec la raison.

## 7. Rendre la main

- Mettre à jour `PROGRESS.md` : statut `À relire`, fichiers touchés, écarts,
  questions.
- Commit : `design(NN): <page> selon maquette v2`.
- **S'arrêter.** L'humain relit, fusionne, puis demande la fiche suivante.

---

## Prompt à coller dans Codex, pour chaque page

> Applique `docs/design/METHODE.md` à la fiche `docs/design/specs/NN-nom.md`.
> Commence par l'étape 1 et montre-moi l'inventaire avant d'écrire du code.

Puis, après ta validation de l'inventaire :

> L'inventaire est validé. Continue les étapes 2 à 7 et arrête-toi.

**Une nouvelle session Codex par page.** Une session trop longue mélange les
pages et reprend des décisions d'une fiche dans une autre.
