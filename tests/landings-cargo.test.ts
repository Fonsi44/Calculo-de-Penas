import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARGO_HUB, landingsCargo } from '@/data/landings-cargo';

const ROOT = resolve(__dirname, '..');

function readPublicCargo(rel: string): string {
  return readFileSync(resolve(ROOT, 'app/(public)', rel, 'page.tsx'), 'utf8');
}

describe('landings de cargo data-driven', () => {
  it('registra exactamente las 5 URLs existentes', () => {
    expect(landingsCargo.map((c) => c.path).sort()).toEqual([
      '/abogado-civil-nacaome',
      '/abogado-de-familia-nacaome',
      '/abogado-laboralista-nacaome',
      '/abogado-penalista-choluteca',
      '/abogado-penalista-nacaome',
    ]);
  });

  it('cada cargo tiene puente a hub, abogado y máximo 3 FAQ locales', () => {
    for (const cargo of landingsCargo) {
      expect(CARGO_HUB[cargo.area].href).toMatch(/^\//);
      expect(cargo.lawyer).toMatch(/danilo|thania|emil/);
      expect(cargo.faqs.length).toBeGreaterThan(0);
      expect(cargo.faqs.length).toBeLessThanOrEqual(3);
    }
  });

  it('no publica 24/7 operativo ni rangos de pensión no verificados', () => {
    const blob = JSON.stringify(landingsCargo);
    expect(blob).not.toMatch(/24\/7/);
    expect(blob).not.toMatch(/15\s*%\s*y\s*el\s*50/);
    expect(blob).not.toMatch(/a cualquier hora/i);
  });

  it('las 5 páginas delegan en CargoLandingView', () => {
    const slugs = [
      'abogado-penalista-nacaome',
      'abogado-penalista-choluteca',
      'abogado-de-familia-nacaome',
      'abogado-laboralista-nacaome',
      'abogado-civil-nacaome',
    ];
    for (const slug of slugs) {
      const src = readPublicCargo(slug);
      expect(src).toContain('CargoLandingView');
      expect(src).toContain('getCargoByPath');
    }
  });

  it('ciudades indexables enlazan el cargo penalista correspondiente y Nacaome no empuja NOINDEX', () => {
    const choluteca = readFileSync(resolve(ROOT, 'app/(public)/abogados-en-choluteca/page.tsx'), 'utf8');
    const nacaome = readFileSync(resolve(ROOT, 'app/(public)/abogados-en-nacaome/page.tsx'), 'utf8');
    const elTriunfo = readFileSync(resolve(ROOT, 'app/(public)/abogados-en-el-triunfo/page.tsx'), 'utf8');
    const goascoran = readFileSync(resolve(ROOT, 'app/(public)/abogados-en-goascoran/page.tsx'), 'utf8');
    expect(choluteca).toContain("href: '/abogado-penalista-choluteca'");
    expect(elTriunfo).toContain("href=\"/abogado-penalista-choluteca\"");
    expect(goascoran).toContain("href=\"/abogado-penalista-nacaome\"");
    expect(nacaome).not.toContain('/abogados-en-langue');
    expect(nacaome).not.toContain('/abogados-en-caridad');
    expect(nacaome).not.toContain('/abogados-en-alianza');
  });
});
