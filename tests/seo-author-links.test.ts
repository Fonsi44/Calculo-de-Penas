import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const blogSource = readFileSync(
  'app/(public)/blog/[categoria]/[slug]/page.tsx',
  'utf8',
);
const despachoSource = readFileSync('app/(public)/despacho/page.tsx', 'utf8');
const homeSource = readFileSync('app/(public)/page.tsx', 'utf8');

describe('enlaces canónicos a perfiles profesionales', () => {
  it('los artículos no enlazan autores a anchors legacy de despacho', () => {
    expect(blogSource).not.toContain('/despacho#${authorSlug}');
    expect(blogSource).toContain('`/equipo/${authorSlug}`');
    expect(blogSource).toContain("'thania-marlene-paz'");
    expect(blogSource).toContain("'emil-barahona'");
  });

  it('las tarjetas completas de despacho enlazan los tres perfiles', () => {
    for (const slug of [
      'danilo-pineda-maradiaga',
      'thania-marlene-paz',
      'emil-barahona',
    ]) {
      expect(despachoSource).toContain(`href="/equipo/${slug}"`);
    }
    expect(despachoSource.match(/aria-label=\{`Ver perfil completo de/g)).toHaveLength(3);
  });

  it('la Home ofrece acceso visible a los perfiles', () => {
    expect(homeSource).toContain('LAWYER_PROFILES.map');
    expect(homeSource).toContain('href={`/equipo/${profile.slug}`}');
  });
});
