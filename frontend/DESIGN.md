# Kalico NC — Design System

Version 2.0 · Août 2026

Marketplace de petites annonces pour la Nouvelle-Calédonie.
Devise : *Nouvelle-Calédonie dans l'âme, Kalico dans la poche.*

Ce document est la source de vérité visuelle. Il remplace les valeurs
dispersées entre `tailwind.config.js`, `globals.css` et les composants.
Toute couleur, taille ou rayon absent de ce document ne doit pas apparaître
dans le code.

---

## 0. Principes

1. **Crème partout.** Aucun blanc pur en light mode. Le fond de page est
   `#FBF6EC`, les cartes `#FEFAF3`. La chaleur vient du fond, pas des accents.
2. **Une couleur, un rôle.** Flamboyant pour l'action et la marque, lagon pour
   le factuel, vert pour la confiance. Une quatrième teinte n'entre dans le
   système que si un rôle nouveau apparaît.
3. **Serif pour les titres seulement.** Instrument Serif au-dessus de 22 px, et
   pour les prix. Tout le reste en IBM Plex Sans.
4. **Le local par la matière.** Crème, tressage diagonal, pétrole chaud. Pas de
   fleur d'hibiscus, pas de palmier, pas de carte de la Grande Terre en fond.
5. **La confiance se hiérarchise.** Un seul badge vendeur visible sur une carte,
   le reste sur la fiche. Onze signaux affichés ensemble n'rassurent pas.

La palette est dérivée du logo `kalico1.svg` : la voile-feuille de la pirogue
va de l'orange en tête au turquoise, la coque est en pétrole chaud.

---

## 1. Palette de couleurs

### 1.1 Tokens

```css
:root {
  /* — Marque & action — */
  --color-accent:            #E8832A; /* flamboyant : surfaces, aplats, gros display */
  --color-accent-strong:     #A94F0A; /* fond de bouton plein + texte crème */
  --color-accent-text:       #9E4E06; /* texte orange sur crème (chapeaux, liens) */
  --color-accent-soft:       rgba(232,131,42,.14); /* fond de badge, pastille catégorie */
  --color-accent-border:     rgba(232,131,42,.34);

  /* — Texte & structure — */
  --color-text:              #123A44; /* coque de la pirogue : texte principal */
  --color-text-muted:        rgba(18,58,68,.68);
  --color-text-subtle:       rgba(18,58,68,.55);
  --color-text-faint:        rgba(18,58,68,.42); /* placeholders uniquement */
  --color-deep:              #0E2A31; /* récif profond : bandeaux, footer, dark */

  /* — Fonds — */
  --color-bg:                #FBF6EC; /* crème : fond de page */
  --color-surface:           #FEFAF3; /* cartes posées sur le crème */
  --color-surface-sunken:    #F3E9D8; /* sable : creux, champs, placeholders image */
  --color-border:            #E4D7C3; /* bordure standard */
  --color-border-inner:      #EFE3D0; /* séparateur interne de carte */
  --color-border-strong:     #123A44; /* bordure active / focus */

  /* — Information (lagon) — */
  --color-info:              #55ADB3; /* icônes décoratives, pastilles */
  --color-info-text:         #2E7B84; /* texte et icônes porteuses de sens */
  --color-info-soft:         rgba(85,173,179,.14);
  --color-info-border:       rgba(85,173,179,.32);

  /* — Confiance / succès (voile verte) — */
  --color-success:           #6E9A6A;
  --color-success-text:      #3F6B3C;
  --color-success-soft:      rgba(110,154,106,.14);
  --color-success-border:    rgba(110,154,106,.30);

  /* — Alerte — */
  --color-warning:           #B85C00; /* échéance proche, stock faible (≥16px 600) */
  --color-warning-soft:      rgba(184,92,0,.14);
  --color-error:             #B0431C;
  --color-error-soft:        rgba(176,67,28,.14);

  /* — Dark mode / sur récif — */
  --color-on-deep:           #FBF6EC;
  --color-on-deep-muted:     rgba(251,246,236,.72);
  --color-on-deep-subtle:    rgba(251,246,236,.45);
  --color-on-deep-border:    rgba(251,246,236,.16);
  --color-success-on-deep:   #9FC79B;
}
```

### 1.2 Extension Tailwind

```js
// tailwind.config.js — colors
colors: {
  accent:   { DEFAULT: '#E8832A', strong: '#A94F0A', text: '#9E4E06' },
  ink:      { DEFAULT: '#123A44', deep: '#0E2A31' },
  cream:    { DEFAULT: '#FBF6EC', surface: '#FEFAF3', sunken: '#F3E9D8' },
  sand:     { DEFAULT: '#E4D7C3', inner: '#EFE3D0' },
  lagoon:   { DEFAULT: '#55ADB3', text: '#2E7B84' },
  reef:     { DEFAULT: '#6E9A6A', text: '#3F6B3C' },
  alert:    { warn: '#B85C00', error: '#B0431C' },
}
```

### 1.3 Règles d'utilisation

| Besoin | Token | Interdit |
| --- | --- | --- |
| Bouton principal | fond `--color-accent-strong`, texte `--color-surface` | fond `#E8832A` avec texte clair |
| Chapeau de section, petit texte orange | `--color-accent-text` | `#E8832A`, `#B85C00` |
| Aplat orange décoratif, badge « à la une » | `--color-accent` + texte `--color-deep` | texte crème sur `#E8832A` |
| Lien, localisation, délai de réponse | `--color-info-text` | `#55ADB3` en texte |
| Icône lagon décorative à côté d'un texte lisible | `--color-info` | icône seule porteuse de sens |
| Vérifié, en ligne, gratuit, don | `--color-success-text` sur `--color-success-soft` | `--color-success` en texte |
| Prix | `--color-text` en Instrument Serif | prix en bleu ou en orange |
| Texte sur bandeau sombre | `--color-on-deep` | opacité < .45 |

