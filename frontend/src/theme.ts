// Theme institutional - judicial palette
export const COLORS = {
  primary: '#1A2B4A',       // Deep navy (judicial)
  primaryLight: '#2D4070',
  primaryDark: '#0F1A30',
  accent: '#C9A55C',         // Gold (legal accent)
  accentLight: '#E5C885',
  background: '#F5F2EC',     // Warm cream
  surface: '#FFFFFF',
  surfaceAlt: '#FAF7F1',
  text: '#1A1A1A',
  textSecondary: '#5A5A5A',
  textMuted: '#8A8A8A',
  border: '#E0DCD3',
  borderLight: '#EFEAE0',
  success: '#0E7A4F',
  danger: '#B22234',
  warning: '#D49B3F',
  info: '#2D6CDF',
  white: '#FFFFFF',
  overlay: 'rgba(26, 43, 74, 0.45)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const FONTS = {
  serif: 'serif',
  sans: 'System',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1A2B4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A2B4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A2B4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
};

// Hardcodeada para builds estáticos de Expo (Vercel, SSR)
export const BACKEND_URL = 'https://calculo-de-penas.vercel.app';
export const API_BASE = BACKEND_URL;
