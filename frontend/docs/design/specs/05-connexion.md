# 05 · Connexion

**Maquette(s)** : `Connexion v2.dc.html (onglet Se connecter)` dans `frontend/design/`
**Route** : /connexion, /mot-de-passe-oublie
**DESIGN.md** : §4 Formulaires

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/connexion/page.tsx`
- `src/components/auth/*`

## Sections, dans l’ordre
1. Volet marque sombre (gauche)
2. Formulaire : e-mail, mot de passe avec Afficher, rester connecté, Se connecter, code SMS
3. Lien vers l’inscription
4. Réassurance

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Auth existante — ne pas modifier le flux

## États
- Identifiants incorrects, compte bloqué, envoi en cours
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Aucun changement du flux d’authentification
- [ ] Les animations respectent prefers-reduced-motion
