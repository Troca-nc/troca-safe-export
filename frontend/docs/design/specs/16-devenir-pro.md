# 16 · Devenir Pro

**Maquette(s)** : `Devenir Pro v2.dc.html` dans `frontend/design/`
**Route** : /devenir-pro
**DESIGN.md** : §4 Formulaires

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/devenir-pro/page.tsx (à créer)`
- `src/components/monetisation/*`

## Sections, dans l’ordre
1. En-tête : ce qui est conservé
2. 1. Entreprise : RIDET avec résultat, secteur, téléphone, zones
3. 2. Vitrine : logo, nom, adresse kalico.nc/pros/…, présentation
4. 3. Formule : mensuel / annuel, trois formules
5. 4. Paiement : carte, prélèvement, virement (annuel)
6. Récapitulatif collant et suite

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Profil actuel — API
- Contrôle RIDET — voir fiche 06
- Formules et paiement — API abonnements

## États
- RIDET trouvé, introuvable, vide
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Passage d’un compte particulier à pro sans perte (annonces, avis, messages)

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] « À payer aujourd’hui » vaut 0 F pendant la période offerte
