import { describe, expect, it } from 'vitest';
import { CANONICAL_SITE_ORIGIN, normalizeSiteOrigin } from '@/lib/site';

describe('origen canónico del sitio', () => {
  it('usa el dominio canónico cuando la variable no existe', () => {
    expect(normalizeSiteOrigin(undefined)).toBe(CANONICAL_SITE_ORIGIN);
  });

  it('tolera espacios exteriores y una barra final', () => {
    expect(normalizeSiteOrigin(`  ${CANONICAL_SITE_ORIGIN}/  `)).toBe(
      CANONICAL_SITE_ORIGIN,
    );
  });

  it.each([
    `y\n${CANONICAL_SITE_ORIGIN}\n`,
    `${CANONICAL_SITE_ORIGIN}\n/sitemap.xml`,
    `y${CANONICAL_SITE_ORIGIN}`,
    'http://www.pinedayasociadoshn.com',
    'https://pinedayasociadoshn.com',
    `${CANONICAL_SITE_ORIGIN}/otra-ruta`,
    `${CANONICAL_SITE_ORIGIN}?preview=true`,
    `${CANONICAL_SITE_ORIGIN}#fragmento`,
    `${CANONICAL_SITE_ORIGIN}:443`,
    '',
  ])('rechaza una configuración inválida: %j', (value) => {
    expect(() => normalizeSiteOrigin(value)).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
