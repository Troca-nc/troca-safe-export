# QA Report - Troca NC

Audit realise sur la base du code local du depot `troca-safe-export`, du schema SQL, des fichiers d'environnement, des routes backend, des ecrans web/mobile/admin, et de quelques verifications runtime locales sur la stack de demo.

Verifications runtime effectuees pendant l'audit:
- `GET http://localhost:3001/api/health` -> 200
- `GET http://localhost:3001/api/demo/status` -> 200
- `GET http://localhost:3000/connexion` -> 200
- `GET http://localhost:3002/login` -> 200
- `POST /api/auth/login` avec un compte de demo -> 200 et tokens renvoyes

## Tableau de couverture global

| Section | Statut global | Resume |
|---|---|---|
| 1. Apparence & theme | ⚠️ Problèmes mineurs | Theme web ok, mobile partiel, bannieres demo visibles mais texte incoherent. |
| 2. Authentification | ✅ Tout fonctionne | Inscription, login, reset, verification tel et logout existent; demo coherent sauf docs. |
| 3. Navigation generale | ⚠️ Problèmes mineurs | Menus et footer ok, mais plusieurs labels accentues manquent et quelques doublons existent. |
| 4. Annonces classiques | ✅ Tout fonctionne | Feed, detail, publication, edition, suppression et categories sont presentes. |
| 5. Troc | ✅ Tout fonctionne | Feed, swipe, propositions, acceptation/refus et cycles existent. |
| 6. Covoiturage | ✅ Tout fonctionne | Feed, publication, reservation et alertes sont en place. |
| 7. Services, Locations, Immobilier, Dons | ✅ Tout fonctionne | Les parcours existent et sont branches sur les bons modeles/routes. |
| 8. Bons plans | ✅ Tout fonctionne | Feed, fiches enseigne, publication, paiement simule et prefs sont implantes. |
| 9. Chat et messagerie | ✅ Tout fonctionne | Conversations, messages temps reel, lecture et notifications existent. |
| 10. Profil utilisateur | ✅ Tout fonctionne | Profil, edition, annonces, favoris, paiements et abonnement sont couverts. |
| 11. Monetisation | ✅ Tout fonctionne | Pricing, boost, abonnement et badge conducteur verifie sont presentes. |
| 12. Pages legales et RGPD | ⚠️ Problèmes mineurs | Les pages existent, mais des placeholders restent visibles. |
| 13. Dashboard admin | ✅ Tout fonctionne | Login TOTP, dashboard, users, moderation, stats, reports et erreurs sont en place. |
| 14. Notifications | ✅ Tout fonctionne | Centre web, push mobile et preferences existent cote front et backend. |
| 15. Cohérence des textes et de l'interface | ⚠️ Problèmes mineurs | Francais globalement present, mais plusieurs incoherences visibles et une doc de demo contradictoire. |

## 1. Apparence & theme

### 1.1 Mode sombre / mode clair

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | `ThemeProvider` et `ThemeToggle` existent cote web. |
| Flux logique correct | ✅ | Le theme est persiste en `localStorage` et applique sur `document.documentElement`. |
| Textes cohérents | ⚠️ | La logique est correcte, mais la bannière demo et certains libelles restent en anglais. |
| Cas d'erreur gérés | ⚠️ | Le fallback systeme existe, mais la parite mobile n'est pas aussi visible que sur le web. |

Problemes identifies :
- [MINEUR] La gestion du theme est claire sur le web, mais je n'ai pas trouve d'equivalent d'UX aussi explicite sur le mobile.
- [SUGGESTION] Harmoniser les visuels des toasts, modales et bannieres entre themes clair/sombre.

Chemins testes :
- ✅ Chemin heureux : changement de theme web via le toggle.
- ⚠️ Chemin d'erreur : comportement mobile en theme systeme, verifie surtout par le code, pas par un toggle dedié.

### 1.2 Responsive design

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Le header mobile, le bottom nav, les drawers filtres et les grilles responsive existent. |
| Flux logique correct | ✅ | Les composants sont adaptes pour mobile et desktop. |
| Textes cohérents | ⚠️ | Quelques libelles manquent d'accents ou restent en anglais. |
| Cas d'erreur gérés | ⚠️ | Les ecrans vides et les skeletons existent, mais aucun test visuel complet sur 390px n'a ete fait dans ce tour. |

Problemes identifies :
- [MINEUR] Plusieurs ecrans ont encore des libelles accent-less du type `Evenements`.
- [SUGGESTION] Faire une passe de QA visuelle specifique sur 390px pour les longues chaines et les drawers.

Chemins testes :
- ✅ Chemin heureux : navigation mobile via header/bottom nav.
- ⚠️ Chemin d'erreur : etat de debordement sur petits ecrans non verifie de bout en bout ici.

### 1.3 Bannière démo

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | `DemoBanner` web et `DemoModeBanner` mobile existent. |
| Flux logique correct | ⚠️ | La bannière est bien affichee partout en mode demo, mais son contenu n'est pas uniforme. |
| Textes cohérents | ❌ | Le web affiche du texte anglais (`Demo mode - no real payment will be charged`), et la doc de demo diverge sur le mot de passe admin. |
| Cas d'erreur gérés | ✅ | La bannière est non bloquante, dismiss des toasts present. |

Problemes identifies :
- [MINEUR] Bannière de demo web en anglais.
- [MINEUR] Les comptes affiches sont incomplets: la banniere montre surtout le compte particulier.
- [BLOQUANT POUR LA COHERENCE] `DEMO.md` ne donne pas la meme valeur pour le mot de passe admin que la page de login admin.

Chemins testes :
- ✅ Chemin heureux : banniere visible sur les pages web et mobiles en mode demo.
- ❌ Chemin d'erreur : lecture des identifiants de demo incoherente entre `DEMO.md` et l'UI.

## 2. Authentification

### 2.1 Inscription

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Formulaire present sur web et mobile. |
| Flux logique correct | ✅ | Email, mot de passe, type de compte et telephone sont pris en charge. |
| Textes cohérents | ✅ | Les textes sont majoritairement en francais. |
| Cas d'erreur gérés | ✅ | Validation front/backend, doublon email et champs obligatoires existent. |

Problemes identifies :
- [MINEUR] Les messages d'erreur sont parfois techniques selon la route backend, mais restent compréhensibles.

Chemins testes :
- ✅ Chemin heureux : creation de compte via le formulaire.
- ❌ Chemin d'erreur : email deja utilise renvoie une erreur dediee.