**Une seule couleur d'accent par bloc.** Un chapeau orange + un badge vert +
une note orange dans la même carte : choisir.

### 1.4 Contrastes WCAG (calculés)

| Premier plan | Fond | Ratio | Verdict |
| --- | --- | --- | --- |
| `#123A44` | `#FBF6EC` | **11,3:1** | AAA — texte principal |
| `#123A44` | `#FEFAF3` | **11,7:1** | AAA — texte sur carte |
| `#123A44` | `#F3E9D8` | **10,3:1** | AAA |
| `rgba(18,58,68,.68)` | `#FBF6EC` | **6,3:1** | AA — texte secondaire |
| `rgba(18,58,68,.55)` | `#FBF6EC` | **4,6:1** | AA — métadonnées ≥13 px |
| `rgba(18,58,68,.42)` | `#FEFAF3` | **3,2:1** | Placeholders uniquement |
| `#9E4E06` | `#FBF6EC` | **5,5:1** | AA — chapeaux, liens orange |
| `#B85C00` | `#FBF6EC` | **4,1:1** | ⚠ AA Large seulement (≥18,66 px 700 / 24 px) |
| `#E8832A` | `#FBF6EC` | **2,4:1** | Décoratif — jamais de texte |
| `#FEFAF3` | `#A94F0A` | **5,3:1** | AA — bouton principal |
| `#FEFAF3` | `#B85C00` | **4,2:1** | ⚠ échoue AA en 16 px |
| `#0E2A31` | `#E8832A` | **5,5:1** | AA — CTA orange sur fond sombre |
| `#2E7B84` | `#FBF6EC` | **4,6:1** | AA |
| `#55ADB3` | `#FBF6EC` | **2,2:1** | Décoratif — échoue aussi 1.4.11 |
| `#3F6B3C` | `#FBF6EC` | **5,8:1** | AA |
| `#3F6B3C` | `rgba(110,154,106,.14)` | **5,4:1** | AA — badge vérifié |
| `#6E9A6A` | `#FBF6EC` | **3,0:1** | Décoratif / bordure |
| `#B0431C` | `#FBF6EC` | **5,4:1** | AA — erreurs |
| `#FBF6EC` | `#0E2A31` | **14,0:1** | AAA — bandeaux sombres |
| `rgba(251,246,236,.72)` | `#0E2A31` | **8,0:1** | AA |
| `rgba(251,246,236,.45)` | `#0E2A31` | **4,2:1** | Labels ≥16 px 600 |
| `#E8832A` | `#0E2A31` | **5,5:1** | AA — chapeaux sur sombre |
| `#9FC79B` | `#0E2A31` | **7,9:1** | AA — succès sur sombre |

**Dette à corriger dans les écrans existants** : les boutons pleins et les
chapeaux de section utilisent aujourd'hui `#B85C00`. Basculer les fonds de
bouton sur `--color-accent-strong` (`#A94F0A`) et les textes sur
`--color-accent-text` (`#9E4E06`).

---

## 2. Typographie

### 2.1 Familles

