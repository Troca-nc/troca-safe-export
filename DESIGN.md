# KALICO NC - Design System & Gouvernance visuelle

Ce document est la reference visuelle du projet Kalico NC.
Tout changement visuel futur doit s y conformer.

## 1. Identite de marque

### Positionnement
Kalico est la marketplace de proximite de Nouvelle-Caledonie.
Le visuel doit rester chaleureux, local, de confiance et professionnel, sans devenir corporatif.

### Devise officielle
"Nouvelle-Calédonie dans l'âme, Kalico dans la poche."

Usage : footer, pages d'auth (inscription, connexion), page Pro, matériel de communication B2B.
Ne pas modifier, ne pas tronquer.
Ne pas traduire.

### Anti-patterns a eviter
- froid
- generique
- trop sombre
- trop flashy
- style "site IA"
- jargon technique visible

### Voix et ton des textes
- Pas de tiret cadratin dans les textes visibles
- Phrases courtes
- Ancrage geographique explicite : NC, Noumea, communes, provinces, ile, archipel
- Un seul pronom de traitement a definir pour toute l app : TODO: choisir entre tutoiement ou vouvoiement et harmoniser partout
- Pas de jargon technique visible cote utilisateur

---

## 2. Design tokens

### 2.1 Palette de couleurs

Les couleurs ci-dessous viennent de `frontend/src/app/globals.css` et de `frontend/tailwind.config.js`.

| Token | Valeur light | Valeur dark / override | Role semantique | Contraste approx sur fond blanc |
|---|---:|---:|---|---:|
| `--coral` | `#0a7ea4` | identique | CTA principal, accents d action | ~4.6:1 |
| `--ocean` | `#08324f` | identique | fond profond, hover accent | ~12:1 |
| `--lagoon` | `#48cae4` | identique | accent info, decoration | ~1.8:1, pas pour texte courant |
| `--sand` | `#f4f8f7` | identique | fond secondaire, surface douce | ~1:1, couleur de fond |
| `--jungle` | `#2d6a4f` | identique | success secondaire, eco, confiance | ~6:1 |
| `--night` | `#082032` | identique | texte principal et fond profond | ~15:1 |
| `--color-background-primary` | `#fbfcfc` | `#04121e` | fond de base de page | ~1:1 |
| `--color-background-secondary` | `#f4f8f7` | `#082032` | fond de surface secondaire | ~1:1 |
| `--color-bg-page` | `#f4f8f7` | `#04121e` | fond global des pages | ~1:1 |
| `--color-surface` | `#fbfcfc` | `#04121e` | fond de carte / surface | ~1:1 |
| `--color-surface-raised` | `#ffffff` | `#082032` | cartes elevées, panneaux | ~1:1 |
| `--color-border` | `rgba(8, 32, 50, 0.1)` | `rgba(255, 255, 255, 0.1)` | bordure standard | n/a |
| `--color-border-secondary` | `rgba(8, 32, 50, 0.1)` | `rgba(255, 255, 255, 0.1)` | bordure secondaire | n/a |
| `--color-border-strong` | `rgba(10, 126, 164, 0.26)` | `rgba(72, 202, 228, 0.28)` | bordure active / focus visuel | n/a |
| `--color-text-primary` | `#082032` | `#f7fbfc` | texte principal | ~15:1 |
| `--color-text-secondary` | `rgba(8, 32, 50, 0.72)` | `rgba(247, 251, 252, 0.72)` | texte secondaire | ~8:1 |
| `--color-text-tertiary` | `rgba(8, 32, 50, 0.46)` | `rgba(247, 251, 252, 0.48)` | meta, aide, labels faibles | ~4:1 |
| `--color-success` | `#2d6a4f` | `#4ade80` | success, confirmation | ~6:1 |
| `--color-warning` | `#d97706` | `#f59e0b` | alerte, attention | ~3.8:1 |
| `--color-danger` | `#d7263d` | `#f87171` | erreur, suppression, validation negative | ~4.9:1 |
| `--color-info` | `#0a7ea4` | `#48cae4` | information, lien d accent | ~4.6:1 |
| `--nc-lagon` | `#1e90ff` | identique | badge eau / mer / visuel secondaire | ~3.2:1, plutot decoration |
| `--nc-lagon-light` | `rgba(30, 144, 255, 0.08)` | identique | fond de badge / chip lagon | n/a |
| `--nc-lagon-border` | `rgba(30, 144, 255, 0.25)` | identique | bordure badge lagon | n/a |
| `--nc-lagon-text` | `#0a4d8c` | identique | texte badge lagon | ~7.5:1 |
| `--nc-emeraude` | `#2e8b57` | identique | badge nature / pro / confiance | ~5.6:1 |
| `--nc-emeraude-light` | `rgba(46, 139, 87, 0.08)` | identique | fond de badge emeraude | n/a |
| `--nc-emeraude-border` | `rgba(46, 139, 87, 0.25)` | identique | bordure badge emeraude | n/a |
| `--nc-emeraude-text` | `#1a5233` | identique | texte badge emeraude | ~10:1 |
| `--nc-corail` | `#ff6b6b` | identique | badge alerte douce / accent secondaire | ~2.7:1, decoration |
| `--nc-corail-light` | `rgba(255, 107, 107, 0.08)` | identique | fond de badge corail | n/a |
| `--nc-corail-border` | `rgba(255, 107, 107, 0.25)` | identique | bordure badge corail | n/a |
| `--nc-corail-text` | `#8b0000` | identique | texte badge corail | ~9:1 |
| `--nc-sable` | `#f5a623` | identique | badge bons plans / vente douce | ~2.2:1, decoration |
| `--nc-sable-light` | `rgba(245, 166, 35, 0.08)` | identique | fond de badge sable | n/a |
| `--nc-sable-border` | `rgba(245, 166, 35, 0.25)` | identique | bordure badge sable | n/a |
| `--nc-sable-text` | `#7a4800` | identique | texte badge sable | ~8:1 |