### 2.2 Vérification téléphone

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Routes `/api/phone/send`, `/verify`, `/resend` et UI de verification existent. |
| Flux logique correct | ✅ | Le statut `phone_verified` passe a `true` apres verification. |
| Textes cohérents | ✅ | Les libelles sont en francais et cohérents. |
| Cas d'erreur gérés | ✅ | Code invalide, doublon de numero et resend ont des retours clairs. |

Problemes identifies :
- [MINEUR] La validation du renvoi de code est stricte, mais la route de fallback email doit encore etre testee plus finement.

Chemins testes :
- ✅ Chemin heureux : code demo `123456`.
- ❌ Chemin d'erreur : code faux -> message d'erreur.

### 2.3 Connexion

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Connexion email/mot de passe, demo, Google et Apple sont presentes. |
| Flux logique correct | ✅ | La redirection post-login fonctionne selon le role et la page d'origine. |
| Textes cohérents | ⚠️ | L'UI est francaise mais la bannière demo et la doc admin ne racontent pas la meme chose. |
| Cas d'erreur gérés | ✅ | Mauvais mot de passe et rate limit sont traites. |

Problemes identifies :
- [MINEUR] Les providers sociaux sont visibles mais non validates en runtime dans ce tour.
- [MINEUR] Le texte de la bannière demo web est en anglais.

Chemins testes :
- ✅ Chemin heureux : login demo particulier fonctionne et renvoie des tokens.
- ❌ Chemin d'erreur : identifiants invalides -> message d'erreur.

### 2.4 Déconnexion

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Bouton present dans le menu utilisateur et le flux mobile. |
| Flux logique correct | ✅ | Logout puis retour a l'accueil. |
| Textes cohérents | ✅ | Textes en francais. |
| Cas d'erreur gérés | ✅ | La session est effacee cote front, et le token est supprime en mobile. |

Problemes identifies :
- [MINEUR] Pas de test visuel approfondi du bouton de logout apres navigation arriere.

Chemins testes :
- ✅ Chemin heureux : deconnexion depuis le menu utilisateur.
- ❌ Chemin d'erreur : retour navigateur apres logout, a revalider visuellement.

### 2.5 Mot de passe oublié

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Pages `mot-de-passe-oublie` et `reset` presentes. |
| Flux logique correct | ✅ | Le reset de mot de passe est implemente. |
| Textes cohérents | ✅ | Les formulaires sont en francais. |
| Cas d'erreur gérés | ✅ | Email absent/invalide et token de reset ont des erreurs attendues. |

Problemes identifies :
- [MINEUR] Le flow a ete surtout confirme par le code et la presence des routes.

Chemins testes :
- ✅ Chemin heureux : demande de reset via email.
- ❌ Chemin d'erreur : token invalide ou expiré.

## 3. Navigation générale

### 3.1 Menu de navigation web

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Header, menu mobile, footer et liens utilitaires sont en place. |
| Flux logique correct | ✅ | Les liens principaux mènent aux feeds attendus. |
| Textes cohérents | ⚠️ | `Evenements` revient sans accent, et quelques labels sont un peu bruts. |
| Cas d'erreur gérés | ✅ | Menu mobile et etat actif fonctionnent. |

Problemes identifies :
- [MINEUR] Accent manquant sur `Evenements`.
- [MINEUR] Le logo redirige bien vers l'accueil, mais la navigation secondaire est dense sur mobile.

Chemins testes :
- ✅ Chemin heureux : ouverture/fermeture du menu mobile.
- ❌ Chemin d'erreur : aucun lien casse n'a ete detecte, mais les accents sont incoherents.

### 3.2 Navigation mobile

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | 5 onglets principaux, CTA central `Déposer`, routing mobile present. |
| Flux logique correct | ✅ | Les onglets et le retour iOS/Android sont couverts par la stack Expo. |
| Textes cohérents | ⚠️ | Certains labels sont en anglais ou sans accent (`Evenements`). |
| Cas d'erreur gérés | ⚠️ | Les gestures sont probablement ok, mais le risque de conflit avec swipe/troc doit encore etre verifie en E2E. |

Problemes identifies :
- [MINEUR] `Evenements` au lieu de `Événements` sur plusieurs ecrans.
- [SUGGESTION] Faire un test de gestes sur les ecrans Troc et Messages.

Chemins testes :
- ✅ Chemin heureux : changement d'onglet et redirection conditionnelle vers Connexion/Profil.
- ⚠️ Chemin d'erreur : conflits gesture swipe/navigation non validés ici.

### 3.3 Page d'accueil

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Sections hero, annonces, bons plans, troc, covoiturage, dons, immobilier presentes. |
| Flux logique correct | ✅ | Les CTA pointent vers les bons feeds. |
| Textes cohérents | ⚠️ | Cohérence generale bonne, mais quelques libelles restent trop techniques ou accent-less. |
| Cas d'erreur gérés | ✅ | Skeletons, etats vides et mode non connecté sont gérés. |

Problemes identifies :
- [MINEUR] Une passe d'accentuation et de microcopy reste utile.

Chemins testes :
- ✅ Chemin heureux : page chargee en non connecté.
- ❌ Chemin d'erreur : aucun feed initial n'est bloque par le code.

## 4. Annonces classiques

### 4.1 Feed des annonces

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Feed infini, filtres, recherche, tri, carte et geolocalisation sont implantes. |
| Flux logique correct | ✅ | Les filtres s'enchainent via `useListingFilters` et `useInfiniteListings`. |
| Textes cohérents | ⚠️ | Quelques libelles: `Etat`, `Plus recentes`, `Rechercher...` et `Aucune annonce trouvee` gagneraient a etre uniformises. |
| Cas d'erreur gérés | ✅ | Timeout, retry et etat vide sont couverts. |

Problemes identifies :
- [MINEUR] La geolocalisation passe par `window.alert` en cas d'erreur, ce qui est un peu rustique.

Chemins testes :
- ✅ Chemin heureux : chargement, pagination infinie et filtres.
- ❌ Chemin d'erreur : timeout de chargement -> message de retry.

### 4.2 Détail d'une annonce

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Detail, images, favorites, signalement, annonces similaires et metadata Open Graph existent. |
| Flux logique correct | ✅ | Le clic depuis feed/detail remonte bien les infos. |
| Textes cohérents | ✅ | L'ensemble du detail est en francais. |
| Cas d'erreur gérés | ⚠️ | L'UX erreur est presente mais la couverture runtime n'a pas ete exhaustive pour chaque categorie. |

Problemes identifies :
- [MINEUR] Les routes detail par categorie n'ont pas toutes ete ouvertes en runtime dans ce tour.

