# 00 · Fondations : tokens et composants de base

**Maquette(s)** : `Connexion v2.dc.html (champs, boutons)`, `Direction créative.dc.html (palette, typo)` dans `frontend/design/`
**Route** : aucune
**DESIGN.md** : §1 Couleurs, §2 Typographie, §4 Composants

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/globals.css`
- `tailwind.config.js`
- `src/styles/kalico-tokens.css`
- `src/components/ui/*`
- `src/lib/demo.ts`
- `src/components/demo/*`
- `src/content/placeholders.ts`
- `scripts/check-design.mjs`

## Sections, dans l’ordre
1. Installer les tokens (livraison/kalico-tokens.css) et fusionner livraison/tailwind.kalico.js, anciennes clés conservées pour que le build reste vert
2. Boutons : primary (accent-strong), secondary (bordure ink), tertiary (cream-sunken), ghost ; hauteur 48 px (44 px compact), rayon control
3. Champs : input, select, textarea, groupe avec préfixe (+687) ou suffixe (XPF) ; hauteur 50 px, rayon field, focus anneau ink/10
4. Case à cocher, radio, interrupteur (42 × 24), puce de filtre (pill), contrôle segmenté
5. Badges : statut (succès, info, avertissement, erreur, neutre), badge Pro vérifié
6. Carte (surface, bordure sand, shadow-card, rounded-card) et bloc sombre (.on-deep + motif tressage)
7. Modale : fond ink-deep/62, carte rounded-block, shadow-modal
8. Mode démo : DemoRibbon dans le layout racine, Placeholder, placeholders.ts, script npm "check:design"

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Aucun.

## États
- Chaque composant a ses états : défaut, survol, focus visible, désactivé, erreur
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Le build passe avec les anciennes et les nouvelles clés
- [ ] Aucun hex en dur dans src/components/ui
- [ ] Une page /dev/ui (non indexée) montre tous les composants et leurs états
- [ ] NEXT_PUBLIC_DEMO_DATA=true affiche le bandeau démo, false le masque
