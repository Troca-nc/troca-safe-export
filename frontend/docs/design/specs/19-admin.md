# 19 · Administration

**Maquette(s)** : `Admin v2.dc.html` dans `frontend/design/`
**Route** : /admin
**DESIGN.md** : §5

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/admin/*`
- `src/components/admin/*`

## Sections, dans l’ordre
1. Barre latérale sombre et en-tête
2. Vue d’ensemble : indicateurs, graphique, répartition, file de modération, RIDET, paiements échoués, état des services, journal
3. Modération : filtres, file, détail, motifs, décisions
4. Membres : indicateurs, filtres, tableau
5. Paiements : indicateurs, transactions, revenus par produit

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Toutes les données admin — API admin existante, sinon à créer

## États
- File vide
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Journal d’activité et état des services

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Accès limité aux rôles admin, vérifié côté serveur