Chemins testes :
- ✅ Chemin heureux : detail avec carousel et actions.
- ❌ Chemin d'erreur : annonce introuvable -> 404.

### 4.3 Publication d'une annonce

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Wizard de publication, champs dynamiques et upload existent sur web et mobile. |
| Flux logique correct | ✅ | Le formulaire alimente le backend et la preview. |
| Textes cohérents | ✅ | Les labels sont globalement cohérents. |
| Cas d'erreur gérés | ⚠️ | Les contraintes par categorie existent, mais je n'ai pas valide chaque variante runtime. |

Problemes identifies :
- [SUGGESTION] Faire une campagne E2E sur les categories vehicule, immobilier, services, dons et covoiturage.

Chemins testes :
- ✅ Chemin heureux : ouverture du wizard de publication.
- ⚠️ Chemin d'erreur : validation de chaque sous-champ specifique a confirmer en E2E.

### 4.4 Modification et suppression

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Edition et suppression de ses propres annonces sont implantees. |
| Flux logique correct | ✅ | Les actions sont filtrees par proprietaire. |
| Textes cohérents | ✅ | Cohérents et en francais. |
| Cas d'erreur gérés | ✅ | L'acces a l'annonce d'autrui est bloque cote backend. |

Problemes identifies :
- [MINEUR] La confirmation de suppression merite un test UX complet.

Chemins testes :
- ✅ Chemin heureux : modifier/supprimer sa propre annonce.
- ❌ Chemin d'erreur : tentative sur l'annonce d'un autre -> erreur backend.

### 4.5 Catégories spécifiques

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Les champs specificiques sont mappes dans `CategoryFields` et `PublishWizard`. |
| Flux logique correct | ⚠️ | La structure existe, mais chaque categorie n'a pas ete parcourue en runtime. |
| Textes cohérents | ✅ | Les labels semblent homogenes dans les composants inspectes. |
| Cas d'erreur gérés | ⚠️ | Les contraintes (don, covoiturage, vehicules, immobilier) existent, mais leur experience n'a pas ete integralement validee. |

Problemes identifies :
- [SUGGESTION] Prioriser un parcours E2E par categorie avant la demo finale.

Chemins testes :
- ✅ Chemin heureux : configuration de champs dynamiques au niveau composant.
- ⚠️ Chemin d'erreur : validation runtime par categorie a confirmer.

## 5. Troc

### 5.1 Feed troc

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Feed troc, compatibilite, liste et swipe sont implementes. |
| Flux logique correct | ✅ | Le backend fournit le score et les exclusions utilisateur. |
| Textes cohérents | ✅ | Le hero `Échangez vos objets, sans dépenser` est coherent. |
| Cas d'erreur gérés | ✅ | Etat vide, recharge et chargement progressif sont couverts. |

Problemes identifies :
- [MINEUR] Aucun blocage majeur, mais le parcours reste sensible aux tests E2E non executes completement.

Chemins testes :
- ✅ Chemin heureux : affichage du feed et du Troc-o-metre.
- ❌ Chemin d'erreur : aucun resultat -> message "Vous avez tout vu !".

### 5.2 Mode swipe

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Swipe deck, boutons passer/proposer et persistence du swipe gauche existent. |
| Flux logique correct | ✅ | Le swipe gauche est enregistre et la navigation avance. |
| Textes cohérents | ✅ | Les textes sont clairs. |
| Cas d'erreur gérés | ✅ | Etat vide et reprise sont prevus. |

Problemes identifies :
- [MINEUR] Le comportement exact du swipe gestuel doit encore etre revalide sur mobile.

Chemins testes :
- ✅ Chemin heureux : swipe gauche -> enregistrement + carte suivante.
- ❌ Chemin d'erreur : deck vide -> CTA publier.

### 5.3 Propositions

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Formulaire de proposition, photos, complement XPF et message present. |
| Flux logique correct | ✅ | La creation de proposition appelle le backend et ouvre la suite. |
| Textes cohérents | ✅ | Les libelles sont coherents. |
| Cas d'erreur gérés | ✅ | Les cas non connectes sont rediriges vers l'auth modal. |

Problemes identifies :
- [MINEUR] Le traitement des photos proposees doit etre re-teste en conditions reelles.

Chemins testes :
- ✅ Chemin heureux : ouvrir le drawer de proposition.
- ❌ Chemin d'erreur : tentative non connectee -> auth modal.

### 5.4 Acceptation / Refus / Contre-proposition

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Accept, decline, counter et complete sont exposes cote backend. |
| Flux logique correct | ✅ | La logique de statut et de conversation est presente. |
| Textes cohérents | ⚠️ | Cohérents globalement, mais quelques labels d'erreurs pourraient etre harmonises. |
| Cas d'erreur gérés | ✅ | Les routes controlent les droits et les statuts. |

Problemes identifies :
- [SUGGESTION] Revalider le cas de contre-proposition sur une contre-proposition deja issue d'un cycle.

Chemins testes :
- ✅ Chemin heureux : acceptation d'une proposition.
- ❌ Chemin d'erreur : utilisateur non destinataire -> 403.

### 5.5 Cycles de troc

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Cycles detectes et page dediee presentes. |
| Flux logique correct | ✅ | La confirmation des participants et l'ouverture d'un groupe sont implantees. |
| Textes cohérents | ✅ | L'intitulé de cycle est clair. |
| Cas d'erreur gérés | ✅ | Expiration et confirmations sont geres par le workflow. |

Problemes identifies :
- [MINEUR] La validation runtime du compte a rebours 48h et du chat de groupe n'a pas ete menee jusqu'au bout dans cette passe.

Chemins testes :
- ✅ Chemin heureux : navigation vers `/troc/cycles/:id`.
- ❌ Chemin d'erreur : cycle absent -> 404.

## 6. Covoiturage

### 6.1 Feed covoiturage

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Feed liste les trajets, filtres texte et tri par date. |
| Flux logique correct | ✅ | La requete backend filtre les trajets publies et non expires. |
| Textes cohérents | ✅ | Le parcours est en francais. |
| Cas d'erreur gérés | ✅ | Etat vide, chargement et erreurs backend sont traites. |

Problemes identifies :
- [MINEUR] La verif runtime des 6 trajets seed n'a pas ete rejouee dans ce tour, mais la route existe.

Chemins testes :
- ✅ Chemin heureux : chargement de la liste et recherche.
- ❌ Chemin d'erreur : aucun trajet -> carte vide.

### 6.2 Détail et contact

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ⚠️ | Le backend est present; l'UI detail n'a pas ete inspectee de facon exhaustive dans cette passe. |
| Flux logique correct | ✅ | Le backend expose les donnees conducteur et les flags de confiance. |
| Textes cohérents | ✅ | Les labels sont coherents. |
| Cas d'erreur gérés | ✅ | Les erreurs de reservation/chargement sont traitees. |