```css
:root {
  --font-display: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  --font-sans:    'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  --font-mono:    'IBM Plex Mono', ui-monospace, monospace;
}
```

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet" />
```

**Instrument Serif** — un seul poids (400), fort contraste plein/délié. Les
titres gagnent en caractère sans avoir besoin de gras : ne jamais simuler un
bold. Italique réservé à la devise et aux citations.

**IBM Plex Sans** — 400 / 500 / 600 uniquement. Pas de 700 : le 600 suffit et
évite le rendu épaissi en petit corps.

**IBM Plex Mono** — 400, exclusivement pour les libellés de placeholder image,
les identifiants techniques (RIDET) et les références.

### 2.2 Règle de partage

| Instrument Serif | IBM Plex Sans |
| --- | --- |
| H1 → H3 (≥28 px) | H4 → H6 |
| Prix (≥24 px) | Titres d'annonces |
| Grands chiffres de statistique | Tout le texte courant |
| Devise, accroches éditoriales | Boutons, champs, badges, labels |
| Numéros d'étape, initiales d'avatar | Métadonnées, chapeaux |

**Seuil absolu : jamais d'Instrument Serif sous 22 px.** En dessous, le
contraste des traits fins tombe sous le seuil de lisibilité à l'écran.

### 2.3 Échelle

Desktop (≥1024 px). Tous les `line-height` sont sans unité.

| Niveau | Famille | Taille | Poids | LH | Letter-spacing | Usage |
| --- | --- | --- | --- | --- | --- | --- |
| `display-xl` | Display | 78 px | 400 | 0.98 | −0.015em | Hero de landing |
| `h1` | Display | 70 px | 400 | 0.99 | −0.015em | Titre de page |
| `h1-form` | Display | 52 px | 400 | 1.03 | −0.015em | Titre de formulaire |
| `h2` | Display | 46 px | 400 | 1.05 | −0.01em | Titre de section |
| `h3` | Display | 32 px | 400 | 1.08 | 0 | Sous-section, encart |
| `h4` | Sans | 20 px | 600 | 1.30 | 0 | Titre de bloc, événement |
| `h5` | Sans | 17 px | 600 | 1.35 | 0 | Titre de carte pro |
| `h6` | Sans | 15 px | 600 | 1.40 | 0 | Libellé de groupe |
| `price-lg` | Display | 56 px | 400 | 1.00 | 0 | Prix de fiche annonce |
| `price` | Display | 30 px | 400 | 1.00 | 0 | Prix en carte |
| `price-sm` | Display | 24 px | 400 | 1.00 | 0 | Prix en liste dense |
| `body-lg` | Sans | 19 px | 400 | 1.60 | 0 | Chapô de hero |
| `body` | Sans | 17 px | 400 | 1.65 | 0 | Texte courant, description |
| `body-sm` | Sans | 15 px | 400 | 1.55 | 0 | Texte de carte |
| `label` | Sans | 15 px | 600 | 1.20 | 0 | Bouton, onglet, nav |
| `label-sm` | Sans | 13 px | 600 | 1.20 | 0 | Label de champ |
| `meta` | Sans | 13 px | 400 | 1.45 | 0 | Commune, date, distance |
| `caption` | Sans | 12 px | 500 | 1.40 | 0 | Badge, pastille |
| `eyebrow` | Sans | 12 px | 600 | 1.20 | **0.18em** | Chapeau de section, MAJ. |
| `eyebrow-sm` | Sans | 11 px | 600 | 1.20 | **0.16em** | Chapeau de carte, MAJ. |
| `mono` | Mono | 11 px | 400 | 1.40 | 0.06em | Placeholder image |

Le suivi (`letter-spacing`) large est **réservé aux chapeaux en majuscules**.
Jamais de majuscules sans suivi, jamais de suivi sur du texte en casse mixte.

### 2.4 Responsive

Deux paliers suffisent. Le corps de texte ne descend jamais sous 15 px, les
libellés jamais sous 12 px.

| Niveau | Mobile (<640) | Tablet (640–1023) | Desktop (≥1024) |
| --- | --- | --- | --- |
| `display-xl` | 40 px | 56 px | 78 px |
| `h1` | 38 px | 52 px | 70 px |
| `h1-form` | 34 px | 42 px | 52 px |
| `h2` | 30 px | 38 px | 46 px |
| `h3` | 24 px | 28 px | 32 px |
| `h4` | 18 px | 19 px | 20 px |
| `price-lg` | 38 px | 46 px | 56 px |
| `price` | 26 px | 28 px | 30 px |
| `body-lg` | 17 px | 18 px | 19 px |
| `body` | 16 px | 16 px | 17 px |
| `eyebrow` | 11 px | 12 px | 12 px |

Sur mobile, `letter-spacing` du `h1` passe à −0.01em (le serrage négatif
agressif fait coller les jambages en petit corps).

Toujours `text-wrap: pretty` sur les paragraphes ; `text-wrap: balance` sur les
titres de plus de deux lignes.

---

## 3. Spacing & layout

### 3.1 Échelle

```css
:root {
  --space-1:  4px;   --space-2:  8px;   --space-3:  12px;
  --space-4:  16px;  --space-5:  20px;  --space-6:  24px;
  --space-8:  32px;  --space-10: 40px;  --space-12: 48px;
  --space-16: 64px;  --space-20: 80px;  --space-24: 96px;
}
```

Valeurs canoniques par usage :

| Usage | Valeur |
| --- | --- |
| Gap interne d'un groupe de badges / chips | 6–8 px |
| Gap entre champs de formulaire | 16 px |
| Padding interne de carte | 18–22 px |
| Padding interne de grande carte / panneau | 28–36 px |
| Gap de grille (cartes) | 14–16 px |
| Espace titre → contenu | 24–28 px |
| Espace entre sections | 72–80 px |
| Padding horizontal de page (desktop) | 48 px |

**Toujours `display:flex` / `grid` + `gap`.** Jamais d'espacement par marges
successives ou par espaces dans le source : le `gap` survit au réordonnancement
et à la suppression d'éléments.

### 3.2 Grille & container

- Grille de 12 colonnes, gouttière 16 px.
- Container max : **1440 px**, padding latéral 48 px desktop / 24 px tablet /
  16 px mobile. Les pages de contenu long peuvent se contraindre à 1280 px.
- Colonne de texte : **max 720 px** (paragraphes), **max 860 px** (titres).

Gabarits de colonnes utilisés :

| Page | Desktop |
| --- | --- |
| Listing avec filtres | `296px 1fr`, gap 28 px |
| Listing avec carte | `1fr 372px`, gap 16 px |
| Fiche détail | `1fr 396px`, gap 32 px |
| Vitrine / dashboard | `1fr 340px`, gap 32 px |
| Auth | `1fr 1fr`, plein écran |
| Grille de cartes | 3–4 colonnes (2 en tablet, 1 en mobile) |

### 3.3 Breakpoints

```js
screens: {
  sm: '640px',   // ≥ mobile large
  md: '768px',   // tablette portrait — la sidebar de filtres passe en drawer
  lg: '1024px',  // tablette paysage — grille 2 colonnes
  xl: '1280px',  // desktop — grille 3 colonnes, sidebar visible
  '2xl': '1440px',
}
```

Règles de bascule :
- `< md` : sidebar de filtres → drawer plein écran déclenché par un bouton
  « Filtrer (n) » collant en bas d'écran.
- `< lg` : grille de cartes en 2 colonnes ; colonne latérale de fiche détail
  passe sous le contenu, le bloc vendeur devient une barre collante en bas.
- `< md` : header réduit au logo + recherche + bouton Déposer ; nav en drawer.

### 3.4 Rayons & ombres

Trois rayons, plus la pastille. Toute autre valeur est une erreur.

```css
:root {
  --radius-control: 10px; /* bouton, champ, select, petite pastille carrée */
  --radius-card:    16px; /* carte, encart, modale interne */
  --radius-block:   24px; /* bloc de section, bandeau sombre, panneau */
  --radius-pill:    9999px;
}
```

Tolérance : 12–14 px pour les éléments imbriqués dans une carte 16 px
(placeholder image, ligne de liste), 18–22 px pour les grandes cartes de
contenu. Jamais 28 px ni 32 px.

Ombres teintées pétrole chaud — **jamais de teinte froide ni bleue** :

```css
:root {
  --shadow-card:   0 3px 14px rgba(18,58,68,.06);
  --shadow-raised: 0 6px 24px rgba(18,58,68,.09);
  --shadow-panel:  0 8px 30px rgba(18,58,68,.10);
  --shadow-modal:  0 30px 90px rgba(14,42,49,.40);
  --shadow-accent: 0 2px 12px rgba(169,79,10,.22); /* bouton principal */
}
```

---

## 4. Composants UI

### 4.1 Boutons

Hauteur cible **48 px** desktop (44 px minimum sur mobile — jamais moins).
Rayon `--radius-control`. Police `label` (15 px / 600). `gap: 8px` entre icône
et libellé, icône 16 px.

| Variante | Fond | Texte | Bordure | Ombre |
| --- | --- | --- | --- | --- |
| **primary** | `--color-accent-strong` | `--color-surface` | none | `--shadow-accent` |
| **primary-on-deep** | `--color-accent` | `--color-deep` | none | none |
| **secondary** | transparent | `--color-text` | `1px solid --color-text` | none |
| **tertiary** | `--color-surface-sunken` | `--color-text` | `1px solid --color-border` | none |
| **ghost** | transparent | `--color-accent-text` | none | none |
| **success** | `--color-success-soft` | `--color-success-text` | `1px solid rgba(110,154,106,.50)` | none |
| **disabled** | `--color-surface-sunken` | `rgba(18,58,68,.55)` | `1px solid --color-border` | none |

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 48px; padding: 0 26px;
  border-radius: var(--radius-control);
  font: 600 15px/1.2 var(--font-sans);
  transition: background-color 150ms ease-out, border-color 150ms ease-out,
              transform 150ms ease-out;
}
.btn--primary            { background: var(--color-accent-strong); color: var(--color-surface);
                           box-shadow: var(--shadow-accent); }
.btn--primary:hover      { background: #8F420A; }
.btn--primary:active     { transform: translateY(1px); box-shadow: none; }
.btn--secondary:hover    { background: var(--color-surface-sunken); }
.btn--ghost:hover        { background: var(--color-accent-soft); }

.btn:focus-visible {
  outline: 2px solid var(--color-border-strong);
  outline-offset: 2px;
}
.btn:disabled { cursor: not-allowed; box-shadow: none; }
```

