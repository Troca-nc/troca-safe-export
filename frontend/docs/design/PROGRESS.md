# Avancement de la refonte v2

Statuts : `À faire` · `Inventaire` · `En cours` · `À relire` · `Fait` · `Bloqué`.
Codex met à jour sa ligne et la section de sa page à la fin de chaque étape.

| Fiche | Page | Route | Statut | PR |
| --- | --- | --- | --- | --- |
| [00](specs/00-fondations.md) | Fondations : tokens et composants de base | /dev/ui (galerie) | Fait (fusionnée) | [#215](https://github.com/Troca-nc/troca-safe-export/pull/215) |
| [01](specs/01-layout.md) | En-tête, pied de page, onglets de compte | toutes | Fait (fusionnée) | [#216](https://github.com/Troca-nc/troca-safe-export/pull/216) |
| [02](specs/02-accueil.md) | Accueil | / | Fait (fusionnée) | [#217](https://github.com/Troca-nc/troca-safe-export/pull/217) |
| [03](specs/03-annonces.md) | Liste des annonces | /annonces | À relire | [#218](https://github.com/Troca-nc/troca-safe-export/pull/218) |
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

## 01 — Inventaire (étape 1, sans code)

### Base et références

Branche `design/01-layout`, créée depuis `origin/main` au commit `504bc7aaecb86b3e09ead45d152ddf9ac26cf0a1`. La fiche 00 est fusionnée par la PR #215 ; son paquet préalable est fusionné par la PR #214. Le worktree `codex-v2-package`, utilisé par la galerie de revue, n'a pas été modifié.

Références lues : `frontend/DESIGN.md` §5 « Patterns de page » et les cinq maquettes citées par la fiche (`Accueil v2`, `Mon compte v2`, `Déposer une annonce v2`, `Compte Pro v2`, `Troc v2`). Les valeurs issues de `renderVals()` restent des exemples et ne seront pas copiées dans les composants.

### Fichiers existants trouvés

- `src/components/layout/Header.tsx` : en-tête unique existant, états connecté/déconnecté, recherche, navigation desktop, tiroir/menu mobile, favoris, messages, menu compte et CTA Déposer. Il contient encore des classes historiques interdites par la refonte et une hauteur fixe de 88 px. Son compteur de messages appelle actuellement `proApi.getDashboard()` et reste donc à zéro pour un compte particulier.
- `src/components/layout/Footer.tsx` : pied de page global rendu par `src/app/layout.tsx`, aujourd'hui en deux colonnes avec newsletter ; aucune variante courte.
- `src/components/ui/NotificationBell.tsx` : liste et actions de notifications existantes ; appelle l'API réelle mais calcule le nombre non lu sur les 20 éléments chargés au lieu d'utiliser le total `unread` renvoyé par le serveur.
- `src/store/authStore.ts` : session existante, hydratation, utilisateur, états connecté/déconnecté et profils de démonstration. Le contrat accepte `prenom`/`nom` et `first_name`/`last_name`; le serveur réel `/api/auth/me` renvoie `prenom`/`nom`. Le rendu devra normaliser ces deux formes sans inventer de nom.
- `src/lib/api.ts` : clients existants `messagesApi`, `notificationsApi` et `proApi`. Il n'existe encore ni `src/lib/data/` ni `src/demo/fixtures/`.
- `src/app/annonces/nouvelle/page.tsx` et `src/hooks/useAutosave.ts` : le dépôt utilise déjà l'autosauvegarde locale et connaît `isDirty`, le brouillon enregistré et son horodatage ; le `Header` y est rendu sans variante ni statut.
- `src/app/pro/dashboard/layout.tsx` : navigation Pro existante, mais aucun `Header` n'est rendu dans ce layout.
- `src/app/profil/page.tsx` : deux onglets locaux (« Annonces », « Avis reçus ») et des liens séparés ; aucun composant partagé `AccountTabs`.
- `src/app/layout.tsx` : rend le footer sur toutes les routes et applique un `padding-top` global de 88 px pour l'en-tête fixe. Ce padding ne peut pas représenter la variante réduite de 72 px.

### Composants par section

| Section | Réutilisation | Intervention prévue après validation |
| --- | --- | --- |
| 1. En-tête déconnecté | Réutiliser `Header.tsx`, le logo, la recherche, les liens et l'ouverture du parcours de connexion existants. | Recomposer la barre selon `Accueil v2`, garder un seul composant paramétrable, utiliser uniquement les tokens v2 et prévoir la recherche pleine largeur sous la barre sur mobile. |
| 2. En-tête connecté | Réutiliser `Header.tsx`, `useAuthStore`, favoris, menu compte et les routes existantes. | Normaliser prénom/initiales, afficher le compteur messages seulement s'il est supérieur à zéro, afficher le point notifications si le total est non nul, et fournir squelettes puis erreur avec Réessayer. |
| 3. Variante dépôt réduite | Réutiliser le même `Header.tsx` et l'état réel de `useAutosave`. | Ajouter une variante 72 px : logo, titre, statut de sauvegarde réel et Quitter. Aucun libellé « Brouillon enregistré » ne sera affiché sans preuve de sauvegarde. |
| 4. Variante Pro | Réutiliser le même `Header.tsx`, la session et `proApi.getById(user.id)`. | Ajouter la pastille « Espace Pro », le nom réel de l'entreprise (avec repli sur prénom/nom) et la navigation prévue par la maquette. Le dashboard doit encore intégrer ce header. |
| 5. Footer complet/court | Modifier `Footer.tsx`; réutiliser logo, liens légaux et ouverture des cookies. | Remplacer le footer actuel par la variante complète à quatre colonnes et une variante courte paramétrable ou déterminée par route. Les libellés métier restent statiques ; aucune statistique de maquette. |
| 6. Onglets de compte | Aucun composant générique ; seulement des implémentations locales dans le profil et le dashboard Pro. | Créer `AccountTabs.tsx`, piloté par props (libellé, href/action, actif, compteur optionnel), soulignement `accent-strong`, défilement horizontal mobile et navigation clavier native. |

Les primitives de la fiche 00 (`Skeleton`, `LoadingState`, `ErrorState`, boutons et badges) peuvent être réutilisées pour les états sans créer de nouvelle primitive UI.

### Données et API vérifiées

| Besoin | Source actuelle vérifiée | Décision d'inventaire |
| --- | --- | --- |
| Session, prénom, initiales, type de compte | `useAuthStore`; `/api/auth/me`; champs réels `prenom`, `nom`, `is_pro`, `account_type`. | Réutiliser la session et normaliser les deux conventions de noms déjà présentes côté frontend. Aucune API à créer. |
| Nom d'entreprise Pro | `GET /api/pros/:id` via `proApi.getById`; réponse avec `pro_company_name` et `display_name`. `/api/auth/me` ne contient pas `pro_company_name`. | Utiliser l'API Pro existante dans la couche données, avec repli réel sur prénom/nom. Aucun changement serveur. |
| Messages non lus | `GET /api/messages/conversations` via `messagesApi.getConversations`; chaque conversation porte `unread_count`, calculé côté serveur sur les messages reçus non lus. | Additionner les `unread_count` dans la couche données pour particuliers et Pros. Ne plus utiliser le dashboard Pro comme source générale. Aucune API à créer. |
| Notifications non lues | `GET /api/users/notifications` via `notificationsApi.getNotifications`; la réponse contient `data` et le total global `unread`, plus les actions de lecture existantes. | Utiliser `response.data.unread` pour le point d'en-tête ; ne pas déduire le total de la page limitée à 20 éléments. Aucune API à créer. |
| État du brouillon | `useAutosave` dans la page de dépôt (`isDirty`, `pendingDraft`, horodatage et `saveNow`). | Passer explicitement le statut au header réduit ; ne pas fabriquer un état sauvegardé. |

Fichiers nouveaux prévus par les règles de données : `src/lib/data/layout.ts`, `src/demo/fixtures/layout.ts` et, si les types ne restent pas locaux au module, `src/types/layout.ts`. Les fixtures utiliseront des identifiants `demo-*`, des noms marqués « (démo) » et des compteurs de démonstration clairement isolés. Aucun composant n'importera directement les fixtures.

### QUESTIONS de périmètre avant code

1. Valider l'ajout de `src/app/layout.tsx` : nécessaire pour remplacer le décalage global fixe de 88 px par une structure compatible avec l'en-tête standard et la variante réduite de 72 px.
2. Valider l'ajout de `src/app/annonces/nouvelle/page.tsx` : nécessaire pour transmettre au header réduit le vrai statut de `useAutosave` et l'action Quitter, au lieu d'afficher un faux « Brouillon enregistré ».
3. Valider l'ajout de `src/app/pro/dashboard/layout.tsx` : nécessaire car le dashboard Pro ne rend actuellement aucun header ; cette intégration permettra la pastille et le nom d'entreprise réels.
4. Décider si `AccountTabs` doit être seulement créé dans cette fiche puis intégré par les fiches 07/17, ou si l'on étend dès maintenant le périmètre à `src/app/profil/page.tsx` et au layout Pro pour remplacer leurs navigations locales.
5. Valider l'ajout de `src/components/ui/NotificationBell.tsx` si son panneau déroulant doit être conservé : il faut alors le brancher sur la couche données et sur le total serveur. Sinon, `Header.tsx` peut rendre un simple lien avec point, strictement conforme à la maquette, et laisser le panneau existant hors périmètre.

Étape 1 uniquement : aucun code applicatif, aucune fixture et aucune API n'ont été créés ; aucun build n'a été lancé. Les étapes 2 à 7 attendent la validation humaine de cet inventaire et de ces extensions.

## 01 — Livraison des étapes 2 à 7 (2026-09-30)

L'inventaire et ses extensions ont été validés : layout racine, page de dépôt, layout Pro, profil, panneau de notifications et nouveaux fichiers de données/fixtures.

### Résultat

- Données : `src/lib/data/layout.ts` normalise la session réelle, additionne les `unread_count` des conversations, utilise le total `unread` des notifications et charge le nom d'entreprise depuis l'API Pro existante. Aucun endpoint serveur ajouté.
- Démo : fixtures isolées dans `src/demo/fixtures/layout.ts`, identifiants `demo-*` pour les notifications, noms marqués « (démo) » et import dynamique uniquement depuis la couche données.
- En-tête : une seule implémentation paramétrable pour les états standard, dépôt réduit et Pro. Recherche desktop/mobile, tiroir mobile, favoris, compteur messages masqué à zéro, point notifications, compte, déconnexion et CTA Déposer utilisent les routes existantes.
- Dépôt : barre 72 px reliée aux clés réelles de `useAutosave`; « Brouillon enregistré » n'apparaît qu'après lecture d'une enveloppe locale horodatée. Les parcours wizard et bon plan sont couverts.
- Pro : le dashboard rend désormais la variante Pro ; le nom d'entreprise vient de `GET /api/pros/:id`, avec repli sur le prénom de session si le profil public n'est pas disponible.
- Notifications : panneau déroulant conservé, total serveur, chargement, vide, erreur avec Réessayer, marquage unitaire/global et mode démo sans appel serveur.
- Footer : quatre colonnes sur les routes standard, variante courte automatique sur `/troc`, liens légaux et gestion des cookies conservés.
- Compte : `AccountTabs` partagé, actif souligné avec `accent-strong`, compteurs optionnels, défilement horizontal et contrôles natifs. Le profil l'utilise immédiatement.
- Layout global : retrait du décalage fixe de 88 px ; les headers sticky occupent désormais leur hauteur réelle, y compris la variante 72 px.

### Fichiers touchés

- Layout partagé : `src/components/layout/Header.tsx`, `HeaderV2.tsx`, `HeaderNotifications.tsx`, `Footer.tsx`, `FooterV2.tsx`, `AccountTabs.tsx`.
- Données : `src/lib/data/layout.ts`, `src/demo/fixtures/layout.ts`, `src/types/layout.ts`.
- Intégrations : `src/app/layout.tsx`, `src/app/annonces/nouvelle/page.tsx`, `src/app/pro/dashboard/layout.tsx`, `src/app/profil/page.tsx`.
- Suivi : `docs/design/PROGRESS.md`.

### Critères d'acceptation

- [x] Ressemble à la maquette à 1440 px : structure, dimensions et tokens relus contre les cinq fichiers HTML, puis contrôlés visuellement sur les variantes déconnectée, connectée, dépôt réduit, Pro et footer court.
- [x] Aucun débordement à 390 px ; vérifié aussi à 768, 1024 et 1440 px dans Chromium, avec captures desktop/mobile.
- [x] `check-design --changed` sans erreur ni avertissement.
- [x] Aucune valeur métier issue de `renderVals()` recopiée dans un composant ; les données de démo sont isolées et signalées.
- [x] Un seul en-tête paramétrable, pas quatre composants copiés.
- [x] Le compteur de messages disparaît à zéro.
- [x] Navigation clavier : contrôles natifs, focus visible mesuré sur les actions du header, panneau de notifications ouvrable et fermeture Échap vérifiée.

### Validation et limites

`npm run lint`, `npx tsc --noEmit`, `npm run test:design` (5 tests), `npm run check:design`, `git diff --check` et le build de production (`NEXT_PUBLIC_DEMO_DATA=false`, 105 pages) passent. Smoke HTTP réussi sur `/`, `/troc`, `/profil`, `/annonces/nouvelle` et `/pro/dashboard`; le footer complet est rendu sur l'accueil et le footer court uniquement sur Troc.

Recette Chromium locale réussie sur le serveur isolé 3101 : 45 contrôles verts, zéro débordement à 1440/1024/768/390 px, hauteurs mesurées de 89 px (standard), 73 px (réduit) et 150 px (mobile avec recherche), variantes connecté/Pro, panneau de notifications, focus visible, menu mobile, footer court et zéro exception JavaScript. Les captures et le rapport sont conservés hors dépôt dans `C:\Users\Léo\Documents\Codex\kalico-layout-review`. Le port 3100 et le worktree `codex-v2-package` n'ont pas été modifiés ; le serveur temporaire 3101 est arrêté après la revue.

Limites : le script lint du dépôt reste ciblé sur les fondations ; une invocation ESLint directe sur les fichiers de cette fiche est ignorée par la configuration actuelle. Le modal de connexion visible sur la page de dépôt et le texte mal encodé déjà présent dans le contenu de `/troc` sont hors du périmètre layout et n'ont pas été modifiés. Aucun changement d'outillage n'a été ajouté hors périmètre.

## 02 — Inventaire (étape 1, sans code)

### Base et références

Branche `design/02-accueil`, créée depuis `origin/main` au commit de fusion de la fiche 01 `9635bb0d0db4edbf2c6561fca4825e27ad54bab4`. Le worktree isolé est `D:\Codex\kalico-worktrees\02-accueil`. La PR #205 avait déjà appliqué une première direction visuelle à l'accueil ; la fiche 02 repart de ce code fusionné au lieu de dupliquer cette refonte.

Références lues : fiche `02-accueil.md`, `DESIGN.md` §5.1, `DONNEES-DEMO.md` et `Accueil v2.dc.html`. Le contrôle direct du navigateur n'est pas exposé dans cette session ; la structure, les styles et `renderVals()` ont été inspectés dans le HTML. La comparaison visuelle rendue reste obligatoire aux étapes 3, 5 et 6.

### Fichiers existants trouvés

- `src/app/page.tsx` ne fait qu'exposer les métadonnées et rendre `HomePage` ; il peut rester un composant serveur.
- `src/components/home/HomePage.tsx` orchestre les sections, mais charge directement `/api/listings` avec `fetch`, utilise des `any`, transforme silencieusement les erreurs en tableau vide et ne distingue pas chargement, vide et erreur.
- `src/components/home/HomeSections.tsx` contient le héros, les communes et les blocs de fin, mais aussi plusieurs anciennes sections non rendues. Le héros remplace la colonne sombre par deux cartes d'annonce dès que l'API répond. Des valeurs de `renderVals()` y sont encore copiées : recherches rapides, pros, exemples d'alertes et textes chiffrés. Il contient aussi des couleurs littérales et des motifs via `style` statique interdits par les règles v2.
- `src/components/home/CategoryGridSection.tsx` reproduit huit catégories de la maquette dans une constante locale au lieu d'utiliser le catalogue existant.
- `src/components/PlatformStats.tsx` appelle l'API `/stats/platform`, utilise encore des classes historiques `nc-*`, masque totalement l'erreur et ne rend pas les compteurs provisoires demandés avec `<Placeholder>`.
- `src/components/listings/ListingCard.tsx` est le composant partagé exigé. Il accepte déjà les champs renvoyés par la recherche publique et exporte ses squelettes ; aucune copie de carte ni modification de ce fichier n'est prévue.
- `src/components/layout/HeaderV2.tsx` et `FooterV2.tsx`, fusionnés par la fiche 01, couvrent déjà l'en-tête et le pied de page cibles. Le footer global est rendu par `src/app/layout.tsx` ; aucune nouvelle implémentation locale n'est nécessaire.
- `src/lib/api.ts` expose déjà `listingsApi.search`, `proApi.list`, `metaApi` et `statsApi`. `src/lib/categoryCatalog.ts` fournit `FALLBACK_CATEGORIES`; `src/shared-copy/geoData.js` contient la liste statique complète des communes.
- `src/content/placeholders.ts` contient déjà `membres` et `annoncesEnLigne`; `src/components/demo/Placeholder.tsx` fournit le signalement provisoire. Il n'existe encore aucun domaine `home` dans `src/lib/data`, `src/demo/fixtures` ou `src/types`.

### Composants par section

| Section | Réutilisation | Intervention prévue après validation |
| --- | --- | --- |
| 1. Héros | `Header`, boutons v2, catalogue de catégories et `<Placeholder>`. | Conserver le texte d'interface et la recherche ; alimenter les raccourcis depuis les catégories réelles. Rendre la colonne sombre de la maquette en permanence et y afficher uniquement `membres`/`annoncesEnLigne` via `<Placeholder>`, sans statistiques de `renderVals()`. Supprimer les couleurs/style statiques. |
| 2. Communes | Catalogue statique `GEO_DATA`. | Fournir les communes via la couche `home`; aucun compteur fictif. Liens vers la recherche existante. |
| 3. Catégories | `FALLBACK_CATEGORIES` et présentation existante. | Rendre huit racines depuis les données ; initiale, libellé et aide dérivée des sous-catégories, pas de constante copiée de la maquette. |
| 4. Dernières annonces | `listingsApi.search`, `ListingCard`, `ListingGridSkeleton`, `ErrorState`. | Remplacer le bloc boost vide par huit annonces récentes, huit squelettes, le vide exact « Aucune annonce pour l'instant » et une erreur avec Réessayer. |
| 5. Confiance | `DeepPanel`/tokens et motif v2. | Transformer les trois cartes claires actuelles en un seul bloc sombre conforme à la maquette. Le contenu reste du texte d'interface, sans compteur ni donnée utilisateur. |
| 6. Pros mis en avant | `proApi.list`, badges et états v2. | Supprimer `LOCAL_PROS`; afficher jusqu'à quatre pros réels/démo, tous vérifiés par le contrat public, avec chargement, vide et erreur. |
| 7. Alertes | Boutons et surfaces v2. | Conserver le CTA et la structure deux colonnes, mais remplacer `HOME_ALERTS` par un aperçu fonctionnel non personnalisé (recherche → correspondance → notification), sans fausses alertes utilisateur. |
| 8. Pied de page | `FooterV2` global de la fiche 01. | Aucune modification ; seulement vérifier l'enchaînement et l'espacement avec la dernière section. |

Les anciens exports inutilisés de `HomeSections.tsx` seront retirés seulement s'ils ne sont référencés nulle part, afin de réduire les chemins morts sans élargir le périmètre.

### Données, types et API vérifiés

| Besoin | Source actuelle vérifiée | Décision d'inventaire |
| --- | --- | --- |
| Annonces récentes | `GET /api/listings` via `listingsApi.search({ limit: 8, sort: 'date' })`; réponse `{ data, nextCursor, pagination }` compatible avec `ListingCard`. | Créer une fonction typée dans `src/lib/data/home.ts`; fixture `demo-*` conforme au type API dans `src/demo/fixtures/home.ts`. |
| Pros mis en avant | `GET /api/pros?limit=4`; la route ne renvoie que les comptes Pro vérifiés, actifs, triés par note, nombre d'annonces puis nom. | Utiliser `proApi.list` dans la même couche ; fixture d'entreprises suffixées « (démo) ». Aucun endpoint à créer. |
| Catégories rapides et grille | `FALLBACK_CATEGORIES`, construit depuis la taxonomie partagée. | Exposer une projection accueil typée depuis `home.ts`; aucune valeur issue de `renderVals()`. |
| Communes | `GEO_DATA` dans `src/shared-copy/geoData.js`. | Aplatir la liste statique dans `home.ts` et en afficher un sous-ensemble stable ; aucun compteur inventé. |
| Compteurs vitrine | `placeholders.membres` et `placeholders.annoncesEnLigne`. | Les rendre exclusivement avec `<Placeholder>` ; ne pas appeler l'API stats pour ces valeurs dans l'accueil. |

Nouveaux fichiers prévus : `src/types/home.ts`, `src/lib/data/home.ts` et `src/demo/fixtures/home.ts`. Aucun composant n'importera directement une fixture. Aucun changement serveur, route, signature d'API ou schéma n'est nécessaire.

### États et responsive à vérifier

- Annonces : huit squelettes aux dimensions de `ListingCard`, vide exact de la fiche, erreur avec Réessayer.
- Pros : quatre squelettes, vide et erreur avec Réessayer ; les autres sections statiques restent toujours rendues.
- Largeurs obligatoires : 1440, 1024, 768 et 390 px. La grille annonces passe de 4 à 2 puis 1 colonne ; les blocs héros/alertes passent en une colonne ; communes et raccourcis restent défilables ou se replient sans texte coupé.
- Comparaison finale section par section avec la maquette, avec contrôle du header/footer partagés et absence de débordement horizontal.

### QUESTIONS avant code

1. Valider l'ajout des trois nouveaux fichiers de domaine `home` (`types`, `lib/data`, `demo/fixtures`) nécessaires aux règles de données de la fiche.
2. Valider le remplacement des trois fausses alertes issues de `renderVals()` par un aperçu purement fonctionnel et non personnalisé en trois étapes, puisque la fiche ne demande aucune API d'alertes sur l'accueil.
3. Valider les libellés d'état manquants dans la fiche pour les pros : vide « Aucun professionnel mis en avant pour l'instant » et erreur « Impossible de charger les professionnels. » ; les annonces gardent le texte vide imposé.

Étape 1 uniquement : aucun code applicatif, type, appel de données ni fixture n'a été créé. Les étapes 2 à 7 attendent la validation humaine de cet inventaire et de ces trois décisions.

## 02 — Livraison des étapes 2 à 7 (2026-10-01)

L'inventaire et ses trois décisions ont été validés : domaine `home` typé, aperçu fonctionnel des alertes et libellés d'états des professionnels. La branche `design/02-accueil` reste dédiée à cette seule fiche ; aucune fiche suivante ni fusion n'a été engagée.

### Résultat

- Données : `src/lib/data/home.ts` projette le catalogue partagé et les communes statiques, puis charge les huit annonces récentes et quatre professionnels depuis les API existantes. Aucun endpoint serveur ajouté.
- Démo : fixtures isolées dans `src/demo/fixtures/home.ts`, identifiants `demo-*`, personnes et entreprises signalées « (démo) », sans coordonnées ni photographies réelles. Les composants n'importent jamais les fixtures directement.
- Héros : composition deux colonnes conforme à la direction v2, recherche et raccourcis alimentés par le catalogue, panneau sombre permanent et compteurs provisoires rendus exclusivement avec `<Placeholder>`.
- Communes et catégories : données partagées, liens vers la recherche existante, aucun compteur ni exemple de `renderVals()` recopié.
- Annonces : huit `ListingCard` partagées, huit squelettes, vide exact « Aucune annonce pour l'instant » et erreur avec Réessayer.
- Confiance et pros : panneau sombre unique ; professionnels vérifiés issus de l'API/démo, quatre squelettes, vide et erreur avec Réessayer.
- Alertes : CTA conservé et exemples de fausses alertes remplacés par un aperçu non personnalisé en trois étapes.
- Nettoyage : les anciens `HomeSections.tsx` et `PlatformStats.tsx`, sans import restant et porteurs de données copiées/styles historiques, ont été retirés. Le footer partagé de la fiche 01 reste inchangé.

### Fichiers touchés

- Accueil : `src/components/home/HomePage.tsx`, `CategoryGridSection.tsx`, nouveaux `HomeSectionsV2.tsx` et `HomePlatformStats.tsx` ; retrait de `HomeSections.tsx` et `src/components/PlatformStats.tsx`.
- Données : nouveaux `src/lib/data/home.ts`, `src/demo/fixtures/home.ts` et `src/types/home.ts`.
- Suivi : `docs/design/PROGRESS.md`.

### Critères d'acceptation

- [x] Composition comparée à la maquette à 1440 px : héros, bande des communes, catégories, annonces, confiance, pros, alertes et footer.
- [x] Aucun débordement horizontal à 390 px ; vérifié aussi à 768, 1024 et 1440 px dans Chromium.
- [x] `check-design --changed` sans erreur ni avertissement.
- [x] Aucune donnée métier issue de `renderVals()` dans les composants ; fixtures isolées et signalées.
- [x] `ListingCard` partagé utilisé pour les huit annonces ; aucune carte d'annonce recopiée.
- [x] Les deux compteurs provisoires sont rendus par `<Placeholder>` et repérés visuellement comme données de démonstration.
- [x] Recherche accessible au clavier avec focus visible ; liens et actions utilisent des contrôles natifs.

### Validation et limites

`npm run lint`, `npx tsc --noEmit`, `npm run test:design` (5 tests), `npm run check:design`, `git diff --check` et le build de production (`NEXT_PUBLIC_DEMO_DATA=false`, 105 pages) passent. Le lint reste volontairement ciblé par la configuration existante sur les fondations/UI ; Next.js signale toujours plusieurs lockfiles et l'absence de son plugin ESLint spécifique.

Recette Chromium locale sur le serveur isolé 3102 : HTTP 200, sections présentes, 8 annonces, 4 pros, 2 compteurs provisoires, aucune valeur `undefined`/`null`, focus visible et zéro débordement aux quatre largeurs. Les captures et le rapport sont conservés hors dépôt dans `C:\Users\Léo\Documents\Codex\kalico-home-review`. La seule erreur console est la requête globale `/favicon.ico` en 404, fichier déjà absent du projet et hors périmètre de cette fiche ; aucune exception JavaScript n'est relevée.

## 03 — Inventaire (étape 1, sans code)

### Base et références

Branche `design/03-annonces`, créée depuis `origin/main` au commit de fusion de la fiche 02 `631021de55c3c3022ead4588e9c0a833305e4bfd`. Le worktree isolé est `D:\Codex\kalico-worktrees\03-annonces`. Aucune branche distante ni PR antérieure intitulée `design(03)` n'a été trouvée.

Références lues : fiche `03-annonces.md`, `DESIGN.md` §3.2–3.4, §4.6 et §5.3 (la fiche cite §5.2, mais le pattern listing est numéroté §5.3), `DONNEES-DEMO.md` et `Annonces v2.dc.html`. Le contrôle intégré du navigateur n'est pas exposé dans cette session ; la structure et `renderVals()` ont été inspectés dans le HTML. La comparaison visuelle rendue reste obligatoire aux étapes 3, 5 et 6.

### Fichiers existants trouvés

- `src/app/annonces/page.tsx` est un composant client monolithique de 1 944 lignes. Il contient recherche, catégories, filtres, requêtes, histogramme, grille, carte, alerte et deux implémentations de sidebar dont `LegacyFilterSidebar`, inutilisée. Il cumule `useInfiniteListings` avec un second `fetch` direct de secours : une erreur peut donc être transformée en liste vide. Il utilise de nombreux `any`, des classes historiques/interdites et un tableau `FALLBACK_PROVINCES` avec des identifiants inventés.
- `src/hooks/useListingFilters.ts` conserve déjà recherche, catégorie, localisation, prix, état, troc, rayon, tri et page dans l'URL. Il accepte les anciens paramètres explicites et sérialise les filtres de localisation dans `r`. Ce fichier est hors liste de la fiche et peut rester inchangé.
- `src/hooks/useInfiniteListings.ts` gère correctement le curseur `nextCursor`, mais appelle `listingsApi` directement au lieu de la couche `src/lib/data/`. La nouvelle page cessera de l'utiliser ; aucune modification hors périmètre n'est nécessaire.
- `src/components/listings/CategoryFeedPage.tsx` duplique 546 lignes de recherche/filtres/grille avec des styles historiques. Il alimente actuellement `/immobilier`, `/dons`, `/locations` et `/services`. Il doit devenir un adaptateur léger du nouveau listing partagé pour que ces quatre routes profitent de la même interface sans modifier leurs pages. `/troc` dispose d'un parcours spécialisé et ne réutilise pas cette liste ; il reste hors périmètre.
- `src/components/listings/ListingCard.tsx` est la carte partagée à conserver. Son contrat est privé au fichier et plusieurs replis masquent des données absentes (`new Date()` et « Vendeur Kalico »). Il contient encore quelques couleurs arbitraires ; la fiche peut le typer avec le domaine listings et le remettre intégralement en tokens sans copier la carte de la maquette.
- `src/components/ListingSkeleton.tsx` existe et est réexporté par `ListingCard`, mais son image est en 16/9 alors que la carte finale est en 4/3. Il sera aligné sur les dimensions réelles et réutilisé pour les chargements initial et suivant.
- `src/components/annonces/AnnoncesMap.tsx` charge Leaflet et OpenStreetMap, mais l'API de liste ne renvoie ni latitude ni longitude des annonces. Les marqueurs actuels reçoivent donc des coordonnées absentes. Le composant contient aussi des styles/couleurs littérales, des ressources externes et une géolocalisation distincte de celle des filtres.
- `src/components/SearchAlertModal.tsx` couvre déjà le bouton « Créer une alerte » et consomme le même type de filtres. Il sera réutilisé sans modification.
- `src/lib/api.ts` expose `listingsApi.search`, `metaApi.getCategories`, `metaApi.getCommunes` et `metaApi.getZones`. Le serveur renvoie `{ data, nextCursor, pagination }` et accepte `q`, catégorie/id, commune/province, prix, état, troc, métadonnées métier, quartier, géolocalisation, rayon, tri, page, limite et curseur.

### Composants par section

| Section | Réutilisation | Intervention prévue après validation |
| --- | --- | --- |
| 1. Barre de recherche collante | `Header`, `useListingFilters`, catalogue des catégories, `SearchAlertModal`. | Créer une barre listing sous le header : menu catégories à deux niveaux sans compteurs fictifs, recherche soumise explicitement, localisation réelle, alerte et contrôles de tri/vue. Les filtres restent dans l'URL. |
| 2. Colonne de filtres | Métadonnées catégories/communes/zones, géolocalisation existante, champs et contrôles v2. | Créer une sidebar 296 px, collante et défilable, avec sections persistées dans `localStorage` : localisation ouverte, prix et état repliés. Afficher les filtres actifs sous forme de puces supprimables. Sur mobile, réutiliser le même contenu dans un tiroir bas avec actions collantes. |
| 3. Résultats | `ListingCard`, API annonces, total réel, `ErrorState`. | Afficher titre, total, périmètre, tri et grille 3/2/1 colonnes. Supprimer la bannière sponsorisée non demandée et le second fetch silencieux. La carte ne sera pas copiée ; la vue cartographique reste conditionnée à des coordonnées réelles. |
| 4. Pagination | Curseur `nextCursor` déjà fourni par l'API. | Remplacer le chargement automatique par une progression et un bouton « Charger plus d'annonces » conformes à la maquette ; conserver les résultats déjà chargés et rendre des squelettes supplémentaires pendant la requête. |

Le nouveau listing partagé sera créé sous `src/components/listings/` puis utilisé par `src/app/annonces/page.tsx` et l'adaptateur `CategoryFeedPage.tsx`. Les quatre routes secondaires conservent leurs fichiers et leurs libellés actuels. Header et footer de la fiche 01 restent inchangés.

### Données, types et API vérifiés

| Besoin | Source actuelle vérifiée | Décision d'inventaire |
| --- | --- | --- |
| Pages d'annonces | `GET /api/listings` via `listingsApi.search`; filtres et curseur gérés dans `backend/src/services/listingsQuery.js`. | Créer `src/lib/data/listings.ts` avec une fonction typée de page et import dynamique des fixtures en mode démo. Ne plus doubler la requête dans le composant. |
| Catégories | `GET /api/categories`; repli statique `FALLBACK_CATEGORIES`; le filtre serveur accepte le slug et ses descendants. | Projeter le catalogue dans la couche listings. Aucun compteur par facette n'existe : ne pas recopier ceux de `renderVals()`. |
| Provinces, communes, zones | `GET /api/communes` et `GET /api/communes/:slug/zones`. | Charger les identifiants réels en production ; fixtures `demo-*` conformes au contrat en mode démo. Retirer `FALLBACK_PROVINCES` inventé du composant. |
| Tri et pagination | Tri `date`, `price_asc`, `price_desc`, `relevance` et curseur opaque `after`; total/pages dans `pagination`. | Conserver les tris supportés. « Plus proches » n'est pas proposé sans coordonnées utilisateur. Calculer la progression depuis le nombre chargé et le total réel. |
| Types de transaction | `troc=true` est supporté ; `transaction` ne couvre que les métadonnées de certaines catégories. Don et locations sont des catégories dédiées. L'API ne sait pas exprimer un filtre générique « Vente seulement ». | Conserver les modes réellement fiables « Annonces » et « Troc » sur `/annonces`; Dons/Locations restent accessibles par catégories et routes dédiées. Aucun compteur de maquette. |
| Carte | La réponse liste contient commune et distance éventuelle, mais aucune latitude/longitude. | Ne pas afficher une fausse carte ni inventer des positions. Aucun changement serveur autorisé par la fiche. |

Nouveaux fichiers prévus : `src/types/listings.ts`, `src/lib/data/listings.ts`, `src/demo/fixtures/listings.ts` et des composants spécialisés sous `src/components/listings/`. Les fixtures porteront des identifiants `demo-*`, des noms « (démo) » et uniquement des visuels neutres. Aucun composant n'importera directement `src/demo/`.

### États et responsive à vérifier

- Chargement initial : neuf squelettes 4/3 aux dimensions finales à 1440 px ; chargement suivant sans masquer les cartes déjà présentes.
- Vide proposé : « Aucune annonce ne correspond à vos critères. » puis « Essayez d'élargir votre recherche ou de retirer un filtre. », avec réinitialisation et dépôt d'annonce.
- Erreur proposée : « Impossible de charger les annonces. » avec bouton Réessayer ; l'erreur ne doit plus être transformée en état vide.
- Métadonnées indisponibles : catégories statiques possibles par slug, mais localisation désactivée avec message explicite plutôt que de faux identifiants.
- Largeurs obligatoires : 1440, 1024, 768 et 390 px. Sidebar visible à partir de `md` selon `DESIGN.md` ; en dessous, tiroir bas plein écran avec focus géré, fermeture Échap et retour au déclencheur. Grille 3 colonnes desktop, 2 tablette, 1 mobile ; aucun débordement ni texte coupé.

### QUESTIONS avant code

1. Valider l'ajout du domaine `listings` (`types`, `lib/data`, `demo/fixtures`) et de composants spécialisés sous `src/components/listings/`, tous autorisés comme nouveaux fichiers par les règles de la fiche.
2. Valider la fidélité aux capacités réelles : conserver seulement « Annonces » et « Troc » dans le sélecteur principal, omettre les filtres « Vendeur & options » et tous les compteurs de facettes, car l'API actuelle ne les fournit pas et la fiche interdit les changements serveur.
3. Valider l'absence de vue carte dans cette fiche : elle est optionnelle dans la spécification et l'API liste ne fournit pas les coordonnées nécessaires. `AnnoncesMap.tsx` restera inchangé et non rendu par le nouveau listing.
4. Valider les textes d'états proposés ci-dessus, absents mot pour mot de la fiche, ainsi que le bouton explicite « Charger plus d'annonces » à la place de l'infinite scroll automatique.

Étape 1 uniquement : aucun code applicatif, type, appel de données ni fixture n'a été créé. Seul ce journal d'inventaire a été modifié. Les étapes 2 à 7 attendent la validation humaine de ces quatre décisions.

## 03 — Livraison des étapes 2 à 7 (2026-10-01)

Les quatre décisions d'inventaire ont été validées : domaine `listings` dédié, interface limitée aux capacités réelles de l'API, absence de fausse carte et états/pagination explicites. La branche `design/03-annonces` reste consacrée à cette seule fiche ; aucune fiche suivante ni fusion n'a été engagée.

### Résultat

- Vue partagée : `/annonces`, `/immobilier`, `/dons`, `/locations` et `/services` utilisent désormais `ListingsPageView`; `CategoryFeedPage` n'est plus qu'un adaptateur léger.
- Données : `src/lib/data/listings.ts` normalise la recherche, les métadonnées de catégories/localisation, les zones et le curseur. Les composants n'appellent plus directement l'API et n'importent jamais les fixtures.
- Démo : douze annonces neutres avec identifiants `demo-*`, noms « (démo) », catégories, provinces, communes et zones isolées dans `src/demo/fixtures/listings.ts`.
- Recherche et navigation : recherche soumise explicitement, menu de catégories à deux niveaux, filtres conservés dans l'URL, modes fiables « Annonces »/« Troc », tri et création d'alerte existante.
- Filtres : colonne collante 296 px sur tablette/bureau, sections persistées dans `localStorage`, localisation réelle, prix, état et puces supprimables. Le même contenu est réutilisé dans un tiroir mobile avec verrouillage du fond, fermeture Échap, boucle de focus et retour au déclencheur.
- Résultats : grille 3/2/1 colonnes, `ListingCard` partagé remis en tokens et en contraste, repli temporel/vendeur non trompeur, squelettes 4/3, états vide et erreur distincts.
- Pagination : résultats conservés pendant le chargement suivant, progression calculée sur le total réel et bouton explicite « Charger plus d'annonces ».
- Carte : `AnnoncesMap.tsx` reste inchangé et n'est pas rendu, l'API de liste ne fournissant pas de coordonnées d'annonces.

### Fichiers touchés

- Page et vue : `src/app/annonces/page.tsx`, nouveaux `src/components/listings/ListingsPageView.tsx` et `ListingsFiltersPanel.tsx`, adaptateur `CategoryFeedPage.tsx`.
- Cartes et chargement : `src/components/listings/ListingCard.tsx`, `src/components/ListingSkeleton.tsx`.
- Domaine : nouveaux `src/types/listings.ts`, `src/lib/data/listings.ts` et `src/demo/fixtures/listings.ts`.
- Suivi : `docs/design/PROGRESS.md`.

### Critères d'acceptation

- [x] Composition comparée à la maquette à 1440 px : barre listing, filtres 296 px, titre/total, grille trois colonnes et pagination.
- [x] Aucun débordement horizontal à 390 px ; vérifié également à 768, 1024 et 1440 px avec émulation Chromium exacte.
- [x] Grille 3/2/1 colonnes et sidebar remplacée par un tiroir sous 768 px.
- [x] États chargement, vide et erreur distincts ; aucun échec réseau transformé en liste vide.
- [x] Filtres dans l'URL, catégories/localisation issues des sources partagées, aucun compteur de facette ou identifiant de production inventé.
- [x] Pagination par curseur explicite sans masquer les résultats déjà chargés.
- [x] Tiroir mobile contrôlé au clavier : focus initial, boucle Tab, Échap, fond verrouillé et retour au déclencheur.

### Validation et limites

`eslint .`, `tsc --noEmit`, `git diff --check` et le build de production (105 pages) passent. `check-design --changed` passe avec zéro erreur et deux avertissements attendus : hauteur dynamique de l'histogramme de prix et largeur dynamique de progression.

Recette locale en mode `NEXT_PUBLIC_DEMO_DATA=true` sur le serveur isolé 3103 : 12 annonces de démonstration, contrastes corrigés, aucun débordement aux quatre largeurs et tiroir mobile fonctionnel. Le contrôle intégré du navigateur n'étant pas exposé dans cette session, la revue a utilisé Chromium headless et son protocole d'émulation locale ; captures conservées hors dépôt dans `C:\Users\Léo\Documents\Codex\kalico-listings-review`. Les bandeaux globaux de consentement et de démonstration observés sont partagés et hors périmètre de cette fiche.