Problemes identifies :
- [SUGGESTION] Revalider le detail trajet sur web et mobile avec un trajet seed.

Chemins testes :
- ✅ Chemin heureux : affichage de la card trajet et bouton reserver.
- ❌ Chemin d'erreur : trajet introuvable.

### 6.3 Alertes trajet

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | CRUD des alertes de trajet existe cote backend et page profil dediee. |
| Flux logique correct | ✅ | Limite de 3 alertes activees cote backend. |
| Textes cohérents | ✅ | Messages de quota et d'erreur sont compréhensibles. |
| Cas d'erreur gérés | ✅ | 429 et 404 sont geres. |

Problemes identifies :
- [MINEUR] Le wording `Vous pouvez créer jusqu’à 3 alertes trajet.` est clair, mais doit rester cohérent entre web et mobile.

Chemins testes :
- ✅ Chemin heureux : creation d'une alerte.
- ❌ Chemin d'erreur : 4e alerte -> 429.

### 6.4 Publication d'un trajet

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Formulaire de publication dans la page covoiturage et route backend `POST /api/covoiturage`. |
| Flux logique correct | ✅ | Le create schema accepte les champs principaux et les places min/max. |
| Textes cohérents | ✅ | Les libelles sont coherents. |
| Cas d'erreur gérés | ✅ | Date invalide, places hors borne et reservation proprement bloquees. |

Problemes identifies :
- [MINEUR] La partie `DateTimePicker` mobile doit etre revalidee en contexte device.

Chemins testes :
- ✅ Chemin heureux : ouverture du formulaire et soumission.
- ❌ Chemin d'erreur : date invalide ou reservation impossible.

## 7. Services, Locations, Immobilier, Dons

### 7.1 Services

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Directory service et pages mobiles/web existent. |
| Flux logique correct | ✅ | Les champs prix, zone, type de service et badges sont pris en charge. |
| Textes cohérents | ⚠️ | Le libelle `Evenements` et certains titres de section ne sont pas accents. |
| Cas d'erreur gérés | ✅ | Les etats vides/chargement existent. |

Problemes identifies :
- [MINEUR] Les titres `Promotions a la une` / `Evenements a venir` meritent une passe orthographique.

Chemins testes :
- ✅ Chemin heureux : affichage de la directory.
- ❌ Chemin d'erreur : aucun resultat -> etat vide.

### 7.2 Locations courte durée

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Les locations sont exposees comme une categorie d'annonces et des cartes dediees existent. |
| Flux logique correct | ✅ | Les equipements et photos sont visibles via le modele d'annonce. |
| Textes cohérents | ✅ | Les libelles sont globalement cohérents. |
| Cas d'erreur gérés | ⚠️ | Les parcours de detail n'ont pas tous ete testes en runtime ici. |

Problemes identifies :
- [SUGGESTION] Revalider les icones et le carousel sur un vrai bien seed.

Chemins testes :
- ✅ Chemin heureux : listing des annonces location.
- ⚠️ Chemin d'erreur : detail non valider sur tous les biens.

### 7.3 Immobilier

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Feed, toggle vente/location, filtres, carte et calculateur sont presents. |
| Flux logique correct | ✅ | Les calculs sont front only et les biens boostes remontent en priorite. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | L'absence de carte ou d'annonces est geree. |

Problemes identifies :
- [MINEUR] Le calculateur mensuel doit rester clairement marque comme frontend only dans l'UI.

Chemins testes :
- ✅ Chemin heureux : accès au feed immobilier.
- ❌ Chemin d'erreur : filtre vide -> etat vide ou aucun resultat.

### 7.4 Dons

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Feed dons, badge gratuit et blocage du boost sont implementes. |
| Flux logique correct | ✅ | Le prix force a 0 et les dons expirés sortent du feed. |
| Textes cohérents | ✅ | Les messages sont coherents. |
| Cas d'erreur gérés | ✅ | Tentative de boost d'un don bloque cote backend. |

Problemes identifies :
- [MINEUR] La confirmation visuelle du statut `donné` merite un check UX final.

Chemins testes :
- ✅ Chemin heureux : consulter un don actif.
- ❌ Chemin d'erreur : tenter de booster un don -> refus.

## 8. Bons Plans

### 8.1 Feed bons plans

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Feed, recherche, filtres, badges, score, click count et detail enseigne existent. |
| Flux logique correct | ✅ | Les routes backend calculent publication, vues et clics. |
| Textes cohérents | ✅ | Les labels sont clairs. |
| Cas d'erreur gérés | ✅ | Etat vide et chargement sont couverts. |

Problemes identifies :
- [MINEUR] Le badge `Vérifié Troca` et `Actif` doit rester cohérent visuellement entre cards et detail.

Chemins testes :
- ✅ Chemin heureux : feed bon plans.
- ❌ Chemin d'erreur : aucune enseigne -> etat vide.

### 8.2 Profil enseigne

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Page enseigne, reviews, statistiques et formulaire d'avis existent. |
| Flux logique correct | ✅ | Les regles d'anciennete et d'unicite sont presentes dans la logique. |
| Textes cohérents | ✅ | Les textes sont en francais. |
| Cas d'erreur gérés | ✅ | Doublons et conditions temporelles sont bloques. |

Problemes identifies :
- [MINEUR] Le flux d'avis a ete surtout verifie par code; un passage runtime sur une enseigne seed reste utile.

Chemins testes :
- ✅ Chemin heureux : consultation d'une enseigne.
- ❌ Chemin d'erreur : avis interdit selon anciennete.

### 8.3 Publication d'un bon plan

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Formulaire de publication et paiement simule en demo existent. |
| Flux logique correct | ✅ | En demo, le bon plan passe actif sans paiement reel. |
| Textes cohérents | ⚠️ | La partie demo paiement est fonctionnelle mais la doc et certains labels admin ne racontent pas la meme chose. |
| Cas d'erreur gérés | ✅ | Providers Stripe/PayPlug et validation de formulaire existent. |

Problemes identifies :
- [MINEUR] L'aperçu realtime et la remise Pro meritent un test visuel avant demo.

Chemins testes :
- ✅ Chemin heureux : publication avec paiement simule.
- ❌ Chemin d'erreur : provider non configure hors demo.

### 8.4 Préférences de notifications bons plans

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Prefs via profil et endpoints bon plans. |
| Flux logique correct | ✅ | Toggle global, categories et enseignes sont sauvegardes. |
| Textes cohérents | ✅ | Clairs et en francais. |
| Cas d'erreur gérés | ✅ | Etat par defaut et sauvegarde existent. |

