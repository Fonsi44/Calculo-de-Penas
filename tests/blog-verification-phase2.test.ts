import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import nextConfig from '../next.config';
import sitemap from '../app/sitemap';
import { GET as getFeed } from '../app/(public)/blog/feed.xml/route';
import { getPublishedPosts } from '../lib/blog-db';
import { getTotalPages, getPostsByPage } from '../lib/blog';

// Mock de base de datos para simular caídas de Neon
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    selectDistinct: vi.fn(),
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
      })),
    })),
  },
}));

describe('Fase 2 — Suite de Integración y Hardening del Blog', () => {
  
  describe('1. Redirecciones 301/308 de posts locales', () => {
    it('las 6 redirecciones locales vigentes están configuradas y Nacaome queda informativo', async () => {
      const redirects = await nextConfig.redirects?.();
      expect(redirects).toBeDefined();
      if (!redirects) return;

      const localRedirects = [
        { src: '/blog/practica-legal/abogados-en-choluteca', dest: '/abogados-en-choluteca' },
        { src: '/blog/practica-legal/abogados-en-san-lorenzo', dest: '/abogados-en-san-lorenzo' },
        { src: '/blog/practica-legal/abogados-en-pespire-choluteca', dest: '/abogados-en-pespire' },
        { src: '/blog/practica-legal/abogados-en-marcovia-choluteca', dest: '/abogados-en-marcovia' },
        { src: '/blog/practica-legal/abogados-en-san-marcos-de-colon-choluteca', dest: '/abogados-en-san-marcos-de-colon' },
        { src: '/blog/practica-legal/abogados-en-amapala-valle', dest: '/abogados-en-amapala' },
      ];

      for (const rule of localRedirects) {
        const match = redirects.find((r: { source: string; destination: string; permanent: boolean }) => r.source === rule.src);
        expect(match).toBeDefined();
        expect(match?.destination).toBe(rule.dest);
        expect(match?.permanent).toBe(true);
      }
      expect(redirects.some((rule: { source: string }) => (
        rule.source === '/blog/practica-legal/abogados-en-nacaome'
      ))).toBe(false);
    });

    it('no existen redirecciones circulares ni en cadena entre los 6 posts locales y sus destinos', async () => {
      const redirects = await nextConfig.redirects?.() || [];
      const sources = new Set(redirects.map((r: { source: string }) => r.source));
      
      const localDestinations = [
        '/abogados-en-choluteca',
        '/abogados-en-san-lorenzo',
        '/abogados-en-pespire',
        '/abogados-en-marcovia',
        '/abogados-en-san-marcos-de-colon',
        '/abogados-en-amapala'
      ];

      for (const dest of localDestinations) {
        // Ninguno de los destinos comerciales debe ser origen de otra redirección (evitando cadenas/bucles)
        expect(sources.has(dest)).toBe(false);
      }
    });
  });

  describe('2. Hardening del Sitemap y RSS', () => {
    it('ninguno de los 6 posts locales redirigidos aparece en sitemap.ts', async () => {
      // Incluso si la DB estuviera online, las URL están excluidas vía REDIRECT_SOURCE_PATHS
      const urls = await sitemap();
      const urlsSet = new Set(urls.map(u => new URL(u.url).pathname));

      const pathsToExclude = [
        '/blog/practica-legal/abogados-en-choluteca',
        '/blog/practica-legal/abogados-en-san-lorenzo',
        '/blog/practica-legal/abogados-en-pespire-choluteca',
        '/blog/practica-legal/abogados-en-marcovia-choluteca',
        '/blog/practica-legal/abogados-en-san-marcos-de-colon-choluteca',
        '/blog/practica-legal/abogados-en-amapala-valle',
      ];

      for (const path of pathsToExclude) {
        expect(urlsSet.has(path)).toBe(false);
      }
    });

    it('ninguno de los 6 posts locales redirigidos aparece en el feed RSS', async () => {
      // RSS consume getAllPosts() que filtra por published = true. Al estar despublicados,
      // no deben listarse en el XML.
      const res = await getFeed();
      const body = await res.text();

      const slugsToExclude = [
        'abogados-en-choluteca',
        'abogados-en-san-lorenzo',
        'abogados-en-pespire-choluteca',
        'abogados-en-marcovia-choluteca',
        'abogados-en-san-marcos-de-colon-choluteca',
        'abogados-en-amapala-valle',
      ];

      for (const slug of slugsToExclude) {
        expect(body).not.toContain(`/blog/practica-legal/${slug}`);
      }
    });
  });

  describe('3. Paginación y control de rangos (404)', () => {
    it('getTotalPages y getPostsByPage funcionan correctamente', () => {
      const postsFake = Array.from({ length: 25 }, (_, i) => ({ slug: `post-${i}` })) as unknown as Parameters<typeof getTotalPages>[0];
      const perPage = 10;
      
      expect(getTotalPages(postsFake, perPage)).toBe(3); // 25 / 10 = 3 páginas
      
      const page1 = getPostsByPage(postsFake, 1, perPage);
      expect(page1.length).toBe(10);
      expect(page1[0].slug).toBe('post-0');
      
      const page3 = getPostsByPage(postsFake, 3, perPage);
      expect(page3.length).toBe(5);
      expect(page3[0].slug).toBe('post-20');
    });
  });

  describe('4. Resiliencia de Base de Datos y Degradación en Runtime', () => {
    let originalEnv: string | undefined;

    beforeAll(() => {
      originalEnv = process.env.DATABASE_URL;
    });

    afterAll(() => {
      process.env.DATABASE_URL = originalEnv;
    });

    it('lanza un error explícito en runtime si la base de datos es inalcanzable', async () => {
      // Activamos la simulación de caída de base de datos
      process.env.TEST_SIMULATE_DB_DOWN = 'true';
      
      // Aseguramos que no estamos simulando el build phase
      const originalPhase = process.env.NEXT_PHASE;
      delete process.env.NEXT_PHASE;

      await expect(getPublishedPosts()).rejects.toThrow(/DATABASE_URL no configurada/i);

      // Restauramos
      if (originalPhase) process.env.NEXT_PHASE = originalPhase;
      delete process.env.TEST_SIMULATE_DB_DOWN;
    });

    it('retorna una lista vacía en build phase si la base de datos es inalcanzable', async () => {
      process.env.TEST_SIMULATE_DB_DOWN = 'true';
      
      // Simulamos fase de compilación
      process.env.NEXT_PHASE = 'phase-production-build';

      const posts = await getPublishedPosts();
      expect(posts).toEqual([]);
      
      delete process.env.NEXT_PHASE;
      delete process.env.TEST_SIMULATE_DB_DOWN;
    });
  });
});
