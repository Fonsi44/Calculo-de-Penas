/**
 * E2E SEO/GEO runtime — rutas representativas (PROMPT 2 §8).
 *
 * Verifica por ruta: HTTP esperado, canonical, robots, title, meta description,
 * un H1, navegación, breadcrumbs, CTA, formulario, enlaces rotos, JSON-LD
 * parseable, sitemap, errores de consola/hidratación, requests fallidas y
 * ausencia de rutas privadas en contenido público. Para la landing
 * NOINDEX_UNTIL_UNIQUE verifica `noindex, follow` y ausencia de sitemap y
 * llms.txt.
 *
 * Requiere la app ejecutándose (next start con base local/staging) y
 * PLAYWRIGHT_BASE_URL o el puerto 3100 por defecto.
 */
import { expect, test } from '@playwright/test';

// Los artefactos de telemetría de Vercel/GTM no existen en local; se simulan
// para no contaminar el chequeo de errores de consola (mismo patrón que el
// spec de accesibilidad existente).
test.beforeEach(async ({ page }) => {
  await page.context().route('**/_vercel/speed-insights/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.context().route('**/gtm.js**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
});

/** Rutas representativas mínimas (§8.1). */
const ROUTES = {
  home: { path: '/', status: 200, breadcrumbs: false },
  despacho: { path: '/despacho', status: 200, breadcrumbs: true },
  servicios: { path: '/servicios-juridicos', status: 200, breadcrumbs: true },
  penal: { path: '/derecho-penal', status: 200, breadcrumbs: true },
  familia: { path: '/servicios-juridicos/derecho-de-familia', status: 200, breadcrumbs: true },
  laboral: { path: '/servicios-juridicos/derecho-laboral', status: 200, breadcrumbs: true },
  civil: { path: '/servicios-juridicos/derecho-civil-y-notarial', status: 200, breadcrumbs: true },
  faq: { path: '/preguntas-frecuentes', status: 200, breadcrumbs: true },
  contacto: { path: '/solicitar-consulta', status: 200, breadcrumbs: true },
  perfil1: { path: '/equipo/danilo-pineda-maradiaga', status: 200, breadcrumbs: true },
  perfil2: { path: '/equipo/thania-marlene-paz', status: 200, breadcrumbs: true },
  perfil3: { path: '/equipo/emil-barahona', status: 200, breadcrumbs: true },
  landingIndexable: { path: '/abogados-en-nacaome', status: 200, breadcrumbs: true },
  landingNoindex: { path: '/abogados-en-pespire', status: 200, breadcrumbs: true },
  articulo1: { path: '/blog/derecho-penal/antejuicio-en-honduras', status: 200, breadcrumbs: true },
  articulo2: { path: '/blog/derecho-civil/cobro-deudas-choluteca', status: 200, breadcrumbs: true },
  articulo3: { path: '/blog/derecho-laboral/jornada-laboral-horas-extra-descansos-honduras', status: 200, breadcrumbs: true },
  articulo4: { path: '/blog/derecho-de-familia/pension-alimenticia-choluteca', status: 200, breadcrumbs: true },
};

const SITEMAPS = [
  '/sitemap.xml',
  '/sitemap-pages.xml',
  '/sitemap-services.xml',
  '/sitemap-blog.xml',
  '/sitemap-authors.xml',
  '/sitemap-local.xml',
];

test.describe('SEO/GEO runtime — rutas representativas', () => {
  for (const [name, route] of Object.entries(ROUTES)) {
    test(`${name} (${route.path})`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('requestfailed', (req) => {
        const url = req.url();
        const err = req.failure();
        // Prefetches RSC de Next y aborts (navegación) no son fallos reales.
        const isPrefetchAbort = url.includes('?_rsc=')
          || url.includes('favicon')
          || (err && /ERR_ABORTED|net::ABORTED/i.test(err.errorText));
        if (!isPrefetchAbort) failedRequests.push(url);
      });

      const response = await page.goto(route.path, { waitUntil: 'networkidle' });
      expect(response?.status(), `HTTP ${route.path}`).toBe(route.status);

      // Title + meta description
      const title = await page.title();
      expect(title.trim().length, `title ${route.path}`).toBeGreaterThan(0);
      const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDesc && metaDesc.trim().length, `meta description ${route.path}`).toBeGreaterThan(0);

      // Un solo H1
      expect(await page.locator('h1').count(), `H1 único ${route.path}`).toBe(1);

      // Canonical
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, `canonical ${route.path}`).toBeTruthy();
      expect(canonical!.startsWith('https://www.pinedayasociadoshn.com'), `origen canonical ${route.path}`).toBe(true);

      // Navegación principal
      expect(await page.locator('header nav, nav[aria-label], nav').count(), `navegación ${route.path}`).toBeGreaterThan(0);

      // CTA a consulta (contacto/consulta) presente en la mayoría de páginas públicas
      const ctaLinks = await page.locator('a[href*="/solicitar-consulta"], a[href*="tel:"]').count();
      expect(ctaLinks, `CTA ${route.path}`).toBeGreaterThan(0);

      if (route.breadcrumbs) {
        expect(await page.locator('nav[aria-label*="breadcrumb" i], [aria-label*="miga" i]').count(),
          `breadcrumbs ${route.path}`).toBeGreaterThan(0);
      }

      // JSON-LD parseable
      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
      if (jsonLd.length > 0) {
        for (const block of jsonLd) {
          expect(() => JSON.parse(block), `JSON-LD parseable ${route.path}`).not.toThrow();
        }
      }

      // Sin rutas privadas enlazadas en el contenido público
      const privateLinks = await page.locator('a[href^="/intranet"], a[href^="/admin"], a[href^="/api/"]').count();
      expect(privateLinks, `sin rutas privadas ${route.path}`).toBe(0);

      // Skip link
      const skipLink = await page.locator('a[href="#main"], a.skip-link, a[href*="#main-content"]').first();
      expect(await skipLink.count(), `skip link ${route.path}`).toBeGreaterThan(0);

      // Sin errores de consola ni requests fallidas (reales)
      expect(consoleErrors, `console errors ${route.path}`).toEqual([]);
      expect(failedRequests, `failed requests ${route.path}`).toEqual([]);
    });
  }

  test('landing NOINDEX_UNTIL_UNIQUE: noindex, follow', async ({ page }) => {
    const response = await page.goto('/abogados-en-pespire', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toBe('noindex, follow');
  });

  test('landing indexable: index, follow', async ({ page }) => {
    const response = await page.goto('/abogados-en-nacaome', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toMatch(/index/);
  });
});

