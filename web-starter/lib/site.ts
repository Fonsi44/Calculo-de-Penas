/** Presets de tema intercambiables. Cambia `theme` al clonar un proyecto. */
export const THEME_PRESETS = [
  'corporate-navy',
  'modern-minimal',
  'warm-legal',
  'vibrant-startup',
] as const;

export type ThemePreset = (typeof THEME_PRESETS)[number];

export const site = {
  name: 'Acme Studio',
  tagline: 'Webs profesionales con diseño code-first',
  theme: 'corporate-navy' satisfies ThemePreset,
  nav: [
    { href: '/', label: 'Inicio' },
    { href: '/about', label: 'Nosotros' },
  ],
  cta: {
    primary: { href: '/about', label: 'Conocer más' },
    secondary: { href: 'mailto:hello@example.com', label: 'Contacto' },
  },
} as const;

export function getThemeAttribute(theme: ThemePreset = site.theme): string {
  return theme;
}
