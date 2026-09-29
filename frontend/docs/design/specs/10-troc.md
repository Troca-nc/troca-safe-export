# 10 · Troc et trocomètre

**Maquette(s)** : `Troc v2.dc.html` dans `frontend/design/`
**Route** : /troc
**DESIGN.md** : §5.2 Liste

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/troc/page.tsx`
- `src/components/troc/* (à créer)`

## Sections, dans l’ordre
1. En-tête et filtres, bascule « compatibles avec mes annonces »
2. Grille des annonces de troc avec « Cherche »
3. Trocomètre (600 px, collant) : balance, verdict, complément, choix de mon annonce, envies du vendeur, actions
4. Cas sans annonce : plateau vide et dépôt guidé

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Annonces de troc — API
- Mes annonces — API
- Proposition d’échange — API à créer

## États
- Aucune annonce à mettre dans la balance
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Endpoint de proposition d’échange (annonce proposée, complément, message)

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] L’angle de la balance est la seule valeur en style en ligne
- [ ] Le calcul d’équilibre est une fonction pure testée (tolérance 10 %)
