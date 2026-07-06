/**
 * LexForge AI — centralized design tokens.
 * Import this everywhere instead of hardcoding colors/sizes.
 *
 * If you use NativeWind instead of StyleSheet, mirror these exact values
 * into tailwind.config.js under theme.extend.colors / fontFamily / etc.
 * so both approaches stay in sync.
 */

export const colors = {
  gold: '#D4A017',
  goldLight: '#F0C040',
  goldDim: '#A07810',
  goldMuted: '#6B5518',

  base: '#0D0D0D',
  surface: '#141414',
  surface2: '#1C1C1C',
  surface3: '#242424',

  border: '#2A2A2A',
  borderGold: '#3A3010',

  ink: '#F5F5F2',
  inkMuted: '#A3A39C',
  inkFaint: '#6E6E68',

  success: '#3FA66B',
  successBg: '#12261A',
  danger: '#E1584B',
  dangerBg: '#2A1512',
  warning: '#C98A2E',
  warningBg: '#2A1D0D',
  info: '#4C8DD9',
  infoBg: '#0F1E2E',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const gradients = {
  // Use with expo-linear-gradient <LinearGradient colors={...} start={{x:0,y:0}} end={{x:1,y:1}} />
  goldPrimary: [colors.goldDim, colors.gold, colors.goldLight] as const,
  goldPrimaryLocations: [0, 0.55, 1] as const,
  goldText: [colors.goldDim, colors.goldLight, colors.gold] as const,
  heroGlow: ['rgba(212,160,23,0.14)', 'rgba(13,13,13,0)'] as const,
};

export const fonts = {
  // Load via expo-font / @expo-google-fonts packages — see App.tsx font loading example.
  serif: 'SourceSerif4_600SemiBold',
  serifBold: 'SourceSerif4_700Bold',
  serifRegular: 'SourceSerif4_400Regular',
  serifDevanagari: 'NotoSerifDevanagari_600SemiBold',
  serifDevanagariBold: 'NotoSerifDevanagari_700Bold',
  body: 'Hind_400Regular',
  bodyMedium: 'Hind_500Medium',
  bodySemiBold: 'Hind_600SemiBold',
  bodyBold: 'Hind_700Bold',
  // Document/paper preview text — falls back to system serif, no custom font needed.
  documentSerif: 'Georgia',
};

/** Pick the right heading font for the active language (Devanagari needs a different family). */
export function serifFontFor(lang: 'en' | 'hi', weight: 'regular' | 'semibold' | 'bold' = 'semibold') {
  if (lang === 'hi') {
    return weight === 'bold' ? fonts.serifDevanagariBold : fonts.serifDevanagari;
  }
  if (weight === 'bold') return fonts.serifBold;
  if (weight === 'regular') return fonts.serifRegular;
  return fonts.serif;
}

export const radii = {
  button: 10,
  input: 10,
  card: 16,
  modal: 20,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontSizes = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 17,
  heading: 22,
  display: 26,
  hero: 34,
};

/**
 * Shadows — RN shadow props (iOS) + elevation (Android). Spread onto a View style.
 * The "two-layer" card shadow from the web design is approximated with the tighter
 * of the two on native (RN doesn't support multiple box-shadows); the wide diffuse
 * layer is dropped in favor of a slightly larger native shadow radius.
 */
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  goldGlow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

/** Gold "ring" border used on primary/Pro elements alongside goldGlow shadow. */
export const goldRingBorder = {
  borderWidth: 1,
  borderColor: 'rgba(212,160,23,0.28)',
};

export const theme = { colors, gradients, fonts, radii, spacing, fontSizes, shadows, goldRingBorder, serifFontFor };
export type Theme = typeof theme;
export default theme;