### Tokens de theme et de compatibilite
- `html[data-theme='dark']` est la reference canonique pour le theme sombre.
- Les aliases `.dark ...` restent actifs comme compatibilite.
- Les classes Tailwind suivantes sont remapees dans `globals.css` pour respecter le theme :
  - `.bg-white`
  - `.bg-white/*`
  - `.bg-sand`
  - `.bg-sand/*`
  - `.text-night`
  - `.text-night/*`
  - `.border-night/*`

### Typographie

Fichiers de reference :
- `frontend/src/app/globals.css`
- `frontend/tailwind.config.js`

Familles :
- `font-display` : titres, heroes, cartes editorialisées
- `font-body` : texte courant, formulaires, navigation
- `font-mono` : codes, donnees techniques, tokens ou diagnostics

Echelle recommandee :

| Niveau | Classe / usage |
|---|---|
| H1 hero | `font-display text-5xl md:text-6xl font-bold leading-[1.05]` |
| H2 section | `font-display text-4xl md:text-5xl font-bold leading-tight` |
| H3 carte | `font-display text-2xl md:text-3xl font-bold leading-tight` |
| H4 / sous-titre | `font-display text-xl font-semibold leading-tight` |
| Body large | `text-lg leading-7` |
| Body standard | `text-base leading-6` |
| Body small | `text-sm leading-5` |
| Caption / meta | `text-xs leading-4` |
| Micro / badge | `text-[10px]` ou `text-[11px]` reserve aux pills et metadonnees |

Poids autorises et usages :
- `font-normal` : texte courant
- `font-medium` : labels, metas, liens secondaires
- `font-semibold` : boutons, titres de carte, badges
- `font-bold` : titres, chiffres clés, pricing

### Espacements

Grille de base : 8pt.

Valeurs autorisees et classes Tailwind usuelles :
- 4px : `p-1`, `m-1`, `gap-1`
- 8px : `p-2`, `m-2`, `gap-2`
- 12px : `p-3`, `m-3`, `gap-3`
- 16px : `p-4`, `m-4`, `gap-4`
- 24px : `p-6`, `m-6`, `gap-6`
- 32px : `p-8`, `m-8`, `gap-8`
- 48px : `p-12`, `m-12`, `gap-12`
- 64px : `p-16`, `m-16`, `gap-16`

Regle :
- toute valeur hors grille doit etre justifiee
- les ecarts ponctuels visibles dans le projet sont surtout :
  - `gap-1.5`
  - `gap-2.5`
  - `gap-3.5`
  - `px-5`
  - `py-7`
  - `pl-9`
  - `mt-[-1rem]`
  - `max-w-[...]`
  - `w-[...]`
  - `h-[...]`

