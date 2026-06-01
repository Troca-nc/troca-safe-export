// ============================================================
//  Troca Mobile - Tokens de design
//  Couleurs, typographie, espacements, ombres
// ============================================================

export const Colors = {
  // Primaire
  primary: '#0A7EA4',
  primaryLight: '#DFF4FA',
  primaryDark: '#08324F',

  // Palette NC
  lagoon: '#1E90FF',
  lagoonLight: '#1E90FF18',
  lagoonBorder: '#1E90FF40',
  lagoonText: '#0A4D8C',
  emerald: '#2E8B57',
  emeraldLight: '#2E8B5718',
  emeraldBorder: '#2E8B5740',
  emeraldText: '#1A5233',
  corail: '#FF6B6B',
  corailLight: '#FF6B6B18',
  corailBorder: '#FF6B6B40',
  corailText: '#8B0000',
  sable: '#F5A623',
  sableLight: '#F5A62318',
  sableBorder: '#F5A62340',
  sableText: '#7A4800',

  // Sémantiques
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#d97706',
  warningLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',

  // Neutres
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Fond
  background: '#F4F8F7',
  surface: '#ffffff',
  surfaceRaised: '#eef5f4',
  border: 'rgba(8,32,50,0.08)',

  // Texte
  text: '#082032',
  textSecondary: '#4B6070',
  textTertiary: '#8A9BAA',
  textInverse: '#ffffff',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const TAB_BAR_HEIGHT = 60;
export const HEADER_HEIGHT = 56;
