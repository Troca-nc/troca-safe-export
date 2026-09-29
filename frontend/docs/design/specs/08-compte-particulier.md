# 08 · Compte particulier : annonces, coups de cœur, alertes, offres

**Maquette(s)** : `Compte particulier v2.dc.html` dans `frontend/design/`
**Route** : /profil/annonces, /profil/favoris, /profil/alertes, /profil/offres (réutiliser /favoris et /alertes si elles existent)
**DESIGN.md** : §5 Espace compte

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/profil/*`
- `src/components/profil/AlertsManager.tsx`
- `src/components/profil/SellerStatsDashboard.tsx`

## Sections, dans l’ordre
1. Mes annonces : filtres de statut, cartes avec statistiques, expiration, actions, conseil
2. Emplacements utilisés (5 max en gratuit)
3. Coups de cœur : collections, masquer vendus, grille, baisse de prix
4. Alertes : activation, fréquence, canal, résultats récents
5. Offres reçues : offre de prix ou troc avec balance, accepter / contre-proposer / refuser

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Mes annonces et leurs statistiques — API
- Favoris — API
- Alertes et leurs résultats — API AlertsManager
- Offres et propositions de troc — API à créer

## États
- Vide par onglet, avec l’action qui remplit l’onglet
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Offres de prix et propositions de troc : modèle et endpoints à créer si absents

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Chaque onglet a sa route
- [ ] Les actions ont un retour visible immédiat
