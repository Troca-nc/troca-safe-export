# 15 · Présentation de l’offre Pro

**Maquette(s)** : `Pro v2.dc.html` dans `frontend/design/`
**Route** : /pro
**DESIGN.md** : §5

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/pro/page.tsx`
- `src/components/pro/*`
- `src/components/monetisation/*`

## Sections, dans l’ordre
1. Héros
2. Modules
3. Secteurs
4. Tarifs (mensuel / annuel)
5. Comparatif
6. Appel final

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Tarifs — API abonnements ou configuration
- Chiffres — placeholders.ts

## États
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Les prix viennent d’une seule source, partagée avec Devenir Pro
