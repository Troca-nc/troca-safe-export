# 19 · Administration

**Maquette(s)** : `Admin v2.dc.html` dans `frontend/design/`
**Route** : domaine d’administration, racine `/` redirigée vers `/dashboard`
**DESIGN.md** : §5

## Fichiers
L’inventaire a confirmé que les anciennes pages `frontend/src/app/admin/*` sont volontairement neutralisées. La surface opérationnelle protégée est l’application autonome `admin/`. Son utilisation pour cette fiche a été autorisée le 8 octobre 2026.
- `admin/src/app/*`
- `admin/src/components/*`
- `admin/src/lib/formatters.ts`

## Sections, dans l’ordre
1. Barre latérale sombre et en-tête
2. Vue d’ensemble : indicateurs, graphique, répartition, file de modération, RIDET, paiements échoués, état des services, journal
3. Modération : filtres, file, détail, motifs, décisions
4. Membres : indicateurs, filtres, tableau
5. Paiements : indicateurs, transactions, revenus par produit

## Données
Toutes les données passent par le relais serveur `admin/src/lib/load.ts` et les API admin existantes. Aucune valeur ni fixture de la maquette n’est utilisée.

## États
- File vide
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- L’état des services est alimenté par `/api/admin/health/full`.
- Les actions sont écrites dans `admin_logs`, mais aucun endpoint de lecture du journal n’existe encore. Son affichage reste un lot serveur distinct ; aucun journal fictif n’est présenté.

## Critères d’acceptation
- [x] Ressemble à la maquette à 1440 px, section par section
- [x] Aucun débordement à 390 px
- [x] check-design --changed sans erreur
- [x] Aucune valeur de la maquette recopiée dans un composant
- [x] Accès limité aux rôles admin, vérifié côté serveur