### Rayons de bordure

Le projet n a pas de variable CSS dedicatee pour le radius. Les conventions observables sont :
- cards standards : `rounded-xl` ou `rounded-2xl`
- cartes marketing / hero : `rounded-[1.25rem]` ou `rounded-[1.5rem]`
- inputs et boutons : `rounded-md`
- pills et badges : `rounded-full`
- modales / panneaux denses : `rounded-2xl`

Regles :
- card = rayon doux mais pas circulaire
- button = rayon leger, lisible, tactile
- pill = `rounded-full`
- input = rayon de controle standard, pas de gros arrondi de carte

### Transitions et animations

Durations observees / recommandees :
- interactions : `150ms`
- hover card : `250ms`
- modales et panneaux : `300ms`
- fade-in marketing : `400ms`
- pulse one-shot : `520ms`

Easing recommande :
- `ease-out`
- ou `cubic-bezier(0.16, 1, 0.3, 1)` pour les entrees de panneaux

Regle :
- pas d animation superieure a `400ms` sans justification UX
- `prefers-reduced-motion` doit toujours etre respecte

---

## 3. Catalogue des composants

### Boutons

Reference centrale :
- `frontend/src/app/globals.css`

Variantes :

| Classe | Usage | Couleurs / etats |
|---|---|---|
| `.btn-primary` | action principale, validation, CTA | fond `--coral`, texte blanc, hover `--ocean`, disabled opacity 50 |
| `.btn-secondary` | action secondaire / neutre | bordure `--color-border-strong`, texte `--color-text-primary`, hover fond subtil |
| `.btn-ghost` | action discrète / lien bouton | texte `--coral`, hover fond subtil |
| `.btn-danger` | suppression, desactivation, action destructive | fond `--color-danger`, texte blanc |

Regle :
- ne jamais fabriquer un bouton inline avec des classes Tailwind ad hoc si la variante globale existe deja
- si une nouvelle variante est necessaire, l ajouter dans `globals.css` avant usage

### Inputs

Reference centrale :
- `frontend/src/app/globals.css`

Classes :
- `.input`
- `.field-label`
- `.field-help`
- `.field-error`
- `.field-success`

Etats :
- default : surface `--color-surface-raised`, bordure `--color-border`
- focus : bordure `--coral`
- error : `--color-danger`
- success : `--color-success`
- disabled : a expliciter au cas par cas, via `opacity` et `cursor-not-allowed`

Regle :
- les erreurs utilisent `--color-danger`, pas `red-500` ou `red-50` generiques

### Cards d annonce - `ListingCard`

Fichier :
- `frontend/src/components/listings/ListingCard.tsx`

Tokens et regles :
- fond de carte : `bg-white/96` dans le composant, a harmoniser avec `--color-surface-raised` si refonte
- bordure : `border-night/10` + bordure accent a gauche selon type
- ombre : `shadow-sm` + `shadow-card` via classe globale
- image : `bg-sand` + fallback image / `ListingImage`
- titres : `text-night`, `font-medium`
- prix : `text-night`, `font-bold`
- meta : `text-night/55` et chips en badges globaux

Regle :
- hover subtil seulement, pas d effet carte flottante agressif
- les badges de categorie et de statut doivent passer par `badge-*` quand possible

### Badges et pills

Reference :
- `frontend/src/app/globals.css`

Variantes existantes :
- `.badge`
- `.badge-primary`
- `.badge-success`
- `.badge-info`
- `.badge-warning`
- `.badge-danger`
- `.badge-muted`
- `.badge-lagon`
- `.badge-emeraude`
- `.badge-corail`
- `.badge-sable`

Regle :
- ne pas creer de badge inline avec `bg-emerald-50` ou equivalent si une variante badge existe
- le badge doit rester compact, lisible, et sans surcharge visuelle

### Etats vides

Composant de reference unique :
- `frontend/src/components/ui/EmptyStates.tsx`

Variantes :
- search
- messages
- favoris
- annonces
- notifications
- generic

Regle :
- ne pas inventer d etat vide ad hoc dans une page si la variante manque, il faut d abord enrichir `EmptyStates.tsx`