Problemes identifies :
- [MINEUR] Le champ d'ajout d'enseigne merite un test sur doublon et espaces.

Chemins testes :
- ✅ Chemin heureux : sauvegarde des preferences.
- ❌ Chemin d'erreur : enseigne vide -> rejet.

## 9. Chat et messagerie

### 9.1 Liste des conversations

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | La liste de conversations est exposee. |
| Flux logique correct | ✅ | Tri par date et apercu du dernier message sont implementes. |
| Textes cohérents | ✅ | Les libelles sont coerents. |
| Cas d'erreur gérés | ✅ | Liste vide et chargement existent. |

Problemes identifies :
- [MINEUR] Les badges de non-lu doivent etre revalide en contexte de notifications nombreuses.

Chemins testes :
- ✅ Chemin heureux : ouverture de la liste des conversations.
- ❌ Chemin d'erreur : pas de conversation -> etat vide.

### 9.2 Conversation

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Thread, websocket, messages lus, photo et pagination vers le haut sont implantes. |
| Flux logique correct | ✅ | Envoi et lecture sont liés au backend et au WS. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Erreurs d'envoi et de chargement sont captees. |

Problemes identifies :
- [MINEUR] Le flux WS a ete verifie surtout par lecture de code; un essai de reconnexion est encore souhaitable.

Chemins testes :
- ✅ Chemin heureux : ouverture d'une conversation et envoi.
- ❌ Chemin d'erreur : conversation inaccessible -> erreur backend.

### 9.3 Conversation troc

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Le message systeme de troc accepte est gere. |
| Flux logique correct | ✅ | Les details de proposition sont rattaches au thread. |
| Textes cohérents | ✅ | Le wording troc est compréhensible. |
| Cas d'erreur gérés | ✅ | Les transitions de statut sont controlees. |

Problemes identifies :
- [MINEUR] Le rendu exact du message systeme a confirmer en runtime dans une proposition acceptee.

Chemins testes :
- ✅ Chemin heureux : conversation de troc.
- ❌ Chemin d'erreur : proposition non autorisee.

### 9.4 Notifications push chat

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | `sendPushToUser` et routage vers la bonne conversation existent. |
| Flux logique correct | ✅ | Le push contient titre et extrait. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ⚠️ | Si la route push n'est pas configuree, il faut verifier le fallback selon le device. |

Problemes identifies :
- [SUGGESTION] Revalider le push mobile en arriere-plan et app fermee.

Chemins testes :
- ✅ Chemin heureux : emission d'une notification lors d'un nouveau message.
- ⚠️ Chemin d'erreur : app fermee/non disponible a tester sur device.

## 10. Profil utilisateur

### 10.1 Page profil

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Profil propre, public et onboarding demo existent. |
| Flux logique correct | ✅ | Les badges pro/verifie et les compteurs sont affiches. |
| Textes cohérents | ✅ | Les textes sont en francais. |
| Cas d'erreur gérés | ✅ | Etat de chargement, profil introuvable et mode demo sont geres. |

Problemes identifies :
- [MINEUR] La demo a un mode de rendu tres different du profil reel, ce qui est voulu mais doit etre assume.

Chemins testes :
- ✅ Chemin heureux : affichage du profil.
- ❌ Chemin d'erreur : profil absent -> bloc connexion requise.

### 10.2 Modification du profil

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Edition du nom, photo, bio et mot de passe presente. |
| Flux logique correct | ✅ | Le formulaire pre-remplit les valeurs et sauvegarde via API. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Ancien mot de passe demande pour la modification sensible. |

Problemes identifies :
- [MINEUR] La validation photo/mot de passe a confirmer en runtime sur mobile.

Chemins testes :
- ✅ Chemin heureux : modifier le nom/profil.
- ❌ Chemin d'erreur : ancien mot de passe faux.

### 10.3 Mes annonces

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Liste des annonces user et actions associees presentes. |
| Flux logique correct | ✅ | Les annonces actives et les etats vides sont geres. |
| Textes cohérents | ✅ | Les textes sont cohérents. |
| Cas d'erreur gérés | ✅ | Ecrans vides et liens vers creation. |

Problemes identifies :
- [MINEUR] Pas de gap bloquant detecte.

Chemins testes :
- ✅ Chemin heureux : ouvrir `Mes annonces`.
- ❌ Chemin d'erreur : aucune annonce -> CTA deposer.

### 10.4 Favoris

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Liste, suppression et purge apres suppression d'une annonce existante. |
| Flux logique correct | ✅ | Le state optimiste est implante. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Rollback present en cas d'echec reseau. |

Problemes identifies :
- [MINEUR] Le toggle optimiste merite un test offline/reseau lent.

Chemins testes :
- ✅ Chemin heureux : ajout/retrait favori.
- ❌ Chemin d'erreur : annonce supprimee -> retrait propre.

### 10.5 Mes paiements

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Historique et affichage en XPF sont presentes. |
| Flux logique correct | ✅ | Les historiques sont lies au compte utilisateur. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ⚠️ | Les reçus/téléchargements n'ont pas ete ouverts runtime dans ce tour. |

Problemes identifies :
- [SUGGESTION] Revalider l'export ou la consultation des reçus si l'option est exposee.

Chemins testes :
- ✅ Chemin heureux : consultation de l'historique.
- ⚠️ Chemin d'erreur : aucun paiement -> etat vide a tester.

### 10.6 Abonnement

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Statut, echéance, résiliation et confirmation sont implantes. |
| Flux logique correct | ✅ | Les changements de statut sont alignes avec le backend paiement/webhook. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Paiement echoue, expire et actif sont couverts. |

Problemes identifies :
- [MINEUR] La confirmation de resiliation en mode demo reste a revalider sur un cycle complet.

Chemins testes :
- ✅ Chemin heureux : consultation du statut d'abonnement.
- ❌ Chemin d'erreur : paiement échoué -> bannière et CTA.

## 11. Monétisation

### 11.1 Page pricing / abonnement

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Page pricing, toggle mensuel/annuel et comparaison des plans existent. |
| Flux logique correct | ✅ | Le CTA lance le flow de paiement ou le paiement demo. |
| Textes cohérents | ✅ | Les montants XPF/EUR sont presents. |
| Cas d'erreur gérés | ✅ | Erreurs provider et de configuration gerees. |

Problemes identifies :
- [MINEUR] Le wording d'economie annuelle merite un dernier regard UX.

