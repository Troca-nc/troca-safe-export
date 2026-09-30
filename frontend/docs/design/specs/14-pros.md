# 14 · Annuaire et vitrine des pros

**Maquette(s)** : `Pros côté client v2.dc.html` dans `frontend/design/`
**Route** : /pros, /pros/[slug]
**DESIGN.md** : §5

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/pros/*`
- `src/components/pro/*`
- `src/components/services/*`

## Sections, dans l’ordre
1. Annuaire
2. Vitrine publique
3. Modale demande de devis
4. Modale prise de rendez-vous

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Pros, vitrines, disponibilités — API

## États
- Pro sans avis
- Pro non vérifié
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Les modales se ferment avec Échap et rendent le focus
