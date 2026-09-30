# 07 · Mon compte : vue d’ensemble

**Maquette(s)** : `Mon compte v2.dc.html` dans `frontend/design/`
**Route** : /profil
**DESIGN.md** : §5 Espace compte

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/profil/page.tsx`
- `src/components/profil/*`
- `src/components/PaymentFailureBanner.tsx`
- `PlanBadge.tsx`

## Sections, dans l’ordre
1. Bandeau : avatar, salutation, badges, onglets de compte
2. Alerte contextuelle (paiement, profil incomplet)
3. Quatre indicateurs
4. Mes annonces (4 dernières)
5. Conversations récentes et rendez-vous
6. Bloc sécurité (sombre)
7. Colonne : complétion, abonnement, vues 14 jours, activité, accès rapides

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Profil, annonces, messages, rendez-vous, abonnement, notifications — API existantes

## États
- Variantes particulier, pro, abonnement actif / expire bientôt / paiement échoué
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Aucun.

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Les trois variantes d’abonnement sont testables en démo
- [ ] Une seule alerte à la fois, la plus urgente
