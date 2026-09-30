# 03 · Liste des annonces

**Maquette(s)** : `Annonces v2.dc.html` dans `frontend/design/`
**Route** : /annonces (+ /immobilier, /troc, /dons, /locations, /services si ces routes filtrent la même liste)
**DESIGN.md** : §5.2 Liste

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/annonces/page.tsx`
- `src/components/annonces/*`
- `src/components/listings/*`
- `ListingCard.tsx`
- `ListingSkeleton.tsx`

## Sections, dans l’ordre
1. Barre de recherche collante avec menu catégories
2. Colonne de filtres (296 px)
3. Résultats : tri, compteur, grille ou liste, carte optionnelle
4. Pagination

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Annonces filtrées — API annonces (paramètres de filtre existants)
- Catégories et communes — existant

## États
- Chargement, aucun résultat avec suggestion d’élargir, erreur
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Les filtres restent dans l’URL
- [ ] Mobile : filtres en tiroir
