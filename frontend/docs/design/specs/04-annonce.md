# 04 · Fiche annonce

**Maquette(s)** : `Annonce v2.dc.html` dans `frontend/design/`
**Route** : /annonces/[id]
**DESIGN.md** : §5.3 Fiche

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/annonces/[id]/page.tsx`
- `src/components/reviews/*`
- `src/components/share/*`

## Sections, dans l’ordre
1. Fil d’Ariane
2. Galerie
3. Titre, prix, badges
4. Description et caractéristiques
5. Colonne vendeur (396 px) : contact, badge, avis
6. Annonces similaires

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Annonce — API
- Vendeur et avis — API
- Similaires — API

## États
- Annonce vendue ou expirée : bandeau et contact désactivé
- 404
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Le bouton de contact est le seul bouton primaire visible
