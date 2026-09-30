# 13 · Services : devis, professionnels, envoi

**Maquette(s)** : `Services v2.dc.html` dans `frontend/design/`
**Route** : /services (onglets : ?onglet=devis|pros|envoi, ou sous-routes)
**DESIGN.md** : §5

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/services/*`
- `src/components/services/*`
- `src/components/transport/*`

## Sections, dans l’ordre
1. En-tête et trois onglets
2. Devis : métier, description, photos, commune, nombre de devis, délai, budget ; récapitulatif ; devis reçus comparés
3. Professionnels : recherche, filtres métier, vérifié, réponse rapide, tri, cartes
4. Envoi : départ, arrivée, taille, solutions, membres qui font le trajet, récapitulatif, suivi de colis

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Demandes et devis reçus — API devis
- Pros — API pros
- Solutions et tarifs d’envoi — API à créer

## États
- Aucun pro dans la zone
- Même commune de départ et d’arrivée
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Grille tarifaire d’envoi : si absente, afficher « Tarif sur demande » au lieu de montants inventés

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Aucun prix d’envoi calculé côté client sans source serveur
