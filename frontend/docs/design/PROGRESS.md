# Avancement de la refonte v2

Statuts : `À faire` · `Inventaire` · `En cours` · `À relire` · `Fait` · `Bloqué`.
Codex met à jour sa ligne et la section de sa page à la fin de chaque étape.

| Fiche | Page | Route | Statut | PR |
| --- | --- | --- | --- | --- |
| [00](specs/00-fondations.md) | Fondations : tokens et composants de base | /dev/ui (galerie) | À relire | [#215](https://github.com/Troca-nc/troca-safe-export/pull/215) |
| [01](specs/01-layout.md) | En-tête, pied de page, onglets de compte | toutes | À faire | — |
| [02](specs/02-accueil.md) | Accueil | / | À faire | — |
| [03](specs/03-annonces.md) | Liste des annonces | /annonces | À faire | — |
| [04](specs/04-annonce.md) | Fiche annonce | /annonces/[id] | À faire | — |
| [05](specs/05-connexion.md) | Connexion | /connexion, | À faire | — |
| [06](specs/06-inscription.md) | Inscription | /inscription | À faire | — |
| [07](specs/07-mon-compte.md) | Mon compte : vue d’ensemble | /profil | À faire | — |
| [08](specs/08-compte-particulier.md) | Compte particulier : annonces, coups de cœur, alertes, offres | /profil/annonces, | À faire | — |
| [09](specs/09-deposer.md) | Déposer une annonce | /deposer | À faire | — |
| [10](specs/10-troc.md) | Troc et trocomètre | /troc | À faire | — |
| [11](specs/11-bons-plans.md) | Bons plans et événements | /bons-plans, | À faire | — |
| [12](specs/12-covoiturage.md) | Covoiturage | /covoiturage, | À faire | — |
| [13](specs/13-services.md) | Services : devis, professionnels, envoi | /services | À faire | — |
| [14](specs/14-pros.md) | Annuaire et vitrine des pros | /pros, | À faire | — |
| [15](specs/15-pro-presentation.md) | Présentation de l’offre Pro | /pro | À faire | — |
| [16](specs/16-devenir-pro.md) | Devenir Pro | /devenir-pro | À faire | — |
| [17](specs/17-compte-pro.md) | Espace Pro | /pro/espace | À faire | — |
| [18](specs/18-publicite.md) | Publicité (Kalico Pub) | /publicite | À faire | — |
| [19](specs/19-admin.md) | Administration | /admin | À faire | — |

## Hors site

`Emails prospection pro v2.dc.html` et `Seeding autorisations v2.dc.html` sont des outils internes. Ils ne se codent pas dans le site.

---

## Journal par page

Codex ajoute ici, sous le numéro de la fiche : inventaire, fichiers touchés, critères cochés, écarts, QUESTIONS.

## Installation du paquet Codex v2 — 2026-09-29

Installation seule, aucune fiche commencée. Scripts check:design et check:launch ajoutés ; mode démo local activé dans .env.local ignoré par Git.

Limites de validation du paquet :
- npm run lint : impossible, script lint absent du package.json existant.
- npm run check:design : code de sortie 0 mais zéro fichier inspecté ; le filtre src/ ne couvre pas les chemins frontend/src/ retournés par Git depuis la racine du dépôt. La redirection /dev/null produit aussi un avertissement sous Windows. Ce résultat ne valide donc pas les fichiers ajoutés.

Validation finale : npx tsc --noEmit réussi ; npm run build réussi (104 pages générées), avec NODE_USE_SYSTEM_CA=1 pour les certificats Windows. git diff --cached --check réussi après retrait d'un espace final dans DESIGN.md. Archive et dossier temporaire supprimés. Aucune fiche commencée.

## 00 — Inventaire (étape 1, sans code)

### Base et livraison

Le paquet est au commit 17cef31 sur design/codex-v2-package. Aucune PR de cette branche trouvée lors de l'inventaire. Publier le paquet dans une PR préalable, puis préparer design/00-fondations depuis main après sa fusion. Aucune autorisation de fusion déduite de la demande de travail par PR.

### Fichiers et composants par section

| Section | Existant trouvé | Intervention prévue |
| --- | --- | --- |
| 1. Tokens et thème | src/styles/kalico-tokens.css déjà importé avant globals.css dans src/app/layout.tsx ; tailwind.config.js comporte une première palette v2 et des clés historiques ; docs/design/tailwind.kalico.js contient la cible. | Fusionner le thème et corriger les surcharges dans globals.css ; conserver les clés nécessaires aux pages existantes. Collisions de valeurs sand et lagoon à traiter explicitement, ainsi que les ombres card/modal et les polices. |
| 2. Boutons | Classes .btn* dans globals.css ; aucun Button React générique dans src/components/ui. | Créer Button.tsx avec primary, secondary, tertiary, ghost, compact et chargement ; conserver les classes historiques nécessaires. |
| 3. Champs | Classes de champs dans globals.css et champs directement dans les pages ; pas de primitives Input/Select/Textarea. | Créer Field.tsx, Input.tsx, Select.tsx, Textarea.tsx, FieldGroup.tsx ; labels, aide, erreur, préfixe +687 et suffixe XPF. |
| 4. Contrôles | Aucun composant générique Checkbox/Radio/Switch/FilterChip/SegmentedControl dans ui. | Créer ces primitives avec clavier, focus visible et zone cliquable minimale ; interrupteur visuel 42 × 24 dans une cible accessible. |
| 5. Badges | Classes .badge* historiques ; FeedbackAlert.tsx et ToastCenter.tsx utilisent encore des couleurs anciennes. | Créer Badge.tsx et ProBadge.tsx ; adapter les retours existants aux tokens en préservant leurs interfaces. |
| 6. Cartes | Classes de carte et motif existants ; .on-deep dans les tokens ; pas de Card React générique. | Créer Card.tsx et DeepPanel.tsx ; vérifier les contrastes et le motif tressage. |
| 7. Modale | Modales métier existantes dont src/components/auth/AuthRequiredModal.tsx ; pas de Modal générique dans ui. | Créer Modal.tsx accessible (focus, Échap, retour au déclencheur, défilement) ; ne pas migrer les parcours métier dans cette fiche. |
| 8. Démo et vérification | src/lib/demo.ts, components/demo/DemoRibbon.tsx et Placeholder.tsx, content/placeholders.ts sont livrés. Layout utilise un ancien DemoBanner, piloté par demoMode et NEXT_PUBLIC_SHOW_DEMO_BAR. Scripts check:design/check:launch présents. | Brancher DemoRibbon sur NEXT_PUBLIC_DEMO_DATA sans changer les comptes de démo historiques. Corriger check-design.mjs : chemins frontend/src, séparateurs Windows, fichiers nouveaux et absence de faux succès sur zéro fichier. |

### États et galerie

Créer Skeleton.tsx et réutiliser/adopter les retours de FeedbackAlert.tsx et EmptyStates.tsx pour présenter chargement, vide et erreur. Les contrôles couvriront défaut, survol, focus, désactivation et erreur quand applicable. Créer src/app/dev/ui/page.tsx (métadonnées noindex) et une galerie interactive dédiée dans src/components/ui ; aucune route /dev/ui existante trouvée. Vérification prévue à 1440, 1024, 768 et 390 px, et avec le drapeau démo activé/désactivé.

Le critère « aucun hex dans src/components/ui » implique aussi la remise en tokens des composants existants contenant des hex : FeedbackAlert.tsx, ToastCenter.tsx et PdfViewer.tsx notamment. Les autres composants UI existants (DemoModeSwitcher, EmptyStates, ProfileDemoPreview, SearchAutocomplete, NotificationBell, ThemeToggle, ThemeProvider) seront examinés pour conserver leurs comportements et éviter les anciennes classes dans les fichiers modifiés.

### Données

Aucun besoin serveur ni nouvelle API pour cette fiche. Les composants reçoivent leurs valeurs par props ; la galerie contient uniquement des libellés de démonstration et états interactifs, sans faux utilisateurs, annonces ou statistiques. Le mode démo vient de NEXT_PUBLIC_DEMO_DATA via src/lib/demo.ts. Les chiffres de content/placeholders.ts sont provisoires : les chemins API indiqués y sont des annotations non vérifiées, pas la preuve d'API disponibles ; ne pas les recopier dans la galerie. Aucun fixture métier à créer pour cette fiche.

### QUESTIONS de périmètre avant code

1. Valider l'ajout de src/app/layout.tsx à la liste des fichiers modifiables : indispensable au branchement de DemoRibbon demandé par la section 8.
2. Valider package.json et package-lock.json si nécessaire pour installer/configurer un véritable lint : le script obligatoire npm run lint est absent. Une configuration de lint dédiée sera créée ; ne pas remplacer le lint par un contrôle factice.
3. Confirmer la nouvelle route technique /dev/ui non indexée, explicitement demandée par le critère d'acceptation mais absente de la rubrique Route. Les fichiers seront nouveaux, sans modifier les routes métier.

Décision proposée : valider cet inventaire avec ces extensions, livrer une PR fondations après la PR paquet, puis attendre la relecture avant la fiche 01. Aucun code applicatif modifié ; critères d'acceptation non encore cochés.

## 00 — Livraison des étapes 2 à 7 (2026-09-30)

L'inventaire et ses extensions de périmètre ont été validés par l'humain. Les fondations sont sur `design/00-fondations`, à partir du commit du paquet `17cef31` (PR #214). La PR des fondations vise main pour exécuter les contrôles CI habituels et inclut provisoirement ce prérequis non fusionné. Aucune fusion effectuée ; aucune fiche 01 commencée.

### Résultat

- Données : aucun besoin d'API, aucune fixture métier. Composants typés et valeurs reçues par props.
- Tokens : fusion du thème v2 ; anciennes clés conservées, alias des ombres historiques rétablis. Les valeurs sand/lagoon et les ombres card/modal suivent désormais v2. Les fontes next/font sont reliées aux tokens sans double chargement Google Fonts.
- Primitives : Button, champs Input/Select/Textarea et groupes dans Field.tsx, Checkbox/Radio/Switch/FilterChip/SegmentedControl dans Controls.tsx, Badge/ProBadge, Card/DeepPanel, Modal et Skeleton/LoadingState/ErrorState.
- États : défaut, survol, focus visible, désactivation et erreur selon le composant ; chargement, vide et erreur avec Réessayer dans la galerie.
- Accessibilité : contrôles natifs, labels et messages liés, focus piégé dans la modale dans les deux sens, fermeture par Échap et focus rendu au déclencheur.
- Démo : DemoRibbon branché dans le layout racine ; ancien système de comptes démo conservé.
- Outillage : lint TypeScript/React Hooks/accessibilité sur la bibliothèque UI, les composants démo et la galerie ; vérificateur design portable avec chemins monorepo, chemins courts Windows, nouveaux fichiers et contrôle des lignes ajoutées. Le contrôle des hex couvre tout src/components/ui, y compris les fichiers non modifiés. Cinq tests de non-régression via npm run test:design.
- Corrections des composants existants : couleurs littérales et blanc remplacés par les tokens ; surfaces sombres préservées ; hooks de NotificationBell déplacés avant le retour conditionnel ; focus et typage de SearchAutocomplete corrigés.

### Fichiers touchés

- Configuration : package.json, package-lock.json, eslint.config.mjs, tailwind.config.js.
- Styles et intégration : src/styles/kalico-tokens.css, src/app/globals.css, src/app/layout.tsx, src/components/demo/DemoRibbon.tsx.
- Nouveaux composants UI : Badge.tsx, Button.tsx, Card.tsx, Controls.tsx, Field.tsx, FoundationGallery.tsx, Modal.tsx, Skeleton.tsx.
- UI existante : DemoModeSwitcher.tsx, EmptyStates.tsx, FeedbackAlert.tsx, NotificationBell.tsx, PdfViewer.tsx, ProfileDemoPreview.tsx, SearchAutocomplete.tsx, ToastCenter.tsx.
- Galerie et suivi : src/app/dev/ui/page.tsx, docs/design/PROGRESS.md.
- Vérifications : scripts/check-design.mjs, scripts/check-design.test.mjs.

### Critères d'acceptation

- [x] Primitives comparées aux références Connexion et Direction créative à 1440 px : palette, fontes, champs, boutons, badges et bloc sombre. La galerie n'est pas la refonte de la page Connexion.
- [x] Aucun débordement à 390 px ; vérifié aussi à 768, 1024 et 1440 px dans Chromium.
- [x] check-design --changed : 24 fichiers, zéro erreur et zéro avertissement.
- [x] Aucun exemple de donnée métier des maquettes recopié dans les composants.
- [x] Build réussi avec anciennes et nouvelles clés : 105 pages, dont /dev/ui.
- [x] Aucun hex dans src/components/ui.
- [x] Galerie /dev/ui avec composants et états ; robots noindex, nofollow vérifiés dans le navigateur.
- [x] Mode démo true : bandeau présent ; build avec false : bandeau absent.

### Validation et écarts documentés

npm run lint, npx tsc --noEmit, npm run test:design (5 tests), npm run check:design et git diff --check passent. Build de production réussi avec NEXT_PUBLIC_DEMO_DATA=false et NODE_USE_SYSTEM_CA=1 pour la chaîne de certificats Windows. Le fichier local .env.local reste à true et ignoré par Git.

Le navigateur confirme boutons 48 px, compacts 44 px, champs 50 px bordure comprise, interrupteurs 42 × 24 px, aucun débordement ni erreur JavaScript, survol/focus et navigation clavier fonctionnels. Les captures et rapports sont conservés hors dépôt dans le dossier local kalico-foundations-review.

Choix conformes à la priorité des règles : interrupteur 42 × 24 selon la fiche 00 plutôt que 54 × 30 dans DESIGN.md ; modale rounded-block (24 px) et fermeture cliquable 44 px selon fiche/AGENTS. Les primitives de champs et de sélection sont regroupées dans Field.tsx et Controls.tsx plutôt que réparties en un fichier par export.

Limites : le lint est ciblé sur les fondations, pas encore sur toutes les pages métier. Next.js signale plusieurs lockfiles et l'absence de son plugin ESLint spécifique ; cela n'empêche pas le build. L'en-tête, le pied de page et les pages métier restent à traiter dans leurs fiches. Les anciennes clés de thème sont conservées pour la migration progressive. Aucune question de périmètre restante.
