import { Platform } from 'react-native';

export const theme = {
  colors: {
    // Light palette (punchy, modern)
    primary: '#0066FF', // vibrant blue
    'onPrimary': '#FFFFFF',
    secondary: '#7C3AED',
    'onSecondary': '#FFFFFF',
    accent: '#06B6D4',
    background: '#F5F7FB',
    surface: '#FFFFFF',
    'surface-2': '#F1F5F9',
    text: '#0F172A',
    muted: '#475569',
    border: '#E6E9EE',
    success: '#16A34A',
    warning: '#F59E0B',
    'warning-soft': '#FFFBEB',
    error: '#DC2626',
    'error-soft': '#FEF2F2',
    'success-light': '#22C55E', // light/punchy green for buttons/text/icons


    // Dark palette (neutral charcoal — removes navy cast so accents pop)
    'primary-dark': '#5DADE2', // more vibrant light blue for dark mode
    'onPrimary-dark': '#FFFFFF',
    'secondary-dark': '#E0AAFF', // brighter purple
    'onSecondary-dark': '#1F1F3D',
    'accent-dark': '#4FD1E8', // brighter cyan
    'background-dark': '#0C0C0F', // near-black, neutral
    'surface-dark': '#18191E', // dark charcoal
    'surface-2-dark': '#23252D', // medium charcoal
    'text-dark': '#F0F4F8', // brighter text
    'muted-dark': '#9CA3AF', // better contrast muted text
    'border-dark': '#32353F', // visible neutral border
    'success-dark': '#4ADE80', // brighter green
    'success-light-dark': '#86EFAC', // light green for dark theme
    'warning-dark': '#FBBF24', // brighter amber
    'warning-soft-dark': 'rgba(251,191,36,0.12)',
    'error-dark': '#FF6B6B', // brighter red
    'error-soft-dark': 'rgba(255,107,107,0.12)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 20,
    pill: 9999,
  },
  elevation: {
    sm: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
    lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 24, elevation: 12 },
  },
  zIndex: {
    dropdown: 1000,
    modal: 1100,
    sticky: 1020,
  },
  typography: {
    fonts: {
      body: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
      heading: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
      mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      '2xl': 32,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      xs: 16,
      sm: 18,
      md: 22,
      lg: 28,
      xl: 34,
    },
    /** Trip planner scale. Nothing in that flow should go below caption. */
    trip: {
      pageTitle: 28,
      sectionTitle: 20,
      cardTitle: 18,
      body: 16,
      bodySm: 15,
      meta: 13,
      caption: 12,
    },
  },
} as const;

export type Theme = typeof theme;

export default theme;
