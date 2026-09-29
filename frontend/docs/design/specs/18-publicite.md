# 18 · Publicité (Kalico Pub)

**Maquette(s)** : `Publicité v2.dc.html` dans `frontend/design/`
**Route** : /publicite
**DESIGN.md** : §5

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/publicite/page.tsx (à créer)`
- `src/components/monetisation/*`

## Sections, dans l’ordre
1. Héros et audience
2. Cinq formats avec schéma d’emplacement
3. Studio : contenu, ciblage, durée ; aperçu ordinateur / mobile ; projection
4. Exemple de rapport
5. Points de contact dans l’espace Pro
6. Accompagnement : rappel

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Audience — placeholders.ts
- Tarifs des formats — configuration serveur
- Estimations d’audience — API à créer
- Exemple de rapport — fixture explicitement présentée comme exemple

## États
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Tant que l’estimation n’existe pas côté serveur, afficher des fourchettes libellées « estimation indicative »

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Le rapport d’exemple porte la mention « Exemple » visible, même hors mode démo