### Toasts et notifications

Composants :
- `frontend/src/components/ui/ToastCenter.tsx`
- `frontend/src/components/onboarding/OnboardingToast.tsx`
- `frontend/src/components/ui/NotificationBell.tsx`

Regles communes :
- position flottante, ne doit pas bloquer la navigation
- apparition douce, disparition automatique ou explicite
- info / success / error doivent reprendre la palette du projet

### Modales

Il n y a pas de primitive unique de modal dans `components/ui/`.

Composants metier qui jouent un role de modal / panneau :
- `AuthRequiredModal`
- `BoostModal`
- `ProBookingModal`
- `SearchAlertModal`
- `RideReviewModal`
- `PassengerProfileModal`
- `TrocProposalModal`
- `PaymentFailureBanner` est un bandeau, pas une modal

Regles communes a respecter :
- backdrop sombre et discret
- rayon de bordure proche de `rounded-2xl`
- surface sur `--color-surface-raised`
- padding lisible, jamais serre
- z-index au-dessus du contenu applicatif

### Autres composants UI reutilisables notables

- `frontend/src/components/ui/DemoModeSwitcher.tsx`
- `frontend/src/components/ui/FeedbackAlert.tsx`
- `frontend/src/components/ui/ProfileDemoPreview.tsx`
- `frontend/src/components/ui/SearchAutocomplete.tsx`
- `frontend/src/components/ui/ThemeToggle.tsx`
- `frontend/src/components/ui/PdfViewer.tsx`

---

## 4. Heuristiques Nielsen - checklist par page

L evaluation ci-dessous est basee sur le code, pas sur une visite manuelle du site.

### Home `/`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ⚠️ Partiel
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ✅ Respecte
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ⚠️ Partiel
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ⚠️ Partiel
10. Aide et documentation - ⚠️ Partiel

### Inscription `/inscription`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ⚠️ Partiel
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ✅ Respecte
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ⚠️ Partiel
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ✅ Respecte
10. Aide et documentation - ⚠️ Partiel

### Connexion `/connexion`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ✅ Respecte
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ✅ Respecte
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ✅ Respecte
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ✅ Respecte
10. Aide et documentation - ⚠️ Partiel

### Dépôt d annonce `/annonces/nouvelle`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ✅ Respecte
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ⚠️ Partiel
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ⚠️ Partiel
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ✅ Respecte
10. Aide et documentation - ⚠️ Partiel

### Détail annonce `/annonces/[id]`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ✅ Respecte
4. Cohérence et standards - ✅ Respecte
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ⚠️ Partiel
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ✅ Respecte
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ⚠️ Partiel
10. Aide et documentation - ⚠️ Partiel

### Profil `/profil`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ✅ Respecte
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ✅ Respecte
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ⚠️ Partiel
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ✅ Respecte
10. Aide et documentation - ⚠️ Partiel

---

## 5. Dette technique visuelle priorisee

Basee sur l audit du frontend.

