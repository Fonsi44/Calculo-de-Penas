/**
 * Tests de la arquitectura de sitemaps segmentados.
 *
 * Verifica:
 *   - el sitemap index referencia los 5 segmentos con origen canónico HTTPS;
 *   - los segmentos estáticos (pages/services/authors/local) no contienen
 *     URLs privadas, noindex ni duplicadas, y usan el origen canónico;
 *   - el segmento local excluye las 9 landings NOINDEX_UNTIL_UNIQUE;
 *   - no existen solapamientos entre segmentos.
 */
import { describe, expect, it } from 'vitest';
import {
  buildPagesSitemap,
  buildServicesSitemap,
  buildAuthorsSitemap,
  buildLocalSitemap,
  buildSitemapIndex,
  REDIRECT_SOURCE_PATHS,
} from '@/lib/seo/sitemap';
import { NOINDEX_LANDING_PATHS } from '@/lib/seo/public-indexability';
import { PUBLIC_CRAWLER_DISALLOW_PATHS } from '@/lib/crawl-policy';
import { site } from '@/lib/site';

const ORIGIN = site.url;

async function urlsOf(entries: Awaited<ReturnType<typeof buildPagesSitemap>>) {
  return entries.map((entry) => entry.url);
}

function pathOf(url: string): string {
  return new URL(url).pathname;
}

describe('sitemap index', () => {
  it('referencia exactamente los 5 segmentos en HTTPS canónico', () => {
    const index = buildSitemapIndex();
    expect(index.map((entry) => entry.url)).toEqual([
      `${ORIGIN}/sitemap-pages.xml`,
      `${ORIGIN}/sitemap-services.xml`,
      `${ORIGIN}/sitemap-blog.xml`,
      `${ORIGIN}/sitemap-authors.xml`,
      `${ORIGIN}/sitemap-local.xml`,
    ]);
  });
});

describe('segmentos estáticos', () => {
  it('pages/services/authors/local no contienen rutas privadas', async () => {
    const all = [
      ...await urlsOf(await buildPagesSitemap()),
      ...await urlsOf(await buildServicesSitemap()),
      ...await urlsOf(await buildAuthorsSitemap()),
      ...await urlsOf(await buildLocalSitemap()),
    ];
    const paths = all.map(pathOf);
    for (const prefix of PUBLIC_CRAWLER_DISALLOW_PATHS) {
      expect(paths.some((p) => p.startsWith(prefix))).toBe(false);
    }
  });

  it('los segmentos estáticos usan el origen canónico HTTPS sin query', async () => {
    const all = [
      ...await urlsOf(await buildPagesSitemap()),
      ...await urlsOf(await buildServicesSitemap()),
      ...await urlsOf(await buildAuthorsSitemap()),
      ...await urlsOf(await buildLocalSitemap()),
    ];
    for (const url of all) {
      const parsed = new URL(url);
      expect(parsed.protocol).toBe('https:');
      expect(parsed.origin).toBe(ORIGIN);
      expect(parsed.search).toBe('');
      expect(parsed.hash).toBe('');
    }
  });

  it('no hay URLs duplicadas entre segmentos', async () => {
    const all = [
      ...await urlsOf(await buildPagesSitemap()),
      ...await urlsOf(await buildServicesSitemap()),
      ...await urlsOf(await buildAuthorsSitemap()),
      ...await urlsOf(await buildLocalSitemap()),
    ];
    expect(new Set(all).size).toBe(all.length);
  });

  it('el segmento local excluye las 9 landings NOINDEX_UNTIL_UNIQUE', async () => {
    const localUrls = await urlsOf(await buildLocalSitemap());
    const localPaths = localUrls.map(pathOf);
    for (const noindexPath of NOINDEX_LANDING_PATHS) {
      expect(localPaths).not.toContain(noindexPath);
    }
  });

  it('el segmento local solo contiene landings (abogados-en / abogado-)', async () => {
    const localUrls = await urlsOf(await buildLocalSitemap());
    for (const url of localUrls) {
      const path = pathOf(url);
      expect(path.startsWith('/abogados-en-') || path.startsWith('/abogado-')).toBe(true);
    }
  });

  it('el segmento authors solo contiene /equipo/', async () => {
    const authors = await urlsOf(await buildAuthorsSitemap());
    for (const url of authors) {
      expect(pathOf(url)).toMatch(/^\/equipo\//);
    }
    expect(authors).toContain(`${ORIGIN}/equipo/alfons-roiget-gimenez`);
  });

  it('el segmento services solo contiene rutas de servicios', async () => {
    const services = await urlsOf(await buildServicesSitemap());
    for (const url of services) {
      const path = pathOf(url);
      expect(
        path === '/servicios-juridicos'
        || path.startsWith('/servicios-juridicos/')
        || path === '/derecho-penal'
        || path.startsWith('/derecho-penal/')
        || path === '/hondurenos-en-espana'
        || path.startsWith('/hondurenos-en-espana/'),
      ).toBe(true);
    }
  });

  it('REDIRECT_SOURCE_PATHS permanece declarado para el gate de blog', () => {
    expect(REDIRECT_SOURCE_PATHS.size).toBeGreaterThan(10);
  });
});
