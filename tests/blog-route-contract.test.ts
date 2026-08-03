import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BLOG_METADATA_OVERRIDES } from '@/data/blog/blog-metadata-overrides';
import { BLOG_ROUTE_DECISIONS } from '@/data/blog/blog-route-decisions';

const nextConfig = readFileSync('next.config.ts', 'utf8');
const sitemap = readFileSync('lib/seo/sitemap.ts', 'utf8');
const redirects = [...nextConfig.matchAll(
  /source:\s*'([^']*\/blog\/[^']*)',\s*destination:\s*'([^']+)',\s*permanent:\s*true/g,
)].map((match) => ({ source: match[1], destination: match[2] }));

describe('contrato de rutas del blog', () => {
  it('no contiene loops', () => {
    expect(redirects.filter((item) => item.source === item.destination)).toEqual([]);
  });

  it('no contiene chains evitables', () => {
    const sources = new Set(redirects.map((item) => item.source));
    expect(redirects.filter((item) => sources.has(item.destination))).toEqual([]);
  });

  it('no duplica fuentes', () => {
    expect(new Set(redirects.map((item) => item.source)).size).toBe(redirects.length);
  });

  it('el sitemap excluye fuentes de redirect', () => {
    expect(sitemap).toContain('REDIRECT_SOURCE_PATHS');
    expect(sitemap).toContain(
      '/blog/derecho-civil/herencias-honduras-fallece-familiar',
    );
  });

  it('mantiene documentada la consolidación histórica de herencias', () => {
    const source = '/blog/derecho-civil/herencias-honduras-fallece-familiar';
    const decision = BLOG_ROUTE_DECISIONS[source];
    expect(decision.contract).toBe('HISTORICAL_REDIRECT');
    expect(decision.destination).toBe(
      '/blog/derecho-civil/testamentos-sucesiones-herencia-honduras',
    );
    expect(redirects).toContainEqual({
      source,
      destination: decision.destination,
    });
  });

  it('no mantiene metadata activa para el origen consolidado', () => {
    expect(BLOG_METADATA_OVERRIDES['herencias-honduras-fallece-familiar'])
      .toBeUndefined();
  });

  it('mantiene metadata propia en el destino publicado', () => {
    const metadata = BLOG_METADATA_OVERRIDES[
      'testamentos-sucesiones-herencia-honduras'
    ];
    expect(metadata?.title).toContain('Testamentos y sucesiones');
    expect(metadata?.metaDescription).toContain('trámite hereditario');
  });

  it('conserva el baseline corporal', () => {
    const baseline = readFileSync(
      'docs/seo/current/blog-body-freeze-baseline.csv',
      'utf8',
    );
    const after = readFileSync(
      'docs/seo/current/blog-body-freeze-after.csv',
      'utf8',
    );
    expect(after).toBe(baseline);
    expect(baseline.trim().split('\n')).toHaveLength(176);
  });
});