**État loading** : le libellé est remplacé par un spinner 16 px + le texte
d'action au participe (« Envoi… »). La largeur du bouton est figée avant le
changement (`min-width` mesurée) pour éviter le saut de layout. Pas de
désactivation visuelle : le bouton garde sa couleur, seul le curseur passe en
`progress`.

**Un seul bouton primary par zone visible.** Une carte a un primary et un
secondary, jamais deux primary.

### 4.2 Champs de formulaire

Hauteur **50 px** (46 px en champ compact de header). Rayon 11 px
(`--radius-control` +1 pour l'optique du champ). Fond `--color-surface` sur
crème, `--color-bg` sur carte crème-surface. Bordure `--color-border`.

```css
.field {
  height: 50px; width: 100%; box-sizing: border-box;
  padding: 0 15px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: var(--color-surface);
  font: 400 16px/1 var(--font-sans);
  color: var(--color-text);
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}
.field::placeholder { color: var(--color-text-faint); }
.field:hover        { border-color: rgba(18,58,68,.28); }
.field:focus {
  outline: none;
  border-color: var(--color-border-strong);
  box-shadow: 0 0 0 3px rgba(18,58,68,.10);
}
.field[aria-invalid='true'] {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(176,67,28,.12);
}
.field:disabled {
  background: var(--color-surface-sunken);
  color: var(--color-text-subtle);
  cursor: not-allowed;
}
```

**Taille de police 16 px minimum** sur les champs : en dessous, iOS zoome
automatiquement au focus.

- **Label** : `label-sm` (13 px / 600 / `--color-text-muted`), au-dessus du
  champ, `margin-bottom: 8px`. Pas de label flottant.
- **Aide** : `meta` (13 px / `--color-text-subtle`), 8 px sous le champ.
- **Erreur** : `meta` en `--color-error`, remplace l'aide, précédée d'une icône
  12 px. Annoncée par `aria-describedby`.
- **Préfixe** (ex. `+687`) : bloc `--font-mono` 15 px, séparé par
  `border-right: 1px solid --color-border`, padding 13 px.
- **Textarea** : mêmes tokens, `padding: 12px 14px`, `line-height: 1.55`,
  `resize: vertical`, 5 lignes par défaut.
- **Select** : identique au champ, chevron 15 px `rgba(18,58,68,.45)` à droite,
  `cursor: pointer`.

**Checkbox** — carré 21 px, rayon 6 px, bordure 1.5 px `#D5C4AC`.
Coché : fond `--color-text`, coche crème 13 px, `stroke-width: 3.5`.
**Radio** — cercle 17 px, bordure 1.5 px, point interne 9 px `--color-text`.
Les deux sont enveloppés dans un `<button>`/`<label>` cliquable avec le texte,
zone de clic minimale 44 px de haut.

**Toggle** — piste 54×30 px, rayon pastille, fond `#D5C4AC` → `--color-text`,
bouton 24 px crème avec `0 1px 4px rgba(18,58,68,.3)`,
`transform: translateX(24px)`, transition 200 ms.

**Stepper numérique** — deux boutons carrés 34 px rayon 8 px fond
`--color-surface-sunken`, valeur au centre en `price-sm` (Instrument Serif
26 px), le tout dans un conteneur bordé rayon `--radius-control`.

### 4.3 Cards

Base commune : fond `--color-surface`, bordure `1px solid --color-border`,
rayon `--radius-card`, ombre `--shadow-card`.
Hover : `border-color: --color-border-strong` uniquement. **Pas d'élévation au
survol, pas de translation.**

```css
.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition: border-color 150ms ease-out;
}
.card:hover { border-color: var(--color-border-strong); }
```

**Carte annonce** — la référence.
Structure : média 4/3 → titre → prix → localisation → pied vendeur.
- Média : fond `--color-surface-sunken` + motif diagonal 7 %, placeholder
  `mono` centré. Badge type de transaction en haut à gauche, badge catégorie à
  côté, bouton favori 34 px rond `rgba(254,250,243,.92)` en bas à droite.
- Titre : `body-sm` en 500, 2 lignes max.
- Prix : `price` (Instrument Serif 30 px), unité en 15 px
  `--color-text-subtle` à la suite.
- Localisation : `meta` + icône lagon 14 px. **La distance passe avant la
  commune** (« Anse Vata · à 4 km »).
- Pied : `border-top: 1px solid --color-border-inner`, `padding-top: 14px`.
  Avatar 34 px + prénom + note. **Un seul badge** (Pro vérifié) aligné à droite.

**Carte profil pro** — bandeau 88 px en `--color-surface-sunken` + motif,
avatar 60 px rayon 16 px avec `border: 3px solid --color-surface` remontant de
−26 px sur le bandeau, badge « Pro vérifié » en haut à droite du bandeau,
deux boutons pleine largeur en pied (secondary + primary).

**Carte catégorie** — ligne : pastille 46 px rayon 12 px fond
`--color-accent-soft` avec initiale en Instrument Serif 20 px
`--color-accent-text`, puis titre `h6` + sous-titre `meta`.

**Carte boost / offre** — bordure gauche 3 px `--color-accent` quand l'élément
est mis en avant, badge « Boosté » / « À la une » en fond `--color-accent` avec
texte `--color-deep`.

**Bloc sombre** (section confiance, encart CTA, panneau billetterie) — fond
`--color-deep`, rayon `--radius-block`, motif diagonal 9–10 %, chapeau en
`--color-accent`, séparateurs `--color-on-deep-border`.

### 4.4 Navigation

**Header** — hauteur **88 px**, `position: sticky; top: 0`, fond
`--color-bg`, `border-bottom: 1px solid --color-border`, padding latéral 48 px.
Ordre : logo (46 px) + wordmark Instrument Serif 28 px → recherche (max 440 px)
→ nav → séparateur vertical → connexion + bouton Déposer.
Lien de nav : `label`, padding `9px 13px`, rayon 8 px, hover
`background: --color-surface-sunken`. Actif : même fond, poids 600.

**Barre de filtres collante** — `position: sticky; top: 88px`, même fond, même
bordure basse, padding vertical 20 px. Contient recherche, menu catégories,
segmenteur de type, tri, bascule grille/carte.

**Segmenteur** (onglets, type de transaction, grille/carte) — conteneur rayon
12 px fond `--color-surface-sunken` bordure `--color-border` padding 3 px ;
option active fond `--color-surface` + `box-shadow: 0 2px 8px rgba(18,58,68,.10)`
+ poids 600 ; inactive transparente `--color-text-subtle`.

**Menu déroulant catégories** — panneau `position: absolute; top: 62px`,
deux colonnes `268px 300px`, rayon `--radius-card`, bordure
`--color-border-strong`, `box-shadow: 0 20px 60px rgba(18,58,68,.22)`,
`max-height: 436px` avec `overflow-y: auto`. Colonne gauche = catégories
(survol → colonne droite), colonne droite = sous-catégories sur fond
`--color-surface-sunken`. Fermeture : clic extérieur, `Escape`, sélection.

**Fil d'Ariane** — `meta`, séparateur `/` en `rgba(18,58,68,.30)`, dernier
segment en `--color-text` non cliquable.

**Pagination** — préférer « Charger plus » : compteur `meta`
(« 9 annonces sur 8 604 ») + barre de progression 4 px (`--color-border` /
remplissage `--color-accent-strong`) + bouton secondary. Pagination numérotée
seulement en admin : pastilles 40 px, active fond `--color-text`.

**Footer** — fond `--color-deep`, motif 7 %, grille `1.6fr 1fr 1fr 1fr`,
padding `56px 48px 40px`. Colonne 1 : logo 48 px + wordmark 30 px + devise en
Instrument Serif italique 24 px `rgba(251,246,236,.85)`. Titres de colonne en
`eyebrow` `--color-on-deep-subtle`, liens 15 px `rgba(251,246,236,.78)`,
hover `--color-accent`. Barre légale séparée par `--color-on-deep-border`.

### 4.5 Badges & tags

Pastille : `border-radius: --radius-pill`, `padding: 5px 12px`,
`font: 600 12px/1.2 --font-sans`, `gap: 6px`, icône 12–13 px.

| Rôle | Fond | Texte | Bordure |
| --- | --- | --- | --- |
| Vérifié, en ligne, gratuit, don | `--color-success-soft` | `--color-success-text` | `--color-success-border` |
| Délai de réponse, distance, factuel | `--color-info-soft` | `--color-info-text` | `--color-info-border` |
| Note, réputation, échéance | `--color-accent-soft` | `--color-accent-text` | `--color-accent-border` |
| État du bien, neutre | `--color-surface-sunken` | `rgba(18,58,68,.62)` | `--color-border` |
| À la une, boosté | `--color-accent` | `--color-deep` | none |
| Catégorie sur photo | `rgba(14,42,49,.82)` | `--color-on-deep` | none |
| Erreur, rupture | `--color-error-soft` | `--color-error` | `rgba(176,67,28,.30)` |

**Type de transaction** (sur média, texte crème) : Vente
`rgba(184,92,0,.92)` · Location `rgba(46,123,132,.92)` · Troc et Don
`rgba(110,154,106,.92)` avec texte `--color-deep`.

**Point de statut** : cercle 7 px, `--color-success` en ligne,
`--color-text-faint` hors ligne.

Trois familles de couleur maximum par carte. Un badge n'est jamais cliquable
s'il n'est pas un filtre.

### 4.6 Modals & drawers

**Modal** — overlay `rgba(14,42,49,.62)`, padding 32 px, panneau centré
`max-height: 88vh`, rayon 22 px, fond `--color-surface`,
`box-shadow: --shadow-modal`.
- Largeurs : 560 px (confirmation), 720 px (formulaire court), 960 px
  (formulaire + colonne latérale de réassurance).
- En-tête : chapeau `eyebrow-sm` + titre `h3` (Instrument Serif 30–32 px) +
  bouton fermer 38 px rond fond `--color-surface-sunken`, séparé par
  `border-bottom: 1px solid --color-border`, padding `26px 32px`.
- Corps : `padding: 28px 32px`, `overflow-y: auto`.
- Colonne latérale optionnelle : fond `--color-surface-sunken`, liste de
  garanties (icône verte 16 px + texte 14 px).
- Pied : actions alignées à gauche, primary puis note `meta` à droite
  (« Gratuit et sans engagement »).
- Focus piégé dans le panneau, `Escape` ferme, focus rendu au déclencheur.

**Drawer** (filtres mobile, nav mobile) — glisse depuis la droite (nav) ou le
bas (filtres), `max-height: 92vh`, rayon `24px 24px 0 0` pour le bas,
poignée 40×4 px `--color-border` centrée. Barre d'actions collante en pied :
« Réinitialiser » (ghost) + « Voir les n résultats » (primary).

### 4.7 Alertes & toasts

**Alerte en ligne** — rayon `--radius-card`, `padding: 16px 18px`,
`border-left: 3px solid`, icône 17 px, titre `h6`, corps `body-sm`.

| Type | Fond | Bordure gauche | Texte |
| --- | --- | --- | --- |
| success | `--color-success-soft` | `--color-success` | `--color-success-text` |
| info | `--color-info-soft` | `--color-info` | `--color-info-text` |
| warning | `--color-warning-soft` | `--color-warning` | `#8F480A` |
| error | `--color-error-soft` | `--color-error` | `--color-error` |

**Toast** — bas-centre desktop, bas pleine largeur mobile ; largeur max
420 px, fond `--color-deep`, texte `--color-on-deep`, rayon
`--radius-control`, `box-shadow: --shadow-panel`, point de statut coloré 8 px
à gauche, action textuelle `--color-accent` à droite.
Entrée : `translateY(12px) → 0` + opacité, 200 ms `ease-out`. Sortie 150 ms.
Durée d'affichage : 4 s (succès), 6 s (erreur), persistant si action requise.
`role="status"` / `role="alert"`. Trois toasts empilés maximum, gap 8 px.

### 4.8 Avatar

Cercle (personne) ou rayon 12–16 px (entreprise). Fond
`--color-info-soft`, texte `--color-info-text` pour les particuliers ;
`--color-surface-sunken` + `--color-text` pour les pros.
Initiales : IBM Plex Sans 600 jusqu'à 44 px, Instrument Serif au-dessus.

| Taille | Diamètre | Police |
| --- | --- | --- |
| xs | 30 px | 12 px sans |
| sm | 34 px | 12 px sans |
| md | 44 px | 14 px sans |
| lg | 60 px | 22 px serif |
| xl | 96 px | 34 px serif |

Avatar remontant sur un bandeau : `border: 3–4px solid --color-surface` et
`margin-top` négatif égal à la moitié de la taille.
Photo absente = initiales, jamais d'icône générique de silhouette.

---

## 5. Patterns de page

### 5.1 Structure standard

```
header (sticky, 88px)
└ barre de filtres/onglets (sticky, top:88px)   — pages de listing
hero OU fil d'Ariane                            — jamais les deux
contenu (grille ou 2 colonnes)
bloc CTA sombre                                 — au plus un par page
footer sombre
```

Espace entre sections : 72–80 px. Chaque section porte un chapeau `eyebrow` en
`--color-accent-text` au-dessus de son `h2`.

### 5.2 Page formulaire (connexion, inscription, dépôt d'annonce)

Deux volets `1fr 1fr` pleine hauteur.
- **Volet gauche** — fond `--color-deep`, motif animé 9 %, logo centré avec
  halo radial et animation de tangage, accroche `h2` + trois preuves à puces
  vertes, devise en Instrument Serif italique en pied.
- **Volet droit** — fond `--color-bg`, padding `44px 72px`, segmenteur de mode
  en haut, titre `h1-form`, formulaire max 520 px, ligne de réassurance en pied
  séparée par `border-top`.

Formulaire multi-étapes : indicateur horizontal (pastille 34 px rayon 10 px,
étape faite = coche sur `--color-success-soft`, active = fond `--color-text`,
à venir = `--color-surface-sunken`), lignes de liaison 1 px. Le bouton
« Continuer » est désactivé en tokens `disabled` (jamais en opacité) avec une
note expliquant ce qui manque.

Dépôt d'annonce : mêmes règles, colonne latérale d'aperçu live de la carte
annonce (`position: sticky`).

### 5.3 Page listing

`296px 1fr` gap 28 px. Sidebar `position: sticky; top: 212px` avec
`max-height: calc(100vh - 236px); overflow-y: auto`.
- Sections de filtre repliables : en-tête cliquable avec `eyebrow-sm` +
  résumé de la valeur active (`meta`) + chevron. État d'ouverture persisté en
  `localStorage`. Localisation ouverte par défaut, le reste replié.
- Histogramme de prix : 18 barres 4 px de gap, hauteur relative, barres dans
  la plage en `rgba(184,92,0,.75)`, hors plage en `--color-border`.
- Puces de filtres actifs au-dessus des résultats, chacune supprimable
  (croix 14 px), + « Réinitialiser (n) » en `--color-error`.
- Vue carte : `1fr 372px` hauteur 760 px. Épingles = pastilles de prix
  (Vente orange / Location lagon / Troc vert), grappes = cercles 38–48 px
  `rgba(169,79,10,.90)` bordure crème 3 px, cercle de rayon en tirets lagon,
  bouton « Rechercher dans cette zone » en haut à droite, légende en bas à
  gauche. Liste latérale synchronisée, élément survolé bordé
  `--color-border-strong`.

### 5.4 Page détail

`1fr 396px` gap 32 px.
- Galerie 16/10 rayon 20 px, vignettes 104×82 px rayon 12 px, active bordée
  2 px `--color-text`, compteur `1 / 6` en `mono` sur `rgba(14,42,49,.82)`.
- Bloc titre : `h2` à gauche, prix `price-lg` aligné à droite, badge « Prix
  négociable » sous le prix, puis 4 tuiles de spécifications
  (`--color-surface-sunken`, rayon 14 px).
- Description : `body` 17 px, `line-height: 1.75`, `white-space: pre-line`.
- Colonne latérale `position: sticky; top: 112px` : bloc vendeur (avatar,
  badges, 3 actions), bloc sécurité sombre numéroté, bloc alerte, lien
  « Signaler » discret en pied.
- Sous le contenu : autres annonces du vendeur, recherches associées en chips.

### 5.5 Page dashboard pro

`1fr 340px` ou grille de tuiles `repeat(3, 1fr)`.
- Tuiles de KPI : chapeau `eyebrow-sm`, valeur en Instrument Serif 28 px,
  variation en `--color-success-text` ou `--color-error`.
- Graphique : barres 5 px de gap, `border-radius: 3px 3px 0 0`, historique en
  `rgba(159,199,155,.75)`, période courante en `--color-accent`.
- Lignes de liste : fond `rgba(251,246,236,.07)` sur sombre /
  `--color-surface-sunken` sur clair, pastille de statut à droite.
- Un tableau dense utilise `border-bottom: 1px solid --color-border-inner` et
  aucune bordure verticale.

### 5.6 Choix du fond

| Fond | Quand |
| --- | --- |
| `--color-bg` (crème) | Fond de page, header, barres collantes |
| `--color-surface` | Toute carte ou panneau posé sur le crème |
| `--color-surface-sunken` (sable) | Creux : placeholder image, champ dans une carte, section alternée, tuile de spécification, colonne d'aide de modale |
| `--color-deep` (récif) | Bandeau de confiance, CTA final, footer, volet de marque, panneau de sécurité. **Au plus deux blocs sombres par page.** |
| Blanc pur | Jamais |

Ne jamais empiler trois niveaux : une carte `--color-surface` contient des
creux `--color-surface-sunken`, pas une autre carte `--color-surface`.

---

## 6. Iconographie & images

### 6.1 Icônes

**Lucide**, style outline exclusivement. `fill: none`,
`stroke: currentColor`, `stroke-linecap: round`, `stroke-linejoin: round`.

| Contexte | Taille | Épaisseur |
| --- | --- | --- |
| Dans un badge / pastille | 12–13 px | 2 |
| Métadonnée, label, champ | 14–15 px | 2 |
| Bouton, action | 16–17 px | 2 |
| Icône `+` de bouton principal | 16 px | 2.5 |
| Coche de checkbox | 12–13 px | 3.5 |
| Icône illustrative de bloc | 18–20 px | 2 |

Jamais d'icône au-delà de 24 px : au-delà, c'est une pastille avec initiale en
Instrument Serif (voir 4.3). Une icône seule porteuse de sens doit atteindre
3:1 de contraste — utiliser `--color-info-text`, pas `--color-info`.

**Aucune illustration SVG dessinée à la main. Aucun emoji.** Le seul actif
graphique de marque est `kalico1.svg`.

### 6.2 Images

| Contexte | Ratio | Rayon |
| --- | --- | --- |
| Carte annonce | 4/3 | 16 px (hérité de la carte) |
| Galerie de fiche | 16/10 | 20 px |
| Vignette de galerie | 104×82 px | 12 px |
| Vignette de liste latérale | 112×88 px | 10 px |
| Bannière de vitrine | hauteur 150 px | rayon haut de la carte |
| Média de promo | 16/10 | 16 px |
| Réalisation / portfolio | 4/3 | 16 px |

`object-fit: cover` systématique. Placeholder = fond
`--color-surface-sunken` + motif diagonal 7 % + libellé descriptif en `mono`
11 px `rgba(18,58,68,.42)` centré (« photo de la planche », pas « image »).
Chargement : `--color-surface-sunken` uni, sans squelette animé.

### 6.3 Le motif diagonal

Croisillon à 45°, clin d'œil à la vannerie. Il se sent, il ne se voit pas.

```css
.motif {
  background-image:
    repeating-linear-gradient(45deg,  currentColor 0 1px, transparent 1px 9px),
    repeating-linear-gradient(-45deg, currentColor 0 1px, transparent 1px 9px);
}
```

| Support | Couleur | Opacité |
| --- | --- | --- |
| Sur crème (hero, fond de page) | `#123A44` | **4,5 %** |
| Sur sable (placeholder image) | `#123A44` | **7 %** |
| Sur récif (bandeau, footer, volet auth) | `#FBF6EC` | **7–10 %** |

Variante à une seule diagonale (nervure) pour les surfaces étroites :
`repeating-linear-gradient(45deg, … 1px 16px)` à 7 %.

Toujours sur une couche `position: absolute; inset: 0` séparée, sous le
contenu, avec `pointer-events: none`. **Jamais** sur une surface portant du
texte long, jamais au-dessus de 10 %, jamais sur une carte de contenu.

---

## 7. Animations & interactions

### 7.1 Tokens

```css
:root {
  --ease:        cubic-bezier(.22,.61,.36,1); /* ease-out — défaut */
  --ease-in-out: cubic-bezier(.45,.05,.55,.95); /* boucles ambiantes */
  --dur-fast:    150ms; /* hover, focus, couleur */
  --dur-normal:  300ms; /* ouverture, déplacement, hauteur */
  --dur-slow:    500ms; /* entrée de modale, transition de vue */
}
```

`ease-out` par défaut : le mouvement démarre vite et s'installe.
`ease-in-out` réservé aux boucles infinies.

### 7.2 Ce qu'on anime

| Interaction | Propriété | Durée |
| --- | --- | --- |
| Hover de carte | `border-color` | 150 ms |
| Hover de bouton | `background-color` | 150 ms |
| Active de bouton | `transform: translateY(1px)` | 150 ms |
| Focus | `box-shadow`, `border-color` | 150 ms |
| Ouverture de menu / accordéon | `opacity`, `transform: translateY(-4px)` | 200 ms |
| Toggle | `transform: translateX()` | 200 ms |
| Drawer | `transform: translateX/Y(100%)` | 300 ms |
| Modale | overlay `opacity` + panneau `scale(.98)→1` | 300 / 500 ms |
| Toast | `translateY(12px)→0` + `opacity` | 200 ms |
| Onglet actif | `background-color`, `box-shadow` | 150 ms |

### 7.3 Ce qu'on n'anime pas

- Le survol des cartes en élévation, translation ou zoom d'image.
- Le prix, le titre, les badges (aucun élément porteur d'information ne bouge).
- L'apparition des résultats de recherche et le contenu au scroll : pas de
  fondu-monté, pas de révélation progressive.
- Les changements de layout (`width`, `height`, `top` sur du contenu).
- Les squelettes de chargement clignotants.

Une seule chose bouge à l'écran à la fois. Animer `opacity` et `transform`
uniquement — jamais une propriété qui déclenche un reflow.

### 7.4 Animation de marque (page auth)

Trois boucles désynchronisées, lentes, sur le volet sombre :

```css
@keyframes kx-sail  { 0%,100% { transform: translateY(0)    rotate(-1.1deg); }
                      50%     { transform: translateY(-9px) rotate(1.1deg);  } }
@keyframes kx-swell { 0%,100% { transform: translateX(-3%) scaleY(1);    }
                      50%     { transform: translateX(3%)  scaleY(1.35); } }
@keyframes kx-halo  { 0%,100% { opacity:.28; transform: scale(.94); }
                      50%     { opacity:.5;  transform: scale(1.04); } }
@keyframes kx-drift { to { background-position: 180px 180px, -180px 180px; } }
```

- Logo : `kx-sail` 7 s `ease-in-out` infinie, `transform-origin: 50% 88%`
  (la pirogue pivote sur sa coque).
- Halo radial orange/lagon derrière le logo : `kx-halo` 9 s.
- Deux lignes de houle sous la coque : `kx-swell` 7 s, la seconde en `reverse`.
- Motif de fond : `kx-drift` 34 s `linear`.

Amplitudes volontairement faibles (9 px, 1,1°) : la page doit respirer, pas
attirer l'œil. Aucune animation d'entrée, aucun décalage au chargement.

### 7.5 Accessibilité du mouvement

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

Le composant de marque porte une classe `.kx-anim` explicitement neutralisée
par cette requête. Aucune information n'est portée par le mouvement seul.

### 7.6 Focus

Toujours visible, jamais supprimé : `outline: 2px solid #123A44` avec
`outline-offset: 2px` sur crème, `outline-color: #FBF6EC` sur récif.
Ordre de tabulation suivant l'ordre du DOM. Cible tactile 44 px minimum.
`:focus-visible` plutôt que `:focus` pour éviter l'anneau au clic souris.

---

## 8. Points de vigilance repris de l'audit

À vérifier à chaque revue de code :

1. Aucun `#0A7EA4`, `#1E90FF`, `#FF6B6B`, `#48CAE4`, `#2D6A4F`, `#082032`,
   `#4A5568`, `#F5A623`, `#2E8B57` — palettes supprimées.
2. Aucune ombre en `rgba(8,32,50,…)` ni `rgba(10,126,164,…)` : toutes les
   ombres sont en `rgba(18,58,68,…)`.
3. Aucun `#fff` / `#ffffff` / `white` en fond de light mode.
4. Aucun texte clair (`text-white`, `rgba(255,255,255,…)`) sur un fond clair —
   bug présent dans l'ancienne section d'alertes de recherche.
5. Aucun rayon en 28 px ou 32 px : `10 / 16 / 24` et la pastille.
6. Aucun `font-family` par défaut : `--font-sans` ou `--font-display`,
   jamais `system-ui` seul ni `Georgia`.
7. Aucun Instrument Serif sous 22 px.
8. Aucun texte 15–16 px sur un fond `#B85C00` ou `#E8832A`.
9. Aucun espacement par marges successives là où un `gap` convient.
10. Aucun emoji, aucune illustration SVG hors `kalico1.svg`.