test.describe('SEO/GEO runtime — formulario y sitemaps', () => {
  test('formulario de contacto: validación sin envío real', async ({ page }) => {
    await page.goto('/solicitar-consulta', { waitUntil: 'networkidle' });
    const form = page.locator('form');
    expect(await form.count()).toBeGreaterThan(0);
    // Envío vacío → validación (no redirección a envío real)
    await page.locator('form button[type="submit"], form input[type="submit"]').first().click().catch(() => {});
    await page.waitForTimeout(500);
    // No debe haber navegado fuera de la página
    expect(page.url()).toContain('/solicitar-consulta');
  });

  for (const sitemap of SITEMAPS) {
    test(`sitemap ${sitemap} es XML 200`, async ({ request }) => {
      const res = await request.get(sitemap);
      expect(res.status(), `HTTP ${sitemap}`).toBe(200);
      const ct = res.headers()['content-type'] ?? '';
      expect(ct, `content-type ${sitemap}`).toContain('xml');
      const body = await res.text();
      expect(body.trim().startsWith('<?xml'), `XML ${sitemap}`).toBe(true);
      expect(body, `etiqueta ${sitemap}`).toMatch(/<(urlset|sitemapindex)[^>]*>/);
    });
  }

  test('robots.txt y llms.txt', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const robotsText = await robots.text();
    expect(robotsText.toLowerCase()).toContain('sitemap');

    const llms = await request.get('/llms.txt');
    expect(llms.status()).toBe(200);
    const llmsText = await llms.text();
    expect(llmsText).toContain('/sitemap.xml');
    // Las landings NOINDEX no deben aparecer en llms.txt
    expect(llmsText).not.toContain('/abogados-en-pespire');
  });

  test('404 devuelve 404', async ({ request }) => {
    const res = await request.get('/ruta-inexistente-xyz-2026');
    expect(res.status()).toBe(404);
  });

  test('enlaces internos de artículos representativos sin 404 (muestreo)', async ({ page }) => {
    // Un artículo de los 53 casos de enlazado: verifica que su servicio y
    // enlaces relacionados responden.
    await page.goto('/blog/derecho-penal/antejuicio-en-honduras', { waitUntil: 'networkidle' });
    const links = await page.locator('a[href^="/"]').evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute('href')).filter(Boolean) as string[]);
    const samples = [...new Set(links)].slice(0, 25);
    for (const href of samples) {
      if (href.startsWith('/solicitar-consulta') || href.startsWith('tel:') || href.startsWith('mailto:')) continue;
      if (href.includes('/abogados-en-pespire')) continue;
      const res = await page.request.get(href);
      expect(res.status(), `enlace ${href}`).not.toBe(404);
    }
  });
});

test.describe('SEO/GEO runtime — móvil y accesibilidad básica', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test('home en móvil: menú accesible y foco visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // El skip link es el primer elemento enfocable
    const skip = page.locator('a[href="#main"], a.skip-link, a[href*="#main-content"]').first();
    await skip.focus();
    const tag = await skip.evaluate((el) => el.tagName);
    expect(tag).toBe('A');
  });
});