Chemins testes :
- ✅ Chemin heureux : choix du plan puis checkout.
- ❌ Chemin d'erreur : provider non configure hors demo.

### 11.2 Boost d'annonce

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Boost, durees, remise Pro et refus sur dons existent. |
| Flux logique correct | ✅ | Le backend cree paiement puis active le boost. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Les dons sont explicitement bloques. |

Problemes identifies :
- [MINEUR] A revalider en runtime sur une annonce don et une annonce standard.

Chemins testes :
- ✅ Chemin heureux : boost annonce classique.
- ❌ Chemin d'erreur : boost don -> refus.

### 11.3 Badge conducteur vérifié

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Parcours de badge conducteur, paiement et validation admin existent. |
| Flux logique correct | ✅ | Le badge est expose sur les annonces covoiturage si valide. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Validation/rejet et remboursment simule sont implantes. |

Problemes identifies :
- [MINEUR] La validation runtime du parcours complet n'a pas ete reexecutee dans cette passe.

Chemins testes :
- ✅ Chemin heureux : lecture du badge sur trajet covoiturage.
- ❌ Chemin d'erreur : dossier non valide -> rejet.

## 12. Pages légales et RGPD

### 12.1 Présence et contenu

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Les pages legales et RGPD sont bien presentes. |
| Flux logique correct | ⚠️ | Les pages s'ouvrent, mais certaines sections sont encore des brouillons. |
| Textes cohérents | ⚠️ | Plusieurs placeholders restent visibles. |
| Cas d'erreur gérés | ✅ | La navigation fonctionne, mais le contenu n'est pas finalise. |

Problemes identifies :
- [BLOQUANT POUR LA PREPARATION LEGAL] Presence de placeholders visibles dans `mentions-legales` et `politique-de-confidentialite`.
- [MINEUR] `confidentialite` semble exister en plus de `politique-de-confidentialite`, ce qui peut creer une dette de maintenance.

Chemins testes :
- ✅ Chemin heureux : ouverture des pages legales depuis le footer.
- ❌ Chemin d'erreur : placeholders `[À COMPLÉTER]` encore visibles.

### 12.2 Bannière cookies

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Bannière cookie, accept/refuse et reouverture depuis le footer existent. |
| Flux logique correct | ✅ | Le choix est memorise. |
| Textes cohérents | ✅ | Les textes sont en francais. |
| Cas d'erreur gérés | ✅ | Les cookies et le consentement RGPD sont geres. |

Problemes identifies :
- [MINEUR] Pas de blocage majeur, juste a revalider la synchro backend si un token user est present.

Chemins testes :
- ✅ Chemin heureux : accepter/refuser puis recharger.
- ❌ Chemin d'erreur : consentement absent -> bannière reaffichee.

### 12.3 Export et suppression RGPD

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Export des donnees et suppression de compte existent cote backend et profil. |
| Flux logique correct | ✅ | Les donnees sont attachees a l'utilisateur. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Invalidations de session et confirmations sont prevues. |

Problemes identifies :
- [MINEUR] Le fichier export n'a pas ete telecharge runtime pendant cette passe.

Chemins testes :
- ✅ Chemin heureux : acces aux options RGPD.
- ❌ Chemin d'erreur : utilisateur non autorise.

## 13. Dashboard Admin

### 13.1 Authentification admin

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Login admin avec email, mot de passe et TOTP. |
| Flux logique correct | ✅ | La session admin redirige vers `/dashboard`. |
| Textes cohérents | ⚠️ | Le bloc demo du login admin est en anglais et la credentielle differe de la doc de demo. |
| Cas d'erreur gérés | ✅ | TOTP invalide et erreurs login presentes. |

Problemes identifies :
- [MINEUR] La doc et l'UI ne donnent pas la meme paire d'identifiants demo.
- [MINEUR] Le bloc demo du login admin est en anglais (`Admin demo mode`).

Chemins testes :
- ✅ Chemin heureux : page de login admin accessible et fonctionnelle.
- ❌ Chemin d'erreur : TOTP faux -> message d'erreur.

### 13.2 Dashboard principal

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Dashboard, KPI jour, system health et alertes du jour sont en place. |
| Flux logique correct | ✅ | Les donnees seed et les widgets sont raccordes aux routes admin. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Etat de santé et alertes sont prevus. |

Problemes identifies :
- [MINEUR] Verifier une fois en runtime les cartes de health systeme sur le seed local.

Chemins testes :
- ✅ Chemin heureux : chargement du dashboard admin.
- ❌ Chemin d'erreur : backend/worker down -> alerte de sante.

### 13.3 Statistiques

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Graphiques et series temporelles sont presentes. |
| Flux logique correct | ✅ | Les compteurs sont alimentees par les donnees seed. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Toggling de periode et fallback graphique existent. |

Problemes identifies :
- [MINEUR] Revalider la correspondance exacte des chiffres seed a l'ouverture runtime.

Chemins testes :
- ✅ Chemin heureux : ouverture de la page stats.
- ❌ Chemin d'erreur : donnees vides -> graphique vide.

### 13.4 Gestion utilisateurs

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Listing, recherche, fiche, suspension et changement de plan existent. |
| Flux logique correct | ✅ | Les actions admin sont branchées sur les routes API. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Les actions sensibles sont proteges. |

Problemes identifies :
- [MINEUR] La suppression RGPD forcee doit rester reservee aux cas valides.

Chemins testes :
- ✅ Chemin heureux : recherche utilisateur et ouverture fiche.
- ❌ Chemin d'erreur : action admin hors droits.

### 13.5 Modération

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Signalements, conducteurs et enseignes sont couverts. |
| Flux logique correct | ✅ | Les actions de verification et rejet sont implantees. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Les changements de statut sont pris en charge. |

Problemes identifies :
- [MINEUR] Le remboursement simule doit etre relu si le rejet du badge conducteur est demo-critical.

Chemins testes :
- ✅ Chemin heureux : approbation d'un badge conducteur.
- ❌ Chemin d'erreur : rejet -> statut et remboursement simule.

### 13.6 Logs d'erreurs

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Page erreurs et filtres présents. |
| Flux logique correct | ✅ | Les routes admin rapportent les erreurs. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Filtres niveau/periode/route. |

Problemes identifies :
- [MINEUR] Aucune anomalie bloquante detectee.

Chemins testes :
- ✅ Chemin heureux : ouverture de la page logs.
- ❌ Chemin d'erreur : liste vide -> etat vide.

### 13.7 Rapport mensuel

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Rapport mensuel et exports PDF/CSV existent. |
| Flux logique correct | ✅ | Les endpoints d'export sont en place. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Les erreurs d'export devraient remonter proprement. |

