# 01 · En-tête, pied de page, onglets de compte

**Maquette(s)** : `Accueil v2.dc.html (en-tête déconnecté, pied de page complet)`, `Mon compte v2.dc.html (en-tête connecté, onglets de compte)`, `Déposer une annonce v2.dc.html (en-tête réduit)`, `Compte Pro v2.dc.html (en-tête Espace Pro)`, `Troc v2.dc.html (pied de page court)` dans `frontend/design/`
**Route** : toutes
**DESIGN.md** : §5 Patterns de page

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/AccountTabs.tsx (à créer)`

## Sections, dans l’ordre
1. En-tête déconnecté : logo + nom, recherche, navigation, Se connecter, Déposer
2. En-tête connecté : favoris, messages (compteur), notifications (point), menu compte (initiales + prénom), Déposer
3. Variante réduite (dépôt d’annonce) : logo, titre de l’étape, « Brouillon enregistré », Quitter
4. Variante Pro : pastille « Espace Pro », nom de l’entreprise
5. Pied de page complet (4 colonnes) et court (une ligne)
6. Onglets de compte : soulignement accent-strong sur l’onglet actif, compteur optionnel

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Utilisateur connecté (prénom, initiales, type de compte) — session existante
- Compteurs messages et notifications — API existante ou à créer

## États
- Non connecté, connecté particulier, connecté pro
- Mobile : menu en tiroir, recherche en pleine largeur sous la barre
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Un seul en-tête paramétrable, pas quatre composants copiés
- [ ] Le compteur de messages disparaît à 0
- [ ] Navigation clavier complète, focus visible