| Fichier | Probleme | Type | Priorite | Effort |
|---|---|---|---|---|
| `frontend/src/components/home/HomeSections.tsx` | Fond hero et nombreuses couleurs codees en dur | couleur-dure | P0 | L |
| `frontend/src/components/home/HomeSections.tsx` | Espacements et tailles non homogenes | spacing | P0 | L |
| `frontend/src/app/pro/ProLandingPageClient.tsx` | Palette tres codee en dur, peu tokenisee | couleur-dure | P1 | L |
| `frontend/src/components/auth/AuthMapPanel.tsx` | Couleurs et surfaces trop specifiques | couleur-dure | P1 | M |
| `frontend/src/components/share/ShareSheet.tsx` | Couleurs de fond et bordures non standard | couleur-dure | P1 | M |
| `frontend/src/components/annonces/AnnoncesMap.tsx` | Styles carte et overlay peu alignes sur les tokens | couleur-dure | P1 | M |
| `frontend/src/app/pro/dashboard/parametres/page.tsx` | Couleurs/alertes peu harmonisees | couleur-dure | P1 | M |
| `frontend/src/app/evenements/page.tsx` | Palette encore tres generique | couleur-dure | P1 | M |
| `frontend/src/app/fret/page.tsx` | Mix de tokens et couleurs sémantiques | couleur-dure | P1 | M |
| `frontend/src/app/covoiturage/page.tsx` | Sections encore heterogenes en couleur | couleur-dure | P1 | M |
| `frontend/src/app/annonces/page.tsx` | Quelques gradients et couleurs d anciennes generations | couleur-dure | P1 | M |
| `frontend/src/app/inscription/page.tsx` | Quelques gradients inline et alertes semantic Tailwind | couleur-dure | P1 | M |
| `frontend/src/components/layout/Header.tsx` | Valeurs fixes de largeur/hauteur et safe area | spacing | P0 | M |
| `frontend/src/components/ui/SearchAutocomplete.tsx` | Largeurs et espacements fixes, spinner local | spacing | P2 | S |
| `frontend/src/components/ui/ProfileDemoPreview.tsx` | Cards tres denses et tailles fixes | spacing | P2 | M |
| `frontend/src/components/ui/EmptyStates.tsx` | Certains textes et libelles encore incomplets / encodage | encodage | P2 | S |
| `frontend/src/components/ui/ToastCenter.tsx` | Couleurs hardcodées pour les tons de toasts | couleur-dure | P2 | S |
| `frontend/src/components/ui/NotificationBell.tsx` | Couleurs d alertes et load state en palettes generiques | couleur-dure | P2 | S |
| `frontend/src/components/home/CategoryGridSection.tsx` | Anciennes versions avaient des couleurs durcies, maintenant alignee | token-manquant | P2 | XS |
| `frontend/src/app/connexion/ConnexionClient.tsx` | Styles globaux encore majoritairement light-only | responsive | P2 | S |
| `frontend/src/app/annonces/nouvelle/page.tsx` | Panneau lateral avec gradient inline durci | couleur-dure | P1 | S |

Types de dette :
- encodage
- couleur-dure
- spacing
- token-manquant
- responsive
- accessibilite

---

## 6. Gouvernance - process de modification visuelle

### Regle d or
Toute modification visuelle doit passer par les tokens de ce document.
Si un token manque, il faut l ajouter ici avant de l utiliser dans le code.

### Checklist PR visuelle
- [ ] Aucune couleur hex codee en dur hors tokens definis ici
- [ ] Aucune taille de police hors echelle typographique
- [ ] Aucun espacement hors grille 8pt ou justifie
- [ ] Dark mode teste pour les composants modifies
- [ ] Contraste WCAG verifie pour les nouvelles couleurs
- [ ] Aucun tiret cadratin dans les textes visibles
- [ ] Build Next.js passe sans erreur
- [ ] Heuristiques Nielsen non regressees

### Qui valide
Toute modification de ce fichier doit etre validee par le fondateur, Leo, avant merge.

---

## 7. Direction visuelle - decisions produit

### Cards d annonces - systeme deux niveaux

#### NIVEAU 1 - Card standard (annonces gratuites)
Style de reference : Leboncoin
- Layout : photo a gauche ou en haut + infos texte sous / a droite
- Degradation gracieuse : lisible meme sans photo, avec fallback initiale categorie sur `--color-surface-raised`
- Optimise connexion lente : pas d image bloquante, skeleton immediate
- Tokens : `bg-white`, `border` sur `var(--color-border)`, `text-night`, prix en `coral`
- Hover : `translateY(-2px)` + box-shadow legere, transition 150ms

#### NIVEAU 2 - Card mise en avant (annonces boostees / payantes)
Style de reference : Wallapop / Vinted
- Layout : photo plein format, ratio 4:3, prix en overlay bas gauche sur degradé sombre
- Badge `A la une` ou `Pro` en haut a droite
- Hover : `scale(1.02)` + shadow plus prononcee, transition 200ms
- Tokens : overlay `rgba(0,0,0,0.45)` sur photo, prix en blanc, badge coral

Regle :
- ne jamais utiliser le style niveau 2 pour une annonce gratuite
- le niveau est defini par un champ `boosted` ou `featured` dans les donnees

### Sections vides - CTA stimulant

Remplacer tous les etats vides passifs par un CTA actif.

Structure :
- Icone animee avec pulse subtil, 2s loop, opacity 0.6 -> 1 -> 0.6
- Titre court en `font-display`, accrocheur, ancre NC
- Sous-titre court, maximum 10 mots
- Bouton `btn-primary`