Problemes identifies :
- [MINEUR] Les exports n'ont pas ete telecharges runtime dans cette passe.

Chemins testes :
- ✅ Chemin heureux : consultation du rapport.
- ❌ Chemin d'erreur : export indisponible -> erreur backend.

## 14. Notifications

### 14.1 Centre de notifications web

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Cloche, panel, read/unread et navigation sont implementes. |
| Flux logique correct | ✅ | Les notifications viennent de la route backend correspondante. |
| Textes cohérents | ⚠️ | Le bouton dit `Tout marquer lu` au lieu de `Tout marquer comme lu`. |
| Cas d'erreur gérés | ⚠️ | La route fallback est silencieuse si quelque chose manque, ce qui masque un potentiel souci. |

Problemes identifies :
- [MINEUR] Libelle du bouton a ameliorer.
- [MINEUR] Fallback silencieux sur fetch/mark read.

Chemins testes :
- ✅ Chemin heureux : ouverture du panel et lecture.
- ❌ Chemin d'erreur : route manquante -> panel vide silencieusement.

### 14.2 Notifications push mobile

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Prompt de permission et routing push mobile existent. |
| Flux logique correct | ✅ | Les notifications reorientent vers le bon ecran. |
| Textes cohérents | ⚠️ | Le bandeau demo mobile reste en anglais. |
| Cas d'erreur gérés | ⚠️ | Le comportement quand l'app est fermee ou en background doit etre revalide sur device. |

Problemes identifies :
- [SUGGESTION] Revalider l'ensemble des push mobile en vrai device.

Chemins testes :
- ✅ Chemin heureux : prompt de permission et routing.
- ⚠️ Chemin d'erreur : app fermee/non active a tester.

### 14.3 Préférences de notifications

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Page de preferences et toggle push/email presentes. |
| Flux logique correct | ✅ | Les pref sont sauvegardees. |
| Textes cohérents | ✅ | Cohérents. |
| Cas d'erreur gérés | ✅ | Les categories et alertes covoiturage sont gerables. |

Problemes identifies :
- [MINEUR] La sauvegarde des pref doit etre verifiee avec session refreshee.

Chemins testes :
- ✅ Chemin heureux : modifier les toggles.
- ❌ Chemin d'erreur : sauvegarde invalide -> erreur backend.

## 15. Cohérence des textes et de l'interface

### 15.1 Langue et orthographe

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | L'interface est majoritairement en francais. |
| Flux logique correct | ⚠️ | Oui globalement, mais plusieurs zones ont une langue/orthographe disparate. |
| Textes cohérents | ❌ | `Demo mode - no real payment will be charged`, `Admin demo mode`, `Evenements`, `Tout marquer lu`. |
| Cas d'erreur gérés | ✅ | Les messages d'erreur majeurs sont compréhensibles. |

Problemes identifies :
- [MINEUR] Anglais residuel dans les bannieres demo.
- [MINEUR] Accentuation insuffisante sur plusieurs labels.
- [BLOQUANT POUR LA CREDIBILITE DEMO] La doc demo et l'UI admin ne racontent pas la meme histoire sur le mot de passe admin.

Chemins testes :
- ✅ Chemin heureux : parcours principal francophone.
- ❌ Chemin d'erreur : lecture des banners demo et des docs contradictoires.

### 15.2 Cohérence des montants

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Les montants XPF et les conversions EUR sont presentes. |
| Flux logique correct | ✅ | Le taux de conversion est centralise. |
| Textes cohérents | ✅ | Les prix sont exposes clairement en XPF, avec EUR secondaire. |
| Cas d'erreur gérés | ✅ | Les calculs utilisent des entiers et valeurs fallback. |

Problemes identifies :
- [MINEUR] Rien de bloquant detecte sur les montants.

Chemins testes :
- ✅ Chemin heureux : affichage prix XPF/EUR.
- ❌ Chemin d'erreur : valeur vide -> fallback ou validation.

### 15.3 Cohérence des statuts

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Statuts annonces, abonnement, troc et moderation sont bien modelises. |
| Flux logique correct | ✅ | Les transitions de statut sont coherentes avec les routes backend. |
| Textes cohérents | ⚠️ | Le vocabulaire reste parfois technique ou varie entre modules. |
| Cas d'erreur gérés | ✅ | Statuts d'erreur et d'expiration sont geres. |

Problemes identifies :
- [MINEUR] Harmoniser les nuances entre `Actif`, `En cours de négociation`, `Expiré`, `Donné`.

Chemins testes :
- ✅ Chemin heureux : statuts affiches dans les cartes et panneaux.
- ❌ Chemin d'erreur : statut non reconnu -> fallback.

### 15.4 États vides

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Etats vides presentes sur les principaux feeds et listes. |
| Flux logique correct | ✅ | Les CTAs de sortie sont la. |
| Textes cohérents | ✅ | Les messages sont compréhensibles. |
| Cas d'erreur gérés | ✅ | Les empty states evitent un ecran mort. |

Problemes identifies :
- [MINEUR] Certains etats vides peuvent etre un peu trop neutres; un CTA plus incitatif serait utile.

Chemins testes :
- ✅ Chemin heureux : feed vide -> CTA.
- ❌ Chemin d'erreur : pas de données -> aucun ecran cassé.

### 15.5 Cohérence entre web et mobile

| Critère | Statut | Détail |
|---|---|---|
| Existe dans le code | ✅ | Les grandes fonctionnalités sont présentes sur les deux surfaces. |
| Flux logique correct | ⚠️ | Plusieurs flows sont homogènes, mais la demo banner et certains labels divergent. |
| Textes cohérents | ⚠️ | Web et mobile n'utilisent pas toujours les memes mots/accents. |
| Cas d'erreur gérés | ⚠️ | Les deux surfaces sont solides, mais des E2E croisées restent a faire. |

Problemes identifies :
- [MINEUR] `Evenements` et `Demo mode` cassent un peu l'uniformite web/mobile.
- [SUGGESTION] Rejouer au moins un parcours complet sur chaque surface avant la demo finale.

Chemins testes :
- ✅ Chemin heureux : accueil, annonces, troc, covoiturage, profil et messages existent sur web/mobile.
- ⚠️ Chemin d'erreur : differences de wording et d'UX a harmoniser.

## Fonctionnalités manquantes

- Les pages legales contiennent encore des placeholders visibles, donc le contenu juridique final n'est pas complet.
- Je n'ai pas trouve d'equivalent de toggle theme explicite et visible sur mobile comme sur le web.
- Plusieurs ecrans marquent encore des zones `TODO` pour les E2E, ce qui signifie que la couverture fonctionnelle est encore partiellement declarative.
- La route legacy `confidentialite` semble coexister avec `politique-de-confidentialite`, ce qui ressemble a un reliquat de migration.

