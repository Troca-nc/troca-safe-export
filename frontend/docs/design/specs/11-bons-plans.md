# 11 · Bons plans et événements

**Maquette(s)** : `Bons plans v2.dc.html` dans `frontend/design/`
**Route** : /bons-plans, /evenements
**DESIGN.md** : §5.2 Liste

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/components/bon-plans/*`

## Sections, dans l’ordre
1. Voir la maquette, section par section

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Bons plans et événements — API

## États
- Offre expirée retirée des résultats
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Les dates affichées sont au fuseau Pacific/Noumea
