# 09 · Déposer une annonce

**Maquette(s)** : `Déposer une annonce v2.dc.html` dans `frontend/design/`
**Route** : /deposer
**DESIGN.md** : §4 Formulaires

## Fichiers
Point de départ, à confirmer à l’étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- `src/app/deposer/page.tsx`
- `src/components/listings/PublishWizard*`

## Sections, dans l’ordre
1. En-tête réduit
2. Rail d’étapes et progression
3. Choix du type : vente, troc, bon plan, covoiturage, événement
4. Étapes propres à chaque type (voir la maquette, objet TYPES du script)
5. Publication : récapitulatif, options de visibilité, certification
6. Confirmation
7. Aperçu en direct et conseil par étape

## Données
Toutes via `src/lib/data/`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les valeurs de la maquette sont des exemples.
- Création d’annonce par type — API existante
- Options payantes — API monétisation
- Prix conseillé covoiturage — calcul côté serveur ou client, à confirmer

## États
- Brouillon enregistré à chaque étape
- Champ requis manquant : liste sous le bouton
- Chargement : squelettes aux dimensions finales
- Erreur : message et bouton Réessayer

## Côté serveur
- Les champs propres au troc (valeur estimée, catégories recherchées, complément max) doivent exister dans le modèle

## Critères d’acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Aucun débordement à 390 px
- [ ] check-design --changed sans erreur
- [ ] Aucune valeur de la maquette recopiée dans un composant
- [ ] Les champs de chaque type viennent d’une configuration, pas de cinq formulaires copiés
- [ ] L’aperçu utilise le vrai ListingCard
