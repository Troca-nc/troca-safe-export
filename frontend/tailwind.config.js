/** @type {import('tailwindcss').Config} */
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
        // Palette inspirée de la Nouvelle-Calédonie
        coral:   { DEFAULT: '#0A7EA4', light: '#1C9BC2', dark: '#075B77' },
        ocean:   { DEFAULT: '#08324F', light: '#0D4C75', dark: '#051E30' },
        lagoon:  { DEFAULT: '#48CAE4', light: '#72DDF7', dark: '#2AB8D4' },
        sand:    { DEFAULT: '#F4F8F7', light: '#FBFCFC', dark: '#DCE8E5' },
        jungle:  { DEFAULT: '#2D6A4F', light: '#40916C', dark: '#1B4332' },
        night:   { DEFAULT: '#082032', light: '#113A54', dark: '#04121E' },
        slate:   { DEFAULT: '#4A5568', light: '#718096', dark: '#2D3748' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card':  '0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)',
        'hover': '0 8px 24px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.06)',
        'modal': '0 24px 64px rgba(0,0,0,0.24)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease forwards',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in':   'scaleIn 0.2s ease forwards',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