## Fonctionnalités présentes dans l'UI mais potentiellement fragiles côté backend

- Le centre de notifications web est bien branche, mais son fallback silencieux peut masquer un probleme si la route ou le token manque.
- La publication, le boost et l'abonnement dependaient d'environnements de paiement reels hors demo; en demo, cela passe par un mode simule.
- Le parcours admin existe cote UI et cote API, mais la coherence des identifiants demo doit etre alignee avant presentation.

## Top 10 des problèmes les plus critiques

1. `DEMO.md` et l'UI admin ne donnent pas la meme credentielle demo admin.
2. `Demo mode - no real payment will be charged` est affiche en anglais sur le web.
3. `Admin demo mode` est affiche en anglais dans le login admin.
4. `Evenements` est ecrit sans accent dans plusieurs menus et ecrans.
5. Les pages legales affichent encore des placeholders `[À COMPLÉTER]`.
6. Le fichier `.env.demo` contient un hash bcrypt avec `$...` qui provoque des warnings d'interpolation si on l'utilise tel quel avec Docker Compose.
7. Le bouton du centre de notifications dit `Tout marquer lu` au lieu de `Tout marquer comme lu`.
8. Certains parcours mobiles (theme, gestuelles swipe, push arriere-plan) demandent encore une validation device complete.
9. Plusieurs zones du code portent encore des `TODO` E2E, ce qui signale des parcours non couverts en runtime.
10. La coexistence de routes legales proches (`confidentialite` vs `politique-de-confidentialite`) peut creer de la dette de maintenance.

## Top 5 des incohérences de texte

1. `DEMO.md` annonce `admin1234` alors que l'UI demo admin affiche `Demo1234!` pour le compte demo ou `admin1234` pour le back-office selon l'ecran.
2. `Demo mode - no real payment will be charged` sur la bannière web.
3. `Admin demo mode` sur la page de login admin.
4. `Evenements` sans accent dans le header web et des ecrans mobiles.
5. `Tout marquer lu` dans le centre de notifications.

## Verdict final

🟡 PRÊTE AVEC RÉSERVES - la demo est fonctionnelle et les gros parcours existent, mais il reste quelques incohérences visibles, des placeholders dans le juridique, et un risque technique a corriger si vous utilisez `.env.demo` avec Docker Compose avant de viser un deploiement plus propre.

## Plan d'action priorisé

### P0 - A corriger avant une demo publique ou un déploiement

| Priorité | Action | Pourquoi maintenant | Definition de fini |
|---|---|---|---|
| P0 | Aligner les identifiants demo admin entre `DEMO.md`, le login admin et les autres écrans demo. | C'est la contradiction la plus visible et la plus risquee pour la credibilite de la demo. | Une seule source de verite pour le compte admin demo, documentee et affichee partout de la meme facon. |
| P0 | Remplacer les textes anglais de demo par du francais. | La demo est principalement francophone; le contraste saute aux yeux. | Bannière web, bannière mobile et login admin 100 % francais. |
| P0 | Supprimer ou remplir les placeholders visibles dans les pages legales. | Les pages legales en brouillon donnent une impression de produit non finalise. | Aucun `[À COMPLÉTER]` ou `[À VALIDER JURISTE]` visible sur les pages publiques. |
| P0 | Verifier l'usage de `.env.demo` avec Docker Compose ou documenter explicitement la limitation. | Le hash bcrypt avec `$...` peut casser l'interpolation Compose. | Soit les variables sont escapees/citees correctement, soit le workflow demo n'utilise plus Compose sur ce fichier. |

### P1 - A faire avant le prochain push GitHub ou avant un déploiement propre

| Priorité | Action | Pourquoi maintenant | Definition de fini |
|---|---|---|---|
| P1 | Harmoniser toute la microcopy visible: `Evenements`, `Tout marquer lu`, accents et formulations. | Ce sont des irritants visibles, faciles à corriger et très perceptibles en démo. | Les menus, boutons et bannières principales sont uniformes et orthographiés correctement. |
| P1 | Faire un passage E2E sur les parcours clés: inscription, verification telephone, publication annonce, Troc, covoiturage, messages, abonnement, bons plans, admin. | Les TODO E2E signalent des zones non rejouées en runtime. | Les parcours critiques sont rejoués et les points de rupture sont documentés ou corrigés. |
| P1 | Revalider la cohérence web/mobile sur au moins un parcours complet par surface. | Les deux plateformes sont présentes, mais leur wording et certains comportements divergent. | Un runbook simple prouve qu'un parcours identique fonctionne sur web et mobile. |
| P1 | Revalider le login admin et le dashboard avec les données seed locales. | La partie admin est sensible et souvent montrée pendant une démo. | Connexion, dashboard, modération et stats vérifiées sur une session fraîche. |

### P2 - Améliorations de confort et de robustesse

| Priorité | Action | Pourquoi maintenant | Definition de fini |
|---|---|---|---|
| P2 | Rendre les fallbacks d'erreur plus explicites, notamment pour les notifications. | Le fallback silencieux peut masquer un bug. | Les échecs affichent un message de secours ou un état vide explicitement distingué. |
| P2 | Ajouter un test visuel mobile 390px dédié aux menus, drawers et bannières. | La plupart des problèmes d'ergonomie se voient sur petit écran. | Capture/validation de 390px pour l'accueil, la navigation et les formulaires. |
| P2 | Harmoniser les statuts et les badges entre modules. | Le vocabulaire produit sera plus lisible pour les utilisateurs. | Les états `Actif`, `Expiré`, `Donné`, `En négociation` sont uniformes partout. |
| P2 | Clarifier le statut `frontend only` des calculateurs et helpers purement UI. | Evite les confusions pendant les démos et les tickets support. | Les pages concernées l'indiquent explicitement dans l'UI ou la doc interne. |

## Ordre d'exécution recommandé

1. Corriger le bloc P0.
2. Refaire une passe rapide de QA textuelle et de navigation.
3. Exécuter le P1 sur les parcours les plus visibles en démo.
4. Garder le P2 pour la stabilisation et le confort d'usage.

## Livrable attendu après correction

- Une demo cohérente en francais de bout en bout.
- Un seul set de comptes demo documente et affiche.
- Des pages legales sans brouillons.
- Un chemin Docker Compose documenté ou explicitement écarté pour la demo locale.
- Un runbook de validation simple avant push GitHub.
