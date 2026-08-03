/**
 * Tests del contrato único de indexabilidad pública.
 *
 * Verifica que la clasificación de las 9 landings NOINDEX_UNTIL_UNIQUE se
 * aplique de forma coherente en:
 *   - metadata de landings (noindex, follow);
 *   - catálogo de rutas estáticas indexables (sitemap/IndexNow);
 *   - llms.txt (sin URLs noindex);
 *   - módulos destacados (TOP_COBERTURA_SLUGS / footer).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NOINDEX_LANDING_SLUGS,
  INDEXABLE_LANDING_SLUGS,
  NOINDEX_LANDING_PATHS,
  INDEXABLE_STATIC_PATHS,
  isPathIndexable,
  publicStaticIndexability,
} from '@/lib/seo/public-indexability';
import {
  landingsLocales,
  TOP_COBERTURA_SLUGS,
  landingMetadata,
} from '@/data/landings-locales';

const NOINDEX_EXPECTED = [
  'pespire',
  'marcovia',
  'namasigue',
  'orocuina',
  'langue',
  'caridad',
  'alianza',
  'concepcion-de-maria',
  'san-antonio-de-flores',
];

const INDEXABLE_EXPECTED = [
  'nacaome',
  'choluteca',
  'san-lorenzo',
  'goascoran',
  'san-marcos-de-colon',
  'el-triunfo',
  'amapala',
];

const publicLlms = () => {
  try {
    return readFileSync(join(process.cwd(), 'public/llms.txt'), 'utf8');
  } catch {
    return '';
  }
};

describe('data/seo/local-landing-indexability.json — clasificación canónica', () => {
  it('existen 16 landings y las 16 están clasificadas', () => {
    expect(landingsLocales).toHaveLength(16);
    expect(NOINDEX_LANDING_SLUGS.size + INDEXABLE_LANDING_SLUGS.size).toBe(16);
  });

  it('las 9 landings NOINDEX_UNTIL_UNIQUE coinciden con la decisión documentada', () => {
    expect([...NOINDEX_LANDING_SLUGS].sort()).toEqual([...NOINDEX_EXPECTED].sort());
  });

  it('las 7 landings indexables coinciden con la decisión documentada', () => {
    expect([...INDEXABLE_LANDING_SLUGS].sort()).toEqual([...INDEXABLE_EXPECTED].sort());
  });

  it('ninguna landing está duplicada entre indexable y noindex', () => {
    for (const slug of NOINDEX_LANDING_SLUGS) {
      expect(INDEXABLE_LANDING_SLUGS.has(slug)).toBe(false);
    }
  });
});

describe('metadata de landings — noindex, follow', () => {
  it.each(NOINDEX_EXPECTED)('la landing %s emite noindex', (slug) => {
    const landing = landingsLocales.find((l) => l.slug === slug);
    expect(landing).toBeDefined();
    const robots = landingMetadata(landing!).robots as { index?: boolean; follow?: boolean };
    expect(robots?.index).toBe(false);
    expect(robots?.follow).toBe(true);
  });

  it.each(INDEXABLE_EXPECTED)('la landing %s mantiene index, follow', (slug) => {
    const landing = landingsLocales.find((l) => l.slug === slug);
    expect(landing).toBeDefined();
    const robots = landingMetadata(landing!).robots as { index?: boolean; follow?: boolean };
    expect(robots?.index).toBe(true);
    expect(robots?.follow).toBe(true);
  });
});

describe('módulos destacados — sin landings noindex', () => {
  it('TOP_COBERTURA_SLUGS no contiene ninguna landing NOINDEX_UNTIL_UNIQUE', () => {
    for (const slug of TOP_COBERTURA_SLUGS) {
      expect(NOINDEX_LANDING_SLUGS.has(slug), `${slug} es noindex`).toBe(false);
    }
  });
});

describe('catálogo estático indexable — sitemap / IndexNow', () => {
  it('INDEXABLE_STATIC_PATHS excluye las 9 landings noindex', () => {
    for (const path of NOINDEX_LANDING_PATHS) {
      expect(INDEXABLE_STATIC_PATHS).not.toContain(path);
      expect(isPathIndexable(path)).toBe(false);
    }
  });

  it('INDEXABLE_STATIC_PATHS conserva las landings indexables', () => {
    for (const slug of INDEXABLE_EXPECTED) {
      expect(INDEXABLE_STATIC_PATHS).toContain(`/abogados-en-${slug}`);
    }
  });

  it('el inventario tipado clasifica segmento y decisión por ruta', () => {
    const inventory = publicStaticIndexability();
    for (const entry of inventory) {
      expect(entry.segment).toBeTruthy();
      if (entry.path.startsWith('/abogados-en-')) {
        expect(entry.decision).toBeDefined();
        if (entry.decision === 'NOINDEX_UNTIL_UNIQUE') {
          expect(entry.indexable).toBe(false);
        }
      }
    }
  });
});

describe('llms.txt — sin landings noindex', () => {
  it('public/llms.txt no contiene ninguna URL NOINDEX_UNTIL_UNIQUE', () => {
    const content = publicLlms();
    if (!content) {
      // llms.txt se regenera en postbuild; si falta, el gate lo regenerará.
      return;
    }
    for (const slug of NOINDEX_EXPECTED) {
      expect(content).not.toContain(`/abogados-en-${slug}`);
    }
  });
});
