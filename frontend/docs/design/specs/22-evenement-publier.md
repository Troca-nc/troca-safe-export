# 22 · Publier un événement

**Maquette** : `Publier un evenement v2.html` dans `frontend/design/` (fichier autonome, s'ouvre dans un navigateur)
**Route** : /evenements/publier (adapter à la route existante du formulaire « Publier un événement avec billets »)
**DESIGN.md** : §4 Formulaires, §5 Patterns de page

## Contexte
La page actuelle a un bandeau en dégradé sombre, des champs sur fond beige sans hiérarchie et une longue colonne de champs. Elle est remplacée par un formulaire en 4 blocs numérotés sur fond crème, avec un aperçu en direct. La logique existante (création d'événement, billetterie native, QR code, scan) est conservée : seuls la présentation et l'organisation de la page changent. Si un champ ou une fonction de la page actuelle n'apparaît pas ci-dessous, ne pas le supprimer : le signaler en QUESTION.

Écart connu avec la page actuelle : la maquette remplace le champ « Image de couverture (URL) » par un dépôt de photo. Si l'API n'accepte que des URL, garder l'URL en champ secondaire (QUESTION).

## Fichiers
Point de départ, à confirmer à l'étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- La page et les composants du formulaire d'événement existant (chercher « événement » et « billetterie » dans `src/app/` et `src/components/`)
- Composants partagés de `src/components/ui/*` : `Input`, `Select`, `Textarea`, `Chip`, `Switch`, `Button`, `Card` (créer ceux qui manquent, voir fiche 00)
- En-tête connecté (fiche 01), à réutiliser tel quel
- Aperçu : réutiliser la carte d'événement de la liste Bons plans / événements (fiche 11) plutôt que d'en créer une seconde

Composants à créer si absents :
- `EventFormSection` (carte numérotée : pastille, titre, contenu)
- `TicketTypeCard` (un type de billet, liseré orange à gauche)
- `EventPreviewCard`
- `PublishChecklist`
- `PublishPanel` (bloc sombre : statut + actions)

## Mise en page
- Conteneur centré 1240 px, marges 48 px. Fond `bg-cream`, cartes `bg-cream-surface`, `rounded-card`, `border-sand`, `shadow-card`.
- En-tête de page : lien « Retour au calendrier », chapeau « Événement · Billetterie intégrée » (`text-accent-text`), titre « Publie ton événement. » en `font-display` 60 px, phrase d'explication, et à droite « N sur 5 blocs prêts » avec un point orange.
- Deux colonnes en flex avec retour à la ligne : formulaire `flex: 1 1 560px; min-width: 0`, colonne latérale `flex: 0 1 400px; min-width: 300px`, écart 40 px. La colonne latérale est collante (`sticky top-6`) quand elle est à droite.
- Responsive :
  - ≥ 1100 px : deux colonnes.
  - < 1000 px : l'aperçu et la checklist passent sous le formulaire, non collants.
  - Les grilles de champs utilisent `repeat(auto-fit, minmax(…, 1fr))` : date, début, fin à 160 px mini ; lieu/commune et organisateur à 220 px mini ; nom, prix, places d'un billet à 150 px mini.
  - < 640 px : marges 20 px, titre 40 px, boutons du bloc final empilés en pleine largeur.
- Champs : hauteur 52 px (48 px dans un billet), texte 17 px, bordure `#CFC0A8`, fond `cream`, focus bordure `ink` + anneau `ink/10`.

## Sections, dans l'ordre
1. **L'événement** : titre ; catégorie en puces à choix unique (Concert, Marché, Sport, Spectacle, Atelier, Fête, Vide-grenier, Autre) ; description (4 lignes, redimensionnable) ; photo de couverture facultative (zone de dépôt 200 px de haut, bordure pointillée).
2. **Quand et où** : date, début, fin ; lieu, commune (liste) ; adresse facultative.
3. **Billetterie** : interrupteur « Billetterie activée » / « Sans billetterie » avec phrase d'aide qui change. Activée : une `TicketTypeCard` par type (nom, prix XPF, places, description facultative, « Retirer » dès qu'il y en a plus d'un), bouton pointillé « + Ajouter un type de billet », bande récapitulative « Capacité totale N places » et rappel du QR code unique par billet. Désactivée : le bloc se réduit à l'interrupteur et à sa phrase.
4. **L'organisateur** : nom, site web (facultatif), e-mail de contact, téléphone (facultatif). Phrase de rassurance : les visiteurs passent par la messagerie, e-mail et téléphone ne sont pas affichés.
5. **Bloc final** (`ink-deep`) : « Prêt à publier ? » et message d'état, boutons « Enregistrer le brouillon » (secondaire sur fond sombre) et « Publier l'événement » (aplat `accent`, texte `ink-deep`, désactivé tant que tout n'est pas prêt).
6. **Colonne latérale** : aperçu en direct, checklist « Avant de publier », encart pointillé « Un doute ? » (publier d'abord un événement gratuit pour tester).

## Comportement
- L'aperçu se met à jour à chaque frappe. Valeurs vides : « Titre de l'événement » (atténué), « La description apparaîtra ici. », « Date à définir », « Lieu à définir », vignette de date « date / – », catégorie « Catégorie ».
- Aperçu, prix : « Entrée libre » sans billetterie ; « Gratuit » si tous les billets sont à 0 ; le prix unique si un seul prix ; sinon « Dès X XPF » avec le plus bas. Bouton de l'aperçu : « Réserver » avec billetterie, « Voir » sans.
- Date de l'aperçu : « vendredi 14 nov. à 19 h – 22 h » (jour de semaine en toutes lettres, mois abrégé, heures sans « :00 » inutile).
- Checklist, 5 points, cochés automatiquement : titre et catégorie ; date et heure de début ; lieu et commune ; billets (nom et au moins 1 place, ou billetterie désactivée) ; organisateur et e-mail valide.
- Le message du bloc final : « Tout est renseigné. Ton événement sera visible dès la publication. » ou « Il reste N bloc(s) à compléter. Vérifie la liste à droite. ».
- « Publier » est inactif tant que les 5 points ne sont pas cochés. Ne pas masquer la raison : la checklist la montre.
- Brouillon : enregistre sans validation, l'événement n'est pas visible publiquement.
- Quitter la page avec des modifications non enregistrées : demander confirmation.
- Nom, prix et places : prix entier ≥ 0, places entier ≥ 1.

## Données
Via `src/lib/data/events.ts`, fixtures en mode démo (voir `DONNEES-DEMO.md`).
- Création, mise à jour et brouillon d'événement : API existante.
- Billets : modèle existant de billetterie native.
- Catégories d'événement et communes : listes existantes. Les huit catégories et huit communes de la maquette sont des exemples : reprendre les vraies listes.
- Organisateur : préremplir nom, e-mail et téléphone depuis le profil de l'utilisateur connecté.
- Aucune valeur de la maquette (titre, lieu, prix, 100 places, « Standard ») n'est une valeur par défaut. Défaut d'un billet neuf : nom vide, prix 0, places 50 ; le premier billet est créé avec le nom « Standard », prix 0, places 100 seulement si le produit le confirme (QUESTION).

## États
- Chargement du brouillon : squelettes des cartes.
- Erreur d'enregistrement ou de publication : message sous le bloc final, saisie conservée, bouton Réessayer.
- Erreur de champ : texte rouge `danger-text` sous le champ, bordure `danger`, jamais seulement la couleur. Focus sur le premier champ en erreur.
- Photo trop lourde ou format refusé : message sous la zone de dépôt.
- Compte non connecté : redirection vers la connexion avec retour sur cette page.
- Compte sans vérification requise pour publier : voir règles existantes, ne pas les modifier.
- Publication réussie : redirection vers la fiche de l'événement avec un message de confirmation.

## Côté serveur
Seulement si absent, après validation de l'inventaire.
- Téléversement de la photo de couverture si l'API n'accepte que des URL.
- Statut « brouillon » d'un événement, sans visibilité publique.
- Validation serveur des mêmes règles que la checklist.

## Accessibilité
- Chaque champ a un `<label>` visible. Les mentions « facultatif » sont dans le libellé.
- Les puces de catégorie sont un groupe avec `aria-pressed` ; l'interrupteur de billetterie est un `role="switch" aria-checked`.
- Le compteur « N sur 5 blocs prêts » et la checklist sont dans une zone `aria-live="polite"`.
- Zones cliquables d'au moins 44 px, y compris « Retirer » et les puces.
- Focus visible partout. Les pastilles numérotées 1 à 4 sont décoratives (`aria-hidden`) ; les titres `h2` portent le sens.

## Critères d'acceptation
- [ ] Ressemble à la maquette à 1440 px, bloc par bloc
- [ ] Aucun débordement horizontal à 1024, 768 et 390 px ; l'aperçu passe sous le formulaire sous 1000 px
- [ ] Les champs d'un billet ne sont jamais écrasés ni coupés à 924 px
- [ ] L'aperçu suit chaque frappe, avec les textes de remplacement quand un champ est vide
- [ ] La checklist et le compteur « N sur 5 » restent cohérents avec le formulaire
- [ ] « Publier » est inactif tant que la checklist n'est pas complète
- [ ] Aucune fonction de l'ancienne page supprimée sans QUESTION
- [ ] Aucune valeur de la maquette recopiée comme valeur par défaut
- [ ] `check-design --changed` sans erreur
