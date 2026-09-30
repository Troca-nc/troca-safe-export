import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import a11y from 'eslint-plugin-jsx-a11y'

// Migration progressive : lint strict sur la bibliothèque partagée et la galerie.
// Les pages métier seront intégrées avec leurs fiches, sans désactiver ces règles.
export default [
  { ignores: ['.next/**', 'node_modules/**', 'design/**'] },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/demo/**/*.{ts,tsx}',
      'src/app/dev/ui/**/*.{ts,tsx}',
      'src/lib/demo.ts',
      'src/content/placeholders.ts',
    ],
  })),
  {
    files: [
      'src/components/ui/**/*.tsx',
      'src/components/demo/**/*.tsx',
      'src/app/dev/ui/**/*.tsx',
    ],
    plugins: { 'react-hooks': hooks, 'jsx-a11y': a11y },
    rules: {
      ...hooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
    },
  },
]
