# Avancement de la refonte v2

Statuts : `À faire` · `Inventaire` · `En cours` · `À relire` · `Fait` · `Bloqué`.
Codex met à jour sa ligne et la section de sa page à la fin de chaque étape.

| Fiche | Page | Route | Statut | PR |
| --- | --- | --- | --- | --- |
| [00](specs/00-fondations.md) | Fondations : tokens et composants de base | /dev/ui (galerie) | Fait (fusionnée) | [#215](https://github.com/Troca-nc/troca-safe-export/pull/215) |
| [01](specs/01-layout.md) | En-tête, pied de page, onglets de compte | toutes | Fait (fusionnée) | [#216](https://github.com/Troca-nc/troca-safe-export/pull/216) |
| [02](specs/02-accueil.md) | Accueil | / | Fait (fusionnée) | [#217](https://github.com/Troca-nc/troca-safe-export/pull/217) |
| [03](specs/03-annonces.md) | Liste des annonces | /annonces | Fait (fusionnée) | [#218](https://github.com/Troca-nc/troca-safe-export/pull/218) |
| [04](specs/04-annonce.md) | Fiche annonce | /annonces/[id] | Fait (fusionnée) | [#219](https://github.com/Troca-nc/troca-safe-export/pull/219) |
| [05](specs/05-connexion.md) | Connexion | /connexion, /mot-de-passe-oublie | Fait (fusionnée) | [#220](https://github.com/Troca-nc/troca-safe-export/pull/220) |
| [06](specs/06-inscription.md) | Inscription | /inscription | À relire | — |
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

### Décisions validées avant code

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

## 04 — Fait

### Base et références

Branche `design/04-annonce`, créée depuis `origin/main` au commit de fusion de la fiche 03 `ee40a3845872e2a907899dadb08bbc004d2f75b0`. Le worktree isolé est `D:\Codex\kalico-worktrees\04-annonce`. Aucune branche ou PR antérieure intitulée `design(04)` n'a été trouvée.

Références lues : fiche `04-annonce.md`, `DONNEES-DEMO.md`, `Annonce v2.dc.html` et les patterns de `DESIGN.md`. La fiche cite « §5.3 Fiche », mais §5.3 décrit le listing ; le pattern détail est §5.4 et constitue la référence cohérente. Le contrôle intégré du navigateur n'est pas exposé dans cette session : le balisage et l'intégralité de `renderVals()` ont été inspectés, et la comparaison visuelle rendue restera obligatoire après validation.

### Fichiers existants trouvés

- `src/app/annonces/[id]/page.tsx` ne contient que le chargement serveur, les métadonnées/JSON-LD, le `Header` et l'appel à `AnnonceDetail`. Son `fetchAnnonce()` transforme actuellement toute erreur réseau en `null`, donc en 404, et appelle l'API une seconde fois pour les métadonnées. Il utilise encore plusieurs `any` et ne passe pas par `src/lib/data/`.
- `src/components/annonces/AnnonceDetail.tsx` porte l'interface réelle sur 880 lignes, mais n'est pas listé dans la fiche. Il appelle directement les API annonce, messages, vendeur et avis ; gère favoris, message, offre, troc, avis, signalement et modales ; et mélange le rendu avec les mutations. Son état `loading || !listing` masque l'erreur derrière « Chargement… » et ne fournit aucun bouton Réessayer.
- `src/components/annonces/AnnonceDetailSections.tsx`, également hors liste, contient la galerie, le bloc titre, le vendeur, les avis, le formulaire d'avis, la sécurité, les autres annonces du vendeur et les recherches associées. La structure 16/10 et la colonne 396 px sont proches de la cible, mais le fichier cumule classes historiques/interdites, tailles sous 15 px, `bg-white`, couleurs arbitraires et duplication des cartes/avis.
- `src/components/annonces/AnnonceSimilaires.tsx` existe mais n'est pas rendu. Il appelle `listingsApi.search` directement et recopie une carte au lieu de réutiliser `ListingCard` ; il possède seulement un état de chargement, sans vide ni erreur.
- `src/components/reviews/ReviewCard.tsx` et `ReviewSummary.tsx` sont autorisés par la fiche, mais non utilisés sur la page actuelle. Ils couvrent résumé, réponse, utile et signalement ; ils devront être remis en tokens/rôles typographiques s'ils sont réutilisés.
- `src/components/share/ContentShareButton.tsx` et `ShareSheet.tsx` sont autorisés. `ContentShareButton` est un adaptateur léger réutilisable ; `ShareSheet` conserve des couleurs de marques sociales et des classes historiques. Il peut rester inchangé et être consommé sans créer un second mécanisme de partage.
- `src/components/annonces/CategoryFields.tsx` exporte déjà `getCategoryFields(categorySlug)`, ce qui permet de traduire les métadonnées réelles de chaque catégorie en caractéristiques lisibles sans recopier les quatre exemples de la maquette.
- Le footer partagé est déjà monté par `src/app/layout.tsx`; la page détail ne doit pas le recopier.

### Composants par section

| Section | Réutilisation | Intervention prévue après validation |
| --- | --- | --- |
| 1. Fil d'Ariane | `Header`, catalogue/slug de catégorie, commune de l'annonce. | Remplacer le simple lien « Retour » par Accueil / catégorie / commune / titre, avec dernier segment tronqué visuellement mais complet pour les lecteurs d'écran. |
| 2. Galerie | `ListingImage`, tableau `images` réel, motif de repli. | Conserver le ratio 16/10, ajouter compteur, vignettes 104×82, navigation clavier et actions favori/partage secondaires. Aucun visuel de `renderVals()` ne sera copié. |
| 3. Titre, prix, badges | Champs détail réels, états favori/troc/urgent/vedette. | Aligner titre et `price-lg`, badges issus de l'API, métadonnées de publication/localisation et quatre tuiles seulement quand une valeur existe. Le bouton de contact restera l'unique bouton primaire. |
| 4. Description et caractéristiques | `getCategoryFields`, `metadata`, état, troc et commune. | Rendre la description en 17 px, les caractéristiques réelles et le souhait de troc. Ne pas afficher la fausse carte ni la distance de la maquette : l'API détail ne fournit pas de coordonnées d'annonce. |
| 5. Colonne vendeur 396 px | Auth/favoris existants, profil public, messages/offres/troc, avis vendeur, sécurité et signalement. | Conserver la colonne collante, les badges vérifiés réellement fournis, le contact primaire et les actions secondaires. Afficher les avis via les composants `reviews/*`; retirer le formulaire d'avis de cette page, non demandé par la fiche. Désactiver toutes les actions de contact pour un statut non actif. |
| 6. Annonces similaires | `getListingsPage`/API de liste et `ListingCard`. | Charger jusqu'à quatre annonces actives de la même catégorie, exclure l'annonce courante, utiliser la carte partagée et fournir chargement, vide et erreur. L'API n'a pas d'endpoint « similaires » dédié : la catégorie est le signal réel disponible. |

La maquette ajoute une carte approximative, une alerte de recherche, les autres annonces du vendeur et des recherches associées. La fiche, prioritaire, demande à la place les annonces similaires et ne liste pas ces blocs. Le panneau sécurité et le lien Signaler restent cohérents avec `DESIGN.md` §5.4 ; les autres blocs supplémentaires seront omis.

### Données et API vérifiées

| Besoin | Source actuelle | Décision d'inventaire |
| --- | --- | --- |
| Annonce | `GET /api/listings/:id` via `listingsApi.getById`; réponse normalisée `{ data }` avec titre/prix doubles, images, métadonnées, commune, statut, troc et vendeur. | Étendre le domaine `listings` typé et centraliser lecture/normalisation dans `src/lib/data/listings.ts`; distinguer explicitement 404 et erreur réseau. |
| Vendeur | Inclus dans la réponse détail (`user`/`author`) : identité, pro vérifié, avis, annonces, ancienneté, localisation, vérifications, confiance, présence et délai de réponse. | Aucun appel profil supplémentaire. Aucun téléphone réel n'est renvoyé par l'API publique ; ne pas inventer un bouton téléphone actif. |
| Avis | `GET /api/users/:id/reviews`; la réponse contient note, commentaire, auteur/avatar et date. | Charger les avis réellement reçus et afficher résumé/cartes. L'endpoint backend transforme actuellement certaines erreurs DB en liste vide : sans changement serveur autorisé, ce cas est indiscernable d'un vrai vide. |
| Similaires | `GET /api/listings` accepte catégorie, commune, tri, limite et curseur. Aucun endpoint de recommandation dédié. | Utiliser la même catégorie, exclure l'id courant côté données et limiter à quatre résultats. |
| Contact/offre/troc/signalement | APIs existantes `messagesApi`, `listingsApi.report` et formulaire troc. | Conserver les mutations existantes derrière les règles d'authentification, via la couche de données lorsque la fiche est implémentée. |
| Statuts | L'API détail publique ne retourne que les annonces `active`; `reserved`, `sold` ou `inactive` ne sont visibles que par le propriétaire ou un administrateur. Elle ne distingue pas explicitement `expired` dans la projection détail. | Rendre le bandeau et désactiver le contact lorsqu'un statut non actif est effectivement fourni (propriétaire/admin/démo). Pour le public, une annonce retirée reste une 404 conformément au contrat actuel ; aucun changement serveur. |

Les fixtures de la fiche 03 ne contiennent que les cartes de recherche. Après validation, elles seront étendues avec un détail actif et un détail indisponible, identifiants `demo-*`, vendeur/avis « (démo) » et aucun média externe. Les images absentes utiliseront le motif neutre existant.

### États et responsive à vérifier

- Chargement : squelette final avec galerie 16/10, bloc titre et colonne vendeur 396 px ; pas de simple texte centré.
- 404 proposée : « Cette annonce n'est plus disponible. » puis « Elle a peut-être été retirée ou le lien est incorrect. », avec retour vers les annonces.
- Erreur proposée : « Impossible de charger cette annonce. » avec bouton « Réessayer ».
- Vendue proposée : « Cette annonce a été vendue. Le contact avec le vendeur est désactivé pour cet article. »
- Autre statut non actif proposé : « Cette annonce n'est plus active. Le contact avec le vendeur est désactivé. »
- Similaires vide proposé : « Aucune annonce similaire disponible pour le moment. » ; erreur : « Impossible de charger les annonces similaires. » avec Réessayer.
- Largeurs obligatoires : 1440, 1024, 768 et 390 px. Deux colonnes à partir de `lg`; en dessous la colonne vendeur repasse dans le flux. Galerie/vignettes défilables, titre/prix empilés sur mobile, caractéristiques 4/2/1 colonnes, aucune action fixe qui masque le consentement global.

### Décisions validées avant code

1. Ajout au périmètre des composants réellement porteurs de la page et des fichiers du domaine `listings`.
2. Priorité à la fiche : sécurité/signalement et similaires conservés ; carte approximative, alerte, autres annonces du vendeur, recherches associées et formulaire d'avis omis.
3. Bandeau et contact désactivé pour un statut non actif effectivement fourni ; maintien de la 404 publique imposée par le backend.
4. Textes d'états validés et similaires définies par la même catégorie, annonce courante exclue.

### Résultat

- Route serveur reliée à `src/lib/data/listings.ts`, erreurs réseau laissées à la frontière `error.tsx` et 404 réservée à `ListingNotFoundError`.
- Galerie 16/10 avec repli neutre, navigation et vignettes 104×82 ; bloc titre/prix/badges, quatre tuiles factuelles, description et caractéristiques issues des métadonnées.
- Colonne vendeur 396 px collante sur bureau, contact unique action primaire, favoris/partage secondaires, sécurité et signalement. Le contact est désactivé pour les statuts non actifs.
- Avis vendeur réels et jusqu'à quatre annonces similaires de la même catégorie via `ListingCard`, sans appel API direct depuis le nouveau composant de page.
- Fixtures détail actives et vendue, avis et vendeurs `demo-*`/« (démo) » sans média externe.
- États dédiés : squelette final, 404 explicite, erreur avec Réessayer, bandeau vendu/inactif et similaires vides.

### Validation

- `npm run lint` : réussi.
- `tsc --noEmit` : réussi.
- build Next.js de production : réussi, 105 routes générées.
- `node scripts/check-design.mjs --changed` : 10 fichiers, zéro erreur, zéro avertissement.
- `git diff --check` : réussi.
- Recette HTTP locale en mode démo : annonce active 200 avec titre, annonce vendue 200 avec bandeau et identifiant inconnu avec copie 404 rendue. La route de démonstration a été ouverte dans le navigateur intégré sur le port 3104 ; le contrôle programmatique du navigateur n'étant pas exposé dans cette session, la comparaison visuelle aux quatre largeurs reste à confirmer dans la revue humaine avant fusion.

## 05 — Inventaire (étape 1, sans code)

### Base et références

Branche `design/05-connexion`, créée depuis `origin/main` au commit de fusion de la fiche 04 `4d8ef7a896dfa05e8ef14fa08e58b7675e409bd6`. Aucun commit, branche distante ou PR `design(05)` n'a été trouvé. Références lues : fiche `05-connexion.md`, `DONNEES-DEMO.md`, `DESIGN.md` §4.1, §4.2 et §5.2, et l'onglet « Se connecter » de `Connexion v2.dc.html`.

La cible est une page pleine hauteur en deux volets égaux : marque sombre à gauche, formulaire crème à droite. Sous `lg`, le volet marque disparaît et le formulaire occupe toute la largeur. Les valeurs produites par `renderVals()` dans la maquette ne seront pas copiées comme données.

### Fichiers existants trouvés

- `src/app/connexion/page.tsx` est un composant serveur de 26 lignes qui lit `next`, `redirect` ou `returnUrl`, puis délègue tout le rendu à `src/app/connexion/ConnexionClient.tsx`. Ce dernier fichier, non listé par la fiche, contient les 460 lignes de l'interface et du comportement réels.
- `ConnexionClient.tsx` présente actuellement le formulaire à gauche et un panneau clair à droite dans une grille 45/55. Le formulaire est progressif (email, puis mot de passe) alors que la maquette montre les deux champs ensemble. Il n'a ni option « rester connecté » ni connexion SMS. Le lien « Mot de passe oublié ? » pointe vers `/reset-password`, route inexistante, au lieu de `/mot-de-passe-oublie`.
- Le même composant appelle `useAuthStore.login`, importe directement les comptes de `src/lib/demoApi.ts`, interprète les erreurs avec des comparaisons de chaînes, gère Turnstile, Google si configuré, le retour après connexion et le compte démo. Il contient aussi des couleurs/rayons arbitraires, `bg-white`, plusieurs textes sous 15 px et des animations CSS locales.
- `src/components/auth/AuthMapPanel.tsx` est un panneau de marque sombre existant, mais beaucoup plus dense que la maquette et encore fondé sur les anciens tokens/couleurs arbitraires. Il peut être simplifié et réutilisé comme volet gauche commun aux parcours connexion/inscription.
- `src/components/auth/TurnstileChallenge.tsx` gère correctement le chargement, l'erreur, l'expiration et la suppression du widget, mais utilise encore des classes historiques et des textes 11/12 px. Il doit conserver strictement son contrat et son chargement externe.
- `src/components/auth/SocialAuthButtons.tsx` porte les flux Google/Apple réels. La page n'affiche actuellement Google que lorsqu'il est configuré. Aucun changement de ce flux n'est requis par la fiche.
- `src/components/auth/AuthRequiredModal.tsx` est partagé par les actions nécessitant une connexion et n'a pas à être modifié pour cette page.
- `src/app/mot-de-passe-oublie/page.tsx`, route explicitement visée par la fiche mais fichier absent de sa liste, appelle directement `authApi.forgotPassword`. Il préserve déjà le message neutre anti-énumération, détecte email/téléphone et gère Turnstile, envoi et succès, mais utilise l'ancien design et n'offre pas de bouton Réessayer après une erreur de réseau.
- `src/app/mot-de-passe-oublie/reset/page.tsx` est la destination du lien envoyé et reste hors périmètre : la fiche ne cite pas cette route.

### Composants par section

| Section | Réutilisation | Intervention prévue après validation |
| --- | --- | --- |
| 1. Volet marque sombre | `AuthMapPanel`, logo `/brand/kalico1.svg`, motif tressage et tokens `ink-deep`/`cream`. | Réduire le panneau à la structure §5.2 : marque, halo/logo, accroche, trois preuves sans chiffres et devise. Animations limitées au tangage/halo, désactivées avec `prefers-reduced-motion`. |
| 2. Formulaire | `Button`, `Field`/`Input`, `Checkbox`, `TurnstileChallenge`, `useAuthStore.login`, redirection existante. | Afficher email et mot de passe ensemble, bouton Afficher/Masquer, Turnstile réel, action primaire unique et état Envoi. Corriger le lien vers `/mot-de-passe-oublie`. Conserver le flux, les jetons, la vérification email et les redirections tels quels. |
| 3. Inscription | Route `/inscription` existante. | Le segmenteur de la maquette devient une navigation réelle : « Se connecter » actif et « Créer un compte » vers `/inscription`, sans fusionner les deux parcours ni changer leur état. |
| 4. Réassurance | Icônes et textes d'interface factuels. | Ligne séparée en pied du volet droit, sans compteur ni valeur vitrine. Le texte restera de l'interface statique conformément à `DONNEES-DEMO.md`. |
| Mot de passe oublié | Page existante, endpoint neutre, Turnstile. | Appliquer la même coque deux volets, déplacer l'appel via `src/lib/data/auth.ts`, conserver le message anti-énumération, ajouter chargement final et erreur réseau avec Réessayer. La page de définition du nouveau mot de passe reste inchangée. |

### Données et flux vérifiés

| Besoin | Source actuelle | Décision d'inventaire |
| --- | --- | --- |
| Connexion email/mot de passe | `useAuthStore.login` → `authApi.login` → `POST /api/auth/login`; Turnstile et redirection déjà intégrés. | Conserver cet enchaînement. La future couche `src/lib/data/auth.ts` centralisera seulement la présentation des erreurs et l'accès aux informations de démonstration, sans modifier jetons, cookies ou redirections. |
| Identifiants incorrects | Le backend renvoie une erreur d'authentification ; le client la déduit actuellement du texte. | Normaliser côté données en état typé `invalid_credentials`, sans changer la requête. |
| Compte bloqué | `authAccountService` renvoie HTTP 429, code `LOGIN_LOCKED`, message et `retryAfter`. | Afficher un retour dédié à partir du code réel. Aucun minuteur inventé si `retryAfter` n'est pas exposé au client. |
| Vérification email | Code `EMAIL_NOT_VERIFIED`, redirection existante vers `/verification-email`. | Conserver exactement ce comportement. |
| Mot de passe oublié | `POST /api/auth/forgot-password` accepte email ou téléphone et renvoie toujours un message neutre. | Ajouter un adaptateur dans `src/lib/data/auth.ts`; ne jamais révéler si le compte existe. |
| Démonstration | `src/lib/demoApi.ts` et `authStore` possèdent des comptes opérationnels historiques `@demo.kalico.nc`. | Ne pas dupliquer ni renommer ces comptes, car cela casserait le parcours démo. Le composant ne les importera plus directement ; l'adaptateur de données les masquera. |
| Session persistante | Le refresh token est toujours posé dans un cookie sécurisé avec `maxAge`; l'access token reste en `sessionStorage`. Aucun paramètre `remember` n'existe dans le store ou l'API. | Ne pas créer une case à cocher sans effet. Un vrai choix demanderait de modifier le contrat d'authentification, interdit par la fiche. |
| Connexion SMS | Les routes `/phone/send` et `/phone/verify` exigent déjà un utilisateur authentifié et servent à vérifier son numéro. Aucun endpoint de connexion sans mot de passe n'existe. | Ne pas brancher le bouton de maquette sur ces routes : ce serait un faux flux et une régression de sécurité. |

### États et responsive à vérifier

- Hydratation initiale : squelette aux dimensions du titre, des deux champs et des actions, sans remplacer le volet marque.
- Envoi : bouton primaire stable avec spinner et libellé « Connexion… » ; pas de saut de largeur.
- Identifiants incorrects : alerte associée au formulaire, focus géré et champs conservés.
- Compte bloqué : message dédié issu de `LOGIN_LOCKED`.
- Erreur réseau : message « Connexion impossible. Vérifiez votre réseau. » et bouton « Réessayer » rejouant la dernière soumission explicite.
- Mot de passe oublié : état formulaire, envoi, succès neutre, erreur réseau avec Réessayer.
- Largeurs 1440, 1024, 768 et 390 px ; deux volets à partir de `lg`, formulaire seul en dessous, aucun débordement ni action sous 44 px.
- Toutes les animations du volet marque et les transitions non essentielles sont neutralisées avec `prefers-reduced-motion`.

### QUESTIONS avant code

1. Périmètre étendu à `ConnexionClient.tsx` et `mot-de-passe-oublie/page.tsx`; nouveaux fichiers de données, types et coque auth autorisés.
2. Bouton de connexion SMS omis faute de flux public existant et sans changement serveur.
3. Case « Rester connecté » omise, car elle serait sans effet avec le contrat de session actuel.
4. Segmenteur traité comme navigation réelle entre `/connexion` et `/inscription`.

### Résultat

- Coque auth partagée en deux volets égaux à partir de `lg`, avec volet marque sombre, motif, logo animé, trois preuves factuelles et réassurance en pied. Sous `lg`, seul le formulaire est rendu.
- Formulaire connexion aligné sur la maquette : e-mail et mot de passe simultanés, Afficher/Masquer, lien corrigé vers `/mot-de-passe-oublie`, Turnstile réel, action primaire unique, Google seulement s'il est configuré et accès démo existant conservé.
- Flux d'authentification inchangé : `useAuthStore.login`, jetons, cookie, redirection après connexion, vérification e-mail et profils démo restent les sources effectives.
- Couche `src/lib/data/auth.ts` pour la présentation typée des erreurs, le masquage des comptes démo et l'adaptateur mot de passe oublié. Les erreurs distinguent identifiants, blocage `LOGIN_LOCKED`, réseau et inconnu.
- Route mot de passe oublié remise dans la même composition, avec message de succès neutre anti-énumération et Réessayer sur erreur réseau.
- Squelettes finaux pour les deux routes ; chargement des boutons sans changement de largeur ; animations neutralisées sous `prefers-reduced-motion`.

### Fichiers touchés

- Routes : `src/app/connexion/ConnexionClient.tsx`, nouveaux `src/app/connexion/loading.tsx`, `src/app/mot-de-passe-oublie/loading.tsx`, et `src/app/mot-de-passe-oublie/page.tsx`.
- Auth partagée : `src/components/auth/AuthMapPanel.tsx` et nouveau `AuthPageShell.tsx`.
- Données et types : nouveaux `src/lib/data/auth.ts` et `src/types/auth.ts`.
- Suivi : `docs/design/PROGRESS.md`.

### Critères d'acceptation

- [ ] Comparaison visuelle exacte avec la maquette à 1440 px : composition et dimensions codées selon §5.2, mais contrôle programmatique du navigateur indisponible dans cette session ; revue humaine requise.
- [ ] Aucun débordement à 390 px : grille mobile et largeurs fluides codées, mais émulation visuelle exacte non exposée ; revue humaine requise.
- [x] `check-design --changed` : 8 fichiers inspectés, zéro erreur, zéro avertissement.
- [x] Aucune valeur de données produite par `renderVals()` recopiée ; uniquement textes d'interface statiques et capacités existantes.
- [x] Aucun changement du flux d'authentification, du store, des jetons, des cookies, de l'API ou du serveur.
- [x] Animations du volet marque désactivées par `prefers-reduced-motion`; squelettes utilisent déjà `motion-reduce:animate-none`.

### Validation et écarts

`npm run lint`, `tsc --noEmit`, le build Next.js de production (105 routes), `node scripts/check-design.mjs --changed` et `git diff --check` passent. Recette locale en mode démo sur le port 3105 : `/connexion` et `/mot-de-passe-oublie` répondent en HTTP 200. La connexion SMS et la case de persistance sont volontairement absentes selon validation humaine, car les afficher créerait des contrôles sans contrat fonctionnel. Aucun changement serveur ni production.

## 06 — Inventaire (étape 1, sans code)

### Base et références

Branche `design/06-inscription`, créée depuis `origin/main` au commit de fusion de la fiche 05 `d1dbda7a7c7329a5cbdf1cd172fd5e09f872a550`. Aucune branche ou PR `design/06-inscription` existante n'a été trouvée. Références lues : fiche `06-inscription.md`, `DONNEES-DEMO.md`, `DESIGN.md` §4 « Inscription » et `Inscription v2.dc.html`.

La cible est un parcours en quatre étapes pour un particulier et cinq pour un professionnel, suivi d'un écran de bienvenue. Le volet marque de 560 px adapte son contenu à l'étape. Les valeurs de `renderVals()` de la maquette, notamment identité, téléphone, e-mail, RIDET, tarifs et code OTP, restent des exemples et ne seront pas recopiées comme données.

### Fichiers existants trouvés

- `src/app/inscription/page.tsx` est un composant client de 886 lignes. Il gère aujourd'hui trois étapes dans un ordre différent : Identifiants, Profil, Offre Pro. Il mélange rendu, validation, appels directs à `metaApi`, plans codés en dur et présentation des erreurs. Il ne vérifie pas le téléphone, ne rend pas l'écran Bienvenue et ne restaure aucun état après rechargement.
- Le formulaire existant appelle `useAuthStore.register`, qui crée réellement la session, envoie l'e-mail de vérification et conserve les jetons. Le backend accepte identité, commune, téléphone et type de compte, mais pas la raison sociale, le RIDET ni le secteur.
- `src/components/profil/PhoneVerification.tsx` et `src/hooks/usePhoneVerification.ts` implémentent déjà saisie du numéro, code à six chiffres, renvoi, délai et erreurs. Les routes `/api/phone/*` exigent une session authentifiée : le compte doit donc être créé avant l'étape OTP. Le hook peut être réutilisé sans modification de contrat ; le composant visuel doit être adapté au parcours.
- `src/components/auth/AuthMapPanel.tsx` et `AuthPageShell.tsx`, livrés avec la fiche 05, fournissent la composition sombre/crème et les animations à mouvement réduit. Le panneau doit accepter le texte et les preuves de l'étape courante ; la coque d'inscription doit accepter un contenu plus large que le formulaire de connexion.
- `src/components/auth/TurnstileChallenge.tsx` et `SocialAuthButtons.tsx` sont fonctionnels. Turnstile reste attaché à la création du compte. Le flux social ne peut pas garantir les informations et vérifications exigées par le stepper ; il sera conservé comme voie distincte vers l'onboarding existant, sans simuler les étapes.
- `src/lib/data/auth.ts` centralise déjà les erreurs de connexion et le mot de passe oublié, mais aucune couche de données d'inscription n'existe. `src/lib/api.ts` expose les API nécessaires : inscription, communes, téléphone, profil Pro et abonnements.

### Composants par section

| Section | Réutilisation | Intervention prévue après validation |
| --- | --- | --- |
| 1. Volet marque | `AuthMapPanel`, logo, motif et tokens de la fiche 05. | Rendre titre, texte et preuves paramétrables selon l'étape, largeur de référence 560 px, animations neutralisées avec `prefers-reduced-motion`. |
| 2. Stepper | Primitives `Button`, `Card` et tokens existants. | Créer un stepper accessible : Type, Informations, Identifiants, Vérification, puis Offre seulement pour Pro. Les étapes terminées sont revisitable sans sauter une étape future. |
| 3. Type de compte | Deux cartes déjà présentes dans la page. | Les déplacer en première étape, supprimer valeurs tarifaires codées et adapter immédiatement le nombre d'étapes au choix particulier/pro. |
| 4. Informations | Champs actuels prénom, nom, commune et téléphone ; API communes réelle. | Préfixe +687, téléphone requis par la fiche ; ajouter raison sociale, RIDET et secteur pour Pro. Le RIDET est validé au format dix chiffres puis marqué en attente, sans prétendre interroger l'ISEE. |
| 5. Identifiants | `useAuthStore.register`, Turnstile, jauge et règles existantes. | Créer le compte ici, conserver le flux réel d'e-mail et de session, lier explicitement CGU/confidentialité, désactiver Continuer avec motif visible et fournir Réessayer sur erreur réseau. |
| 6. Vérification | `PhoneVerification` et `usePhoneVerification`, compte désormais authentifié. | Réutiliser l'envoi, la saisie OTP à six chiffres, le renvoi et les délais réels ; ne jamais afficher le code de démonstration de la maquette. |
| 7. Offre Pro | `GET /api/subscriptions/plans`. | Construire les trois choix depuis les deux plans réels : gratuit, Pro mensuel et Pro annuel. Aucun tarif codé dans le composant. L'activation payante/essai reste différée tant que le RIDET n'est pas validé. |
| 8. Bienvenue | Routes existantes `/deposer`, `/profil` et espaces Pro. | Afficher les statuts réellement atteints puis trois actions utiles selon le type de compte, sans statistiques ni promesse inventée. |

### Données et contrats vérifiés

| Besoin | Source actuelle | Décision d'inventaire |
| --- | --- | --- |
| Création du compte | `useAuthStore.register` → `POST /api/auth/register`; la réponse ouvre une session et déclenche l'e-mail de vérification. | Conserver strictement ce flux. La création a lieu à la fin de l'étape Identifiants afin que l'OTP authentifié fonctionne ensuite. |
| Communes | `metaApi.getCommunes()` → `/api/communes`. | Accès via une nouvelle couche `src/lib/data/registration.ts`, avec chargement, erreur et Réessayer. |
| Vérification téléphone | `phoneApi` et `usePhoneVerification`; `/api/phone/*` protégé par authentification. | Réutiliser le contrat réel après création du compte. Le téléphone reste non public par défaut. |
| Informations Pro | `proApi.updateProfile()` → `PATCH /api/pro/me`, qui accepte raison sociale, secteur et RIDET sans imposer de description. | Enregistrer les champs après création du compte. `pro_verified` reste faux ; aucune validation automatique simulée. |
| RIDET | Aucun endpoint ISEE ou registre public n'existe. Le service serveur sait uniquement lier un RIDET après validation d'un justificatif par l'administration. | Accepter un format de dix chiffres, afficher « En attente de validation » et conserver le processus administratif existant. Aucun appel externe ni changement serveur. |
| Formules | `subscriptionsApi.getPlans()` → `GET /api/subscriptions/plans`, qui renvoie Gratuit et Pro avec prix mensuel/annuel et fonctionnalités. | Dériver les trois cartes sans recopier les montants de la maquette. Le démarrage d'essai exige déjà un RIDET validé ; l'inscription ne le contournera pas. |
| Persistance | Aucun brouillon d'inscription actuel. Les jetons de session sont déjà persistés par l'auth store après création. | Stocker dans `sessionStorage` l'étape, le type et les champs non sensibles. Ne jamais stocker mot de passe, confirmation, Turnstile ni OTP. Après rechargement, revenir sur Identifiants si un secret doit être ressaisi, ou restaurer Vérification/Offre/Bienvenue si le compte a déjà été créé. |
| Démonstration | Aucune fixture d'inscription. Les API auth mutent des données et ne doivent pas être simulées silencieusement. | Les données de référence (communes et plans) passent par la couche de données ; aucune identité, coordonnée ou RIDET de maquette n'est créé en fixture. |

### États et responsive à vérifier

- Chaque action Continuer est désactivée tant que l'étape est invalide, avec un motif textuel immédiatement dessous.
- Communes, plans et soumission ont squelette, erreur et Réessayer aux dimensions finales ; OTP conserve ses états d'envoi, expiration, renvoi et erreur.
- Erreur d'e-mail déjà utilisé : message utile et lien vers `/connexion`. Erreur réseau : valeurs conservées et nouvelle tentative explicite.
- Largeurs 1440, 1024, 768 et 390 px ; volet marque visible à partir de `lg`, formulaire seul sous `lg`, stepper horizontal défilable ou compact sans débordement.
- Corps de texte d'au moins 15 px, champs d'au moins 16 px et actions d'au moins 44 px. Tokens Kalico uniquement, aucun hex, `bg-white`, ancienne classe `kalico-blue` ou style dynamique non nécessaire.

### QUESTIONS avant code

1. Valider l'ajout de nouveaux fichiers `src/lib/data/registration.ts`, `src/types/registration.ts`, composants d'inscription et `loading.tsx`. Ils sont nécessaires pour respecter la séparation données/interface et les états demandés.
2. Valider la création du compte à la fin de l'étape Identifiants, avant l'OTP : c'est la seule séquence compatible avec les routes téléphone authentifiées existantes.
3. Valider le RIDET au format local uniquement et l'état « En attente de validation », sans appel ISEE inexistant, conformément à la rubrique Côté serveur de la fiche.
4. Valider que les trois offres sont Gratuit, Pro mensuel et Pro annuel, toutes dérivées de `/subscriptions/plans`; aucune activation d'essai ou paiement n'est lancée avant validation du RIDET.
5. Valider une persistance de brouillon sans secrets : étape et champs non sensibles uniquement. Mot de passe, Turnstile et OTP sont toujours ressaisis après rechargement.

Aucun code applicatif modifié à cette étape. Les critères d'acceptation seront cochés après les étapes 2 à 6.

### Résultat

- Parcours complet en quatre étapes pour un particulier et cinq pour un professionnel, suivi d'un écran Bienvenue. Le stepper change immédiatement avec le type de compte et interdit de sauter une étape future.
- Volet marque de 560 px sur bureau, contenu adapté à l'étape, composition mobile sans ce volet et animations de la fiche 05 neutralisées sous `prefers-reduced-motion`.
- Informations de référence centralisées dans `src/lib/data/registration.ts` : communes, secteurs et offres. En mode démo, communes et catalogue utilisent des fixtures typées sans identité, téléphone, e-mail ou RIDET d'exemple.
- Création réelle du compte à la fin de l'étape Identifiants via `useAuthStore.register`, avec Turnstile lorsqu'il est configuré, e-mail de confirmation, session existante et erreurs normalisées. Le flux social existant est conservé comme voie distincte lorsqu'il est configuré.
- Téléphone vérifié après création du compte avec le vrai hook OTP : saisie à six chiffres, collage, renvoi, délai, changement de numéro et erreurs. Aucun code OTP de maquette n'est présent.
- Profil Pro complété via `PATCH /api/pro/me` avec raison sociale, secteur, commune, téléphone et RIDET. Le RIDET est seulement vérifié au format dix chiffres et reste explicitement en attente de validation administrative.
- Trois offres dérivées du catalogue réel : Gratuit, Pro mensuel et Pro annuel. La sélection n'active ni essai ni paiement avant validation du RIDET.
- Brouillon conservé dans `sessionStorage` avec étape, type et champs non sensibles. Mot de passe, confirmation, Turnstile et OTP ne sont jamais persistés. Une session absente après rechargement renvoie vers Identifiants si le compte avait été marqué créé.
- Chargements finaux pour la route, les communes et les offres ; erreurs avec Réessayer ; motifs textuels sous chaque action Continuer désactivée.

### Fichiers touchés

- Route : `src/app/inscription/page.tsx` et nouveau `src/app/inscription/loading.tsx`.
- Parcours : nouveau `src/components/auth/RegistrationFlow.tsx` et `AuthMapPanel.tsx` rendu paramétrable.
- Vérification : `src/components/profil/PhoneVerification.tsx` remis sur les primitives et tokens v2, sans changement du hook ou du contrat serveur.
- Données : nouveaux `src/lib/data/registration.ts`, `src/types/registration.ts` et `src/demo/fixtures/registration.ts`.
- Suivi : `docs/design/PROGRESS.md`.

### Critères d'acceptation

- [ ] Ressemble à la maquette à 1440 px, section par section : composition et dimensions codées, route ouverte dans le navigateur intégré, mais contrôle programmatique visuel indisponible dans cette session ; revue humaine requise.
- [ ] Aucun débordement à 390 px : largeurs fluides, stepper défilable et grilles basculées sous `sm`/`lg`, mais émulation visuelle exacte indisponible ; revue humaine requise.
- [x] `check-design --changed` : 8 fichiers inspectés, zéro erreur, zéro avertissement.
- [x] Aucune valeur de `renderVals()` recopiée : identité, coordonnées, RIDET, OTP et tarifs de la maquette sont absents des composants. Les prix viennent de l'API ou de la fixture typée alignée sur le catalogue serveur actuel.
- [x] L'étape et les champs non sensibles survivent à un rechargement via un brouillon versionné en session ; tous les secrets sont exclus.
- [x] Le nombre d'étapes suit le type de compte : quatre pour Particulier, cinq pour Pro.

### Validation et écarts

- `npm run lint` : réussi. La configuration ESLint existante limite encore son périmètre aux fondations UI et ignore les dossiers auth ; le build Next.js a exécuté son contrôle de validité et TypeScript sur l'ensemble du projet.
- `tsc --noEmit` : réussi.
- build Next.js de production : réussi, 105 routes générées, dont `/inscription` à 11,1 kB.
- `node scripts/check-design.mjs --changed` : réussi, 8 fichiers, zéro erreur et zéro avertissement.
- `git diff --check` : réussi ; scan mojibake des fichiers TypeScript/TSX modifiés sans résultat.
- Recette HTTP locale : `/inscription` répond en HTTP 200 sur le port 3106. En développement, les fontes Google ont utilisé leur repli local à cause de la chaîne de certificats ; le build avec certificats système a réussi.
- Aucun changement serveur, schéma, secret, paiement, essai, déploiement ou configuration de production.