Exemples de copywriting par section :
- Promotions : "La premiere promo NC, c est la votre." / CTA "Publier une offre"
- Culture : "Le prochain evenement NC merite d etre ici." / CTA "Creer un evenement"
- Covoiturage : "Le premier trajet, c est souvent le plus utile." / CTA "Proposer un trajet"
- Troc : "Le troc, c est dans l ADN caledonien." / CTA "Proposer un echange"

Regle :
- aucun texte de type "Aucun X pour le moment" ne doit rester visible pour l utilisateur
- toujours remplacer par un CTA

### Micro-interactions - niveau modere

Transitions standard :
- Interactions UI : 150ms ease-out
- Apparition de modales et drawers : 250ms ease-out
- Animations decoratives : 300-400ms

Animations autorisees :
- Cards : `translateY(-2px)` au hover + box-shadow
- Sections au scroll : fade-in + `translateY(16px -> 0)`, une seule fois, via `IntersectionObserver`
- CTA sections vides : pulse sur l icone, sur l opacite
- Boutons : `scale(0.97)` au clic, pour un feedback tactile

Animations interdites :
- Parallaxe, pour raison de performance sur connexion lente
- Animations > 400ms sur elements fonctionnels
- Auto-play video ou GIF sans controle utilisateur
- Spinner infini sans timeout, max 8s puis message d erreur

Regle accessibilite :
- toute animation doit etre desactivee si `prefers-reduced-motion: reduce` est actif
- CSS cible :
  - `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`

### Performance et degradation gracieuse

Priorite connexion lente, contexte Nouvelle-Caledonie :
- toute image doit avoir un skeleton ou fallback immediat
- pas de police bloquante : `font-display: swap` sur toutes les polices custom
- les sections de la home se chargent independamment, sans waterfall bloquant
- images : lazy loading par defaut, `priority` uniquement sur les 2 premieres cards hero

---

## 8. Principes visuels de reference

### Lois UX appliquees a Kalico

Loi de Fitts : boutons CTA min 44x44px sur mobile, positionnes dans la zone de confort du pouce (bas de l ecran, pas de CTA principal en haut).

Loi de Hick : max 5 choix visibles simultanement dans un formulaire ou un menu. Au-dela, paginer ou grouper.

Loi de Miller : max 7 categories visibles dans un menu ou une grille sans scroll.

Loi de Jakob : s aligner sur les conventions des marketplaces connues (Leboncoin, Vinted) pour les patterns de navigation et de publication.

### Principes Gestalt appliques

Proximite : espacement interne card 12px, espacement entre cards 16px minimum.

Similarite : tous les boutons primaires identiques, tous les prix en coral, toutes les localisations en text-tertiary.

Continuite : grille alignee sur 8pt, pas d elements flottants sans ancrage visuel.

### Emotion Design - 3 niveaux Kalico

Visceral (0-50ms) : fond creme #fdf8f1, pirogue logo, palette NC orange/turquoise. Objectif : chaleur et appartenance immediate.

Comportemental : micro-interactions moderees, transitions 150ms, feedback tactile sur les clics. Objectif : fluidite et confiance.

Reflexif : copywriting ancre NC, "Ce qui se vend en NC, c est ici", sections localisees (Noumea, Loyautes, communes). Objectif : attachement a la marque locale.

### Metriques WCAG 2.1

Contraste texte normal : min 4.5:1

Contraste grands titres : min 3:1

Zone cliquable mobile : min 44x44px

Animations : desactivees si prefers-reduced-motion

Ratios actuels Kalico :
- #e8832a (coral) sur blanc : ~3.2:1 -> acceptable pour titres, insuffisant pour texte courant -> compenser en augmentant la taille ou le poids
- #1d9e75 (emeraude) sur blanc : ~4.6:1 -> conforme
- #1a2e25 (night) sur blanc : ~13:1 -> excellent

## 9. Rappels operationnels

- `html[data-theme='dark']` est la source de verite pour le dark mode.
- Les composants de base doivent utiliser les tokens et les classes globales avant les couleurs utilitaires locales.
- Les etats vides doivent passer par `EmptyStates.tsx` autant que possible.
- Les notifications doivent passer par `ToastCenter.tsx` ou un composant dedie clairement documente.
- Les composants de hero et de home restent les plus sensibles au design system.
