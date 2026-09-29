# 06 · Inscription

**Maquette(s)** : `Inscription v2.dc.html` dans `frontend/design/`
**Route** : /inscription
**DESIGN.md** : §4 Formulaires

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/inscription/page.tsx`
- `src/components/auth/*`
- `src/components/profil/PhoneVerification.tsx`

## Sections, dans l’ordre
1. Volet marque (560 px), texte selon l’étape
2. Stepper : 4 étapes particulier, 5 pro
3. Type de compte (deux cartes)
4. Informations : prénom, nom, commune, mobile +687 ; pro : raison sociale, RIDET, secteur
5. Identifiants : e-mail, mot de passe, jauge, règles, CGU
6. Vérification : code à 6 chiffres, renvoi, e-mail envoyé
7. Offre (pro) : trois formules
8. Bienvenue : badges, trois actions

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Création de compte — API existante
- Vérification SMS — PhoneVerification existant
- Contrôle RIDET — API à créer ou appel au registre (voir Côté serveur)
- Formules Pro — API abonnements

## États
- Chaque bouton Continuer désactivé avec le motif affiché dessous
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Vérification du RIDET : si aucune API n’existe, accepter le format et marquer « en attente de validation » (TODO-LANCEMENT)

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] L’état de l’étape survit à un rechargement
- [ ] Le nombre d’étapes suit le type de compte
