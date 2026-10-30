# 21 · Préférences de notifications

**Maquette** : `Preferences notifications v2.html` dans `frontend/design/` (fichier autonome, s'ouvre dans un navigateur)
**Route** : /parametres/notifications (adapter à la route existante du « centre de notifications »)
**DESIGN.md** : §4 Composants, §5 Espace compte

## Contexte
La page actuelle est en thème sombre : fond marine, carte d'en-tête dégradée, petites cartes imbriquées pour chaque canal. Elle est remplacée par une page crème dans le style du reste du site. Les règles de notification existantes ne changent pas : seuls la présentation et l'organisation de la page changent. Si un canal ou une catégorie de la page actuelle n'apparaît pas ci-dessous, ne pas le supprimer : le signaler en QUESTION.

## Fichiers
Point de départ, à confirmer à l'étape 1 (inventaire). Toute modification hors de cette liste passe par une QUESTION.
- La page et les composants du centre de notifications existant (chercher « notifications » dans `src/app/` et `src/components/`)
- Composants partagés : `Switch`, `Chip`, `SegmentedControl`, `Button`, `Input` dans `src/components/ui/*` (créer ceux qui manquent, voir fiche 00)
- En-tête connecté (fiche 01), à réutiliser tel quel

Composants à créer si absents :
- `NotificationSection` (carte avec titre, description, en-tête de colonnes, lignes)
- `NotificationRow` (libellé, description, interrupteur e-mail, interrupteur push)
- `SettingsNav` (navigation latérale collante avec compteur par section)
- `SaveBar` (barre fixe d'enregistrement)

## Mise en page
- Conteneur centré 1180 px, marges 48 px. Fond `bg-cream`, cartes `bg-cream-surface`, `rounded-card`, `border-sand`, `shadow-card`.
- Deux colonnes : navigation 220 px collante, contenu flexible. Écart 40 px.
- Chaque section : titre `font-display` 32 px, description, bande d'en-tête de colonnes sur `cream-sunken` (« Notification », « E-mail », « Push »), puis une ligne par notification : `grid-template-columns: minmax(0,1fr) 96px 96px`.
- Responsive :
  - ≥ 1024 px : comme la maquette.
  - < 1024 px : la navigation devient une ligne de puces défilante au-dessus du contenu.
  - < 640 px : chaque ligne passe en pile : libellé et description en haut, les deux interrupteurs dessous avec leur libellé « E-mail » et « Push ». La barre d'enregistrement s'empile.
- Barre d'enregistrement : fixe en bas, `bg-cream-surface` à 96 %, flou léger, bordure haute `border-sand`. Le contenu a un espace de 140 px en bas pour ne pas être masqué.

## Sections, dans l'ordre
1. **En-tête de page** : lien « Mon compte », chapeau « Paramètres » (`text-accent-text`), titre « Choisis ce qui t'alerte, et comment. », phrase d'explication, boutons « Tout activer » (secondaire) et « Tout désactiver » (tertiaire).
2. **Navigation** : Messages, Alertes, Mes annonces, Rapports, Bons plans. Chaque entrée affiche « actives/total » de sa section. Dessous, bloc sombre `ink-deep` : nombre de notifications activées sur le total.
3. **Messages** : Nouveau message (e-mail, push).
4. **Alertes d'offres** : Nouvelle annonce correspondante (e-mail, push).
5. **Mes annonces** : Boost d'annonce, Nouvelle offre, Annonce bientôt expirée (rappel 3 jours avant), Annonce expirée. E-mail seulement.
6. **Rapports de performance** : Récapitulatif (e-mail), Rapport prêt (push). Sous les lignes : fréquence du rapport en contrôle segmenté (Quotidienne, Hebdomadaire, Mensuelle, Arrêtée). Les comptes particuliers n'ont que Hebdomadaire et Arrêtée ; les comptes pro ont les quatre.
7. **Bons plans et promotions** : Nouvelles promotions (e-mail, push). Sous la ligne : catégories favorites (puces à bascule, « Toutes les catégories » quand aucune n'est choisie) et enseignes favorites (champ + bouton Ajouter, puces avec croix pour retirer, message vide « Aucune enseigne enregistrée pour le moment. »).
8. **Confidentialité et désabonnement** : bloc `ink-deep`, texte, lien « Lire la politique », bouton « Retour aux paramètres ».
9. **Barre d'enregistrement** : à gauche un point et le statut, à droite Annuler et « Enregistrer mes préférences ».

## Comportement
- Les interrupteurs et choix modifient un brouillon local. Rien n'est envoyé avant « Enregistrer ».
- Statut de la barre : « Modifications non enregistrées » (point orange) quand le brouillon diffère de l'état enregistré, « Préférences enregistrées » (point vert) juste après un enregistrement, sinon « Tout est à jour ».
- Annuler et Enregistrer sont désactivés (grisés) tant qu'il n'y a pas de modification.
- Annuler remet le brouillon à l'état enregistré.
- Tout activer et Tout désactiver s'appliquent aux interrupteurs seulement, pas aux catégories, enseignes ni à la fréquence.
- Quitter la page avec des modifications non enregistrées : demander confirmation.
- Interrupteur push sans autorisation du navigateur ou de l'appareil : voir États.

## Données
Via `src/lib/data/notifications.ts`, fixtures en mode démo (voir `DONNEES-DEMO.md`). Les états des interrupteurs dans la maquette sont des exemples, pas des réglages par défaut.
- Préférences de l'utilisateur : API existante (lecture et écriture). Structure attendue : par type de notification, un booléen par canal.
- Catégories disponibles : liste des familles de Bons plans existante. La maquette en affiche dix (Alimentation, Mode, Beauté, High-tech, Auto / Moto, Maison, Restauration, Services, Sport, Voyages) : reprendre la liste réelle.
- Enseignes favorites : liste de chaînes par utilisateur.
- Type de compte (particulier ou pro) : session existante, pour les choix de fréquence.
- Valeurs par défaut des interrupteurs à la création d'un compte : à confirmer avec le produit (QUESTION).

## États
- Chargement : squelettes des cartes.
- Erreur de chargement : message et bouton Réessayer.
- Erreur d'enregistrement : la barre passe à « Non enregistré · Réessayer », le brouillon est conservé.
- Push non autorisé : l'interrupteur push est actif mais une ligne d'aide dessous explique « Autorise les notifications dans les réglages de ton appareil ». Ne pas bloquer l'enregistrement.
- Section vide (aucune ligne disponible pour ce compte) : ne pas l'afficher, ni dans la navigation.
- Enseigne déjà ajoutée : ne pas dupliquer, ne pas afficher d'erreur.
- Champ enseigne vide : le bouton Ajouter ne fait rien.

## Côté serveur
Seulement si absent, après validation de l'inventaire.
- Un enregistrement unique de toutes les préférences (pas un appel par interrupteur).
- Les liens de désabonnement des e-mails (« couper la catégorie concernée sans connexion ») doivent pointer vers les mêmes préférences. Vérifier que les clés de catégorie sont identiques.

## Accessibilité
- Chaque interrupteur est un `<button role="switch" aria-checked>` avec un nom explicite (« Nouveau message, e-mail »). Zone cliquable 52 × 44 px, piste visible 42 × 24 px.
- Les puces de catégorie utilisent `aria-pressed`.
- Le statut de la barre d'enregistrement est dans une zone `aria-live="polite"`.
- Piste d'interrupteur désactivée `#CFC0A8` et activée `lagoon-text` : contraste ≥ 3:1 avec le fond de la carte.
- Focus visible partout. Les tirets « non disponible » ont un libellé pour les lecteurs d'écran.

## Critères d'acceptation
- [ ] Ressemble à la maquette à 1440 px, section par section
- [ ] Fond crème partout, aucun mode sombre sur cette page
- [ ] Aucun débordement horizontal à 1024, 768 et 390 px
- [ ] Les boutons de l'en-tête et de la barre ne passent jamais sur deux lignes à 924 px
- [ ] Rien n'est enregistré avant « Enregistrer » ; Annuler restaure l'état enregistré
- [ ] Le compteur « actives/total » de chaque section et celui du bloc sombre se mettent à jour à chaque clic
- [ ] Aucune règle de notification existante supprimée
- [ ] Aucun état d'interrupteur de la maquette recopié comme valeur par défaut
- [ ] `check-design --changed` sans erreur
