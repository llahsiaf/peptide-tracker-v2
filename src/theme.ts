export const COLORS = {
  // Deep Warm Espresso Backgrounds (Palette 1)
  bg: '#1a100f',
  bgSoft: '#231716',
  bgDarker: '#130b0b',
  card: '#291c1b',
  cardElevated: '#352423',
  cardHighlight: '#422e2c',
  
  // Warm Borders
  border: '#3d2b29',
  borderSoft: '#2d1e1d',
  borderGlow: 'rgba(223, 138, 58, 0.35)',

  // Typography (Warm Off-White & Taupe)
  text: '#fbf9f5',
  textSoft: '#dcd3ce',
  textSecondary: '#d5c9c4',
  muted: '#9c8985',
  textMuted: '#9c8985',

  // Palette 1 Core Accents (Warm Espresso & Burnished Amber)
  accent: '#DF8A3A',        // Burnished Amber / Warm Copper (High-energy & warm)
  accentStrong: '#c97528',
  amberGlow: 'rgba(223, 138, 58, 0.16)',
  lilac: '#bca9ef',
  sage: '#c2d3b6',          // Sage Cream / Matcha Green
  mint: '#c2d3b6',          // Map mint -> Sage Cream for harmonious natural tones
  cobalt: '#1f4ab2',        // Royal Cobalt Blue
  cyan: '#648cf7',          // Bright Soft Cobalt for high-contrast dark text
  pink: '#f472b6',          // Soft Rose
  purple: '#bca9ef',        // Lilac
  yellow: '#fbbf24',        // Warm Amber / Gold
  orange: '#fb923c',        // Warm Peach / Orange
  warning: '#f59e0b',
  amber: '#f59e0b',
  danger: '#f43f5e',

  // Category specific liquid colors
  liquidDefault: '#DF8A3A', // Burnished Amber
  liquidHealing: '#c2d3b6', // Sage Cream
  liquidGlp1: '#fb923c',    // Warm Peach
  liquidGh: '#648cf7',     // Soft Cobalt
  liquidCognitive: '#f472b6',
} as const;

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 9999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardGlow: {
    shadowColor: '#DF8A3A',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  subtle: {
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;
