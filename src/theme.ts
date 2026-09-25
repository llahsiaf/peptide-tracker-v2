export const COLORS = {
  // Vibrant Dark Backgrounds
  bg: '#0b0f19',
  bgSoft: '#0f172a',
  bgDarker: '#080c16',
  card: '#151d30',
  cardElevated: '#1e293b',
  cardHighlight: '#24334d',
  
  // Borders
  border: '#23324d',
  borderSoft: '#1a243a',
  borderGlow: 'rgba(56, 189, 248, 0.25)',

  // Typography
  text: '#f8fafc',
  textSoft: '#cbd5e1',
  textSecondary: '#cbd5e1',
  muted: '#718096',
  textMuted: '#94a3b8',

  // Cheerful Vibrant Accents
  accent: '#10b981',        // Emerald Green
  accentStrong: '#34d399',  // Spring Mint
  mint: '#34d399',          // Playful Mint
  cyan: '#38bdf8',          // Aqua Sparkle
  pink: '#fb7185',          // Bubblegum Rose
  purple: '#c084fc',        // Neon Lavender
  yellow: '#fbbf24',        // Sunny Gold
  orange: '#fb923c',        // Warm Peach
  warning: '#f59e0b',
  amber: '#f59e0b',
  danger: '#f43f5e',

  // Category specific liquid colors
  liquidDefault: '#38bdf8',
  liquidHealing: '#34d399',
  liquidGlp1: '#fb923c',
  liquidGh: '#c084fc',
  liquidCognitive: '#fb7185',
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
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardGlow: {
    shadowColor: '#38bdf8',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  subtle: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;
