/** Kalico NC — extension Tailwind (v2.0)
 *  Source de vérité : DESIGN.md. À fusionner dans frontend/tailwind.config.js.
 *
 *  Deux choses à savoir :
 *  1. Les couleurs sont en hex littéral (et non en var(--x)) pour que les
 *     modificateurs d'opacité Tailwind (`bg-accent/14`, `text-ink/68`)
 *     continuent de fonctionner. Les variables CSS de kalico-tokens.css
 *     portent les mêmes valeurs et servent au CSS écrit à la main.
 *  2. Les anciennes clés (kalico-blue, ocean, lagoon, sand, jungle, night,
 *     slate, nc-*) sont à supprimer au fur et à mesure de la migration.
 *     Ne pas les réutiliser dans du code neuf.
 */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // action & marque
        accent: {
          DEFAULT: '#E8832A', // aplats, pastilles, gros display
          strong: '#A94F0A', // fond de bouton plein (texte crème : 5,5:1)
          strongHover: '#8F420A',
          text: '#9E4E06', // texte orange sur crème (5,5:1)
        },
        // texte & structure
        ink: {
          DEFAULT: '#123A44',
          deep: '#0E2A31',
        },
        // fonds
        cream: {
          DEFAULT: '#FBF6EC', // fond de page
          surface: '#FEFAF3', // carte
          sunken: '#F3E9D8', // creux, champ, placeholder image
        },
        sand: {
          DEFAULT: '#E4D7C3', // bordure
          inner: '#EFE3D0', // séparateur interne de carte
        },
        lagoon: {
          DEFAULT: '#55ADB3', // décoratif
          text: '#2E7B84', // texte / icône porteuse de sens
        },
        reef: {
          DEFAULT: '#6E9A6A', // décoratif, bordure
          text: '#3F6B3C', // texte de confiance
          onDeep: '#9FC79B',
        },
        alert: {
          warn: '#B85C00', // ≥16px/600 seulement
          error: '#B0431C',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // display / titres — Instrument Serif, poids 400, jamais sous 22px
        'display-xl': ['78px', { lineHeight: '0.98', letterSpacing: '-0.015em' }],
        h1: ['70px', { lineHeight: '0.99', letterSpacing: '-0.015em' }],
        'h1-form': ['52px', { lineHeight: '1.03', letterSpacing: '-0.015em' }],
        h2: ['46px', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        h3: ['32px', { lineHeight: '1.08' }],
        // titres sans-serif
        h4: ['20px', { lineHeight: '1.30', fontWeight: '600' }],
        h5: ['17px', { lineHeight: '1.35', fontWeight: '600' }],
        h6: ['15px', { lineHeight: '1.40', fontWeight: '600' }],
        // prix — Instrument Serif
        'price-lg': ['56px', { lineHeight: '1' }],
        price: ['30px', { lineHeight: '1' }],
        'price-sm': ['24px', { lineHeight: '1' }],
        // texte
        'body-lg': ['19px', { lineHeight: '1.60' }],
        body: ['17px', { lineHeight: '1.65' }],
        'body-sm': ['15px', { lineHeight: '1.55' }],
        label: ['15px', { lineHeight: '1.20', fontWeight: '600' }],
        'label-sm': ['13px', { lineHeight: '1.20', fontWeight: '600' }],
        meta: ['13px', { lineHeight: '1.45' }],
        caption: ['12px', { lineHeight: '1.40', fontWeight: '500' }],
        eyebrow: ['12px', { lineHeight: '1.20', letterSpacing: '0.18em', fontWeight: '600' }],
        'eyebrow-sm': ['11px', { lineHeight: '1.20', letterSpacing: '0.16em', fontWeight: '600' }],
        'mono-xs': ['11px', { lineHeight: '1.40', letterSpacing: '0.06em' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        24: '96px',
      },
      borderRadius: {
        control: '10px',
        field: '11px',
        card: '16px',
        block: '24px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 3px 14px rgba(18, 58, 68, 0.06)',
        raised: '0 6px 24px rgba(18, 58, 68, 0.09)',
        panel: '0 8px 30px rgba(18, 58, 68, 0.10)',
        modal: '0 30px 90px rgba(14, 42, 49, 0.40)',
        accent: '0 2px 12px rgba(169, 79, 10, 0.22)',
      },
      maxWidth: {
        container: '1440px',
        'container-narrow': '1280px',
        prose: '720px',
        title: '860px',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundImage: {
        // tressage kanak — à poser en overlay, opacité 0.045
        tressage:
          'repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, currentColor 0 1px, transparent 1px 9px)',
      },
    },
  },
};
