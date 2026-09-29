# 12 · Covoiturage

**Maquette(s)** : `Covoiturage v2.dc.html` dans `frontend/design/`
**Route** : /covoiturage, /fret
**DESIGN.md** : §5.2 Liste

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/components/covoiturage/*`
- `src/components/transport/*`

## Sections, dans l’ordre
1. Héros et recherche de trajet
2. Onglets collants
3. Contenu de chaque onglet (voir la maquette)

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Trajets — API

## États
- Aucun trajet : proposer de créer une alerte
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Les heures au format 7 h 30
