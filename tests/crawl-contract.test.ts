import { describe, expect, it } from 'vitest';
import { buildRobots } from '@/app/robots';
import {
  ALLOWED_CRAWLER_USER_AGENTS,
  FULLY_BLOCKED_USER_AGENTS,
  PUBLIC_CRAWLER_DISALLOW_PATHS,
} from '@/lib/crawl-policy';
import {
  sitemapIndexXml,
  sitemapXml,
} from '@/lib/sitemap-xml';
import {
  buildSitemapIndex,
  isDatabaseConfiguredAtRuntime,
  PUBLIC_ROUTES,
} from '@/lib/seo/sitemap';
import { site } from '@/lib/site';

type Rule = {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
};

function list(value?: string | string[]): string[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function rules(noindex = false): Rule[] {
  const value = buildRobots(noindex).rules;
  return (Array.isArray(value) ? value : [value]) as Rule[];
}

function canCrawl(userAgent: string, path: string, noindex = false): boolean {
  const all = rules(noindex);
  const exact = all.filter((rule) =>
    list(rule.userAgent).some((agent) => agent !== '*' && userAgent.toLowerCase().includes(agent.toLowerCase())),
  );
  const selected = exact.length
    ? exact
    : all.filter((rule) => list(rule.userAgent).includes('*'));
  const matches = selected.flatMap((rule) => [
    ...list(rule.allow).filter((pattern) => path.startsWith(pattern)).map((pattern) => ({ pattern, allow: true })),
    ...list(rule.disallow).filter((pattern) => path.startsWith(pattern)).map((pattern) => ({ pattern, allow: false })),
  ]).sort((a, b) => b.pattern.length - a.pattern.length);
  return matches[0]?.allow ?? true;
}

describe('semántica del contrato robots', () => {
  it.each(ALLOWED_CRAWLER_USER_AGENTS)('%s bloquea todas las rutas privadas', (agent) => {
    for (const path of PUBLIC_CRAWLER_DISALLOW_PATHS) {
      expect(canCrawl(agent, `${path}prueba`), `${agent} permitió ${path}`).toBe(false);
    }
  });

  it.each([...ALLOWED_CRAWLER_USER_AGENTS, 'UnlistedCrawler'])(
    '%s puede rastrear superficies públicas',
    (agent) => {
      for (const path of ['/', '/blog', '/servicios-juridicos/derecho-laboral', '/images/logo.png']) {
        expect(canCrawl(agent, path), `${agent} bloqueó ${path}`).toBe(true);
      }
    },
  );

  it.each(FULLY_BLOCKED_USER_AGENTS)('%s permanece bloqueado por completo', (agent) => {
    expect(canCrawl(agent, '/')).toBe(false);
    expect(canCrawl(agent, '/blog')).toBe(false);
  });

  it('el comodín bloquea API, intranet y errores', () => {
    for (const path of ['/api/consulta', '/api/contacto', '/api/email/inbound', '/intranet/', '/admin/', '/404', '/500', '/_not-found']) {
      expect(canCrawl('UnlistedCrawler', path), path).toBe(false);
    }
  });

  it('Preview bloquea todo y no anuncia sitemap', () => {
    const preview = buildRobots(true);
    expect(canCrawl('Googlebot', '/', true)).toBe(false);
    expect(preview.sitemap).toBeUndefined();
  });

  it('Production anuncia exclusivamente el sitemap raíz', () => {
    expect(buildRobots(false).sitemap).toBe(`${site.url}/sitemap.xml`);
  });
});

describe('arquitectura y XML del sitemap index', () => {
  it('el sitemap index referencia los cinco segmentos segmentados', () => {
    const index = buildSitemapIndex();
    expect(index.map((entry) => entry.url)).toEqual([
      `${site.url}/sitemap-pages.xml`,
      `${site.url}/sitemap-services.xml`,
      `${site.url}/sitemap-blog.xml`,
      `${site.url}/sitemap-authors.xml`,
      `${site.url}/sitemap-local.xml`,
    ]);
  });

  it('genera un sitemap index XML válido', () => {
    const xml = sitemapIndexXml([{ url: `${site.url}/sitemap-pages.xml` }]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>');
    expect(xml).not.toContain('<urlset');
  });

  it('genera un urlset XML válido y escapa entidades', () => {
    const xml = sitemapXml([{
      url: `${site.url}/ruta?x=1&y=2`,
      changeFrequency: 'monthly',
      priority: 0.8,
    }]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('&amp;');
    expect(xml).not.toContain('<sitemapindex');
  });

  it('las rutas estáticas son HTTPS, Production, sin query ni privadas', () => {
    for (const route of PUBLIC_ROUTES) {
      const url = new URL(route.path, site.url);
      expect(url.protocol).toBe('https:');
      expect(url.origin).toBe(site.url);
      expect(url.search).toBe('');
      expect(url.hash).toBe('');
      expect(PUBLIC_CRAWLER_DISALLOW_PATHS.some((prefix) => url.pathname.startsWith(prefix))).toBe(false);
    }
  });

  it('no duplica rutas estáticas', () => {
    expect(new Set(PUBLIC_ROUTES.map((route) => route.path)).size).toBe(PUBLIC_ROUTES.length);
  });
});

describe('fuente runtime segura', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['postgresql://placeholder:placeholder@localhost/db', false],
    ['postgresql://x:x@localhost:5432/placeholder', false],
    ['postgresql://readonly@example.test/db', true],
    ['[SENSITIVE]', false],
    ['not-a-url', false],
    ['https://example.test/db', false],
  ])('clasifica DATABASE_URL sin congelarla: %s', (value, expected) => {
    expect(isDatabaseConfiguredAtRuntime(value)).toBe(expected);
  });
});
