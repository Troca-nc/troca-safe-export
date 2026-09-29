# 02 · Accueil

**Maquette(s)** : `Accueil v2.dc.html` dans `frontend/design/`
**Route** : /
**DESIGN.md** : §5.1 Accueil

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/page.tsx`
- `src/components/home/*`
- `src/components/PlatformStats.tsx`

## Sections, dans l’ordre
1. Héros : chapeau, titre, recherche principale, catégories rapides, colonne de droite
2. Bandeau des communes
3. Catégories
4. Dernières annonces (grille de cartes)
5. Bloc confiance (sombre)
6. Pros mis en avant
7. Bloc alertes
8. Pied de page

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Annonces récentes — API annonces
- Pros mis en avant — API pros
- Compteurs de la plateforme — placeholders.ts (membres, annoncesEnLigne)
- Communes — liste statique existante

## États
- Grille : squelette 8 cartes, vide « Aucune annonce pour l’instant »
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Les compteurs passent par <Placeholder>
- [ ] ListingCard est le composant partagé, pas une copie
