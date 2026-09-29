# 17 · Espace Pro

**Maquette(s)** : `Compte Pro v2.dc.html` dans `frontend/design/`
**Route** : /pro/espace (ou la route actuelle du tableau de bord pro)
**DESIGN.md** : §5

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/components/pro/*`
- `src/components/profil/SellerStatsDashboard.tsx`

## Sections, dans l’ordre
1. Tableau de bord : indicateurs, vues et demandes, demandes à traiter, agenda, avis, stock bas
2. Vitrine et stock : aperçu, complétion, tableau articles et services, stock, mise en ligne
3. Modèles de devis : liste, lignes (quantité, unité, PU HT, TGC 0/3/6/11/22 %), acompte, validité, totaux
4. Suivi des devis : quatre colonnes, relance, passage d’étape

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Statistiques, demandes, agenda, avis — API
- Articles et stock — API à créer si absente
- Modèles de devis et devis — API à créer
- Taux de TGC — configuration serveur

## États
- Aucun article, aucun modèle, aucune demande
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Calcul des totaux et de la TGC côté serveur, le client n’affiche qu’une estimation

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Les totaux affichés sont identiques à ceux du PDF généré
