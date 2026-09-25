export const COLORS = {
  bg: '#030712',
  card: '#090d16',
  cardElevated: '#0f172a',
  border: '#1e293b',
  borderSoft: '#111827',
  text: '#f8fafc',
  textSoft: '#cbd5e1',
  muted: '#64748b',
  accent: '#10b981',
  accentStrong: '#34d399',
  cyan: '#38bdf8',
  warning: '#f59e0b',
  danger: '#ef4444',
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
} as const;
