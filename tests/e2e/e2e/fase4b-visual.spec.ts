/**
 * Fase 4B — Validación visual del Lote 2 en producción.
 *
 * Se ejecuta contra producción con:
 *   PLAYWRIGHT_BASE_URL=https://www.pinedayasociadoshn.com \
 *     npx playwright test e2e/fase4b-visual.spec.ts
 *
 * Cubre los artículos mínimos exigidos por el enunciado §14:
 *   - 2 completed: pension-alimenticia-honduras-guia-completa, prescripcion-deudas-plazos-honduras
 *   - 1 con correcciones aplicadas: pension-alimenticia-porcentaje-honduras-2026
 *   - 1 degradado en Fase 4B (blocked→needs_human_review): custodia-hijos-honduras-juez
 *   - 2 needs_human_review adicionales: juicio-oral-etapas-..., despido-laboral-...
 *   - 1 blocked: contratos-arrendamiento-... (sin aviso esperado)
 *
 * Para cada uno valida, en escritorio y móvil:
 *   - HTTP 200, canonical correcta, H1 único.
 *   - Aviso AiReviewNotice coherente con el estado (cuando aplique).
 *   - Contenido actualizado visible (correcciones textuales).
 *   - Layout sin overflow horizontal.
 *   - Sin errores de consola ni respuestas 4xx/5xx propias.
 *   - Enlaces internos navegables (al menos 1).
 *   - CTA presente.
 *
 * Valida además el service worker (registro + BUILD_ID real) en el spec
 * de Fase 3E; aquí solo se confirma que /sw.js sigue sirviéndose.
 */
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOTS_DIR = resolve(process.cwd(), '.tmp/fase4b-shots');
mkdirSync(SHOTS_DIR, { recursive: true });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';

interface ArticuloCheck {
  slug: string;
  categoria: string;
  estado: 'completed' | 'needs_human_review' | 'blocked';
  // Textos que deben aparecer (correcciones aplicadas)
  textosNuevos?: string[];
  // Textos que NO deben aparecer (textos antiguos prohibidos)
  textosAntiguos?: string[];
  // Indica si se espera aviso AiReviewNotice
  avisoEsperado?: boolean;
}

const ARTICULOS: ArticuloCheck[] = [
  // 2 completed
  {
    slug: 'pension-alimenticia-honduras-guia-completa',
    categoria: 'derecho-de-familia',
    estado: 'completed',
    avisoEsperado: true,
  },
  {
    slug: 'prescripcion-deudas-plazos-honduras',
    categoria: 'derecho-civil',
    estado: 'completed',
    avisoEsperado: true,
  },
  // Artículo con las 3 correcciones aplicadas al body
  {
    slug: 'pension-alimenticia-porcentaje-honduras-2026',
    categoria: 'derecho-de-familia',
    estado: 'needs_human_review',
    textosNuevos: ['Código de Familia (Decreto 76-84)', 'Arts. 207-225'],
    textosAntiguos: ['Artículo 1069', 'Artículo 1230', 'Artículo 1593'],
    avisoEsperado: true,
  },
  // Degradado en Fase 4B (blocked → needs_human_review)
  {
    slug: 'custodia-hijos-honduras-juez',
    categoria: 'derecho-de-familia',
    estado: 'needs_human_review',
    avisoEsperado: true,
  },
  // Otros needs_human_review
  {
    slug: 'juicio-oral-etapas-que-esperar-honduras',
    categoria: 'proceso-penal',
    estado: 'needs_human_review',
    avisoEsperado: true,
  },
  {
    slug: 'despido-laboral-honduras-guia-completa',
    categoria: 'derecho-laboral',
    estado: 'needs_human_review',
    avisoEsperado: true,
  },
  // 1 blocked (sin aviso esperado)
  {
    slug: 'contratos-arrendamiento-derechos-obligaciones-honduras',
    categoria: 'derecho-civil',
    estado: 'blocked',
    avisoEsperado: false,
  },
];

function attachCollectors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const badResponses: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });
  page.on('response', (res) => {
    const status = res.status();
    const url = res.url();
    const isExternal =
      !url.startsWith(BASE) && !url.startsWith('https://www.pinedayasociadoshn.com');
    if ((status >= 400 || status === 0) && !isExternal) {
      badResponses.push(`${status} ${url}`);
    }
  });

  return { consoleErrors, pageErrors, badResponses };
}

async function checkArticulo(
  page: Page,
  art: ArticuloCheck,
  viewport: 'desktop' | 'mobile',
) {
  const url = `${BASE}/blog/${art.categoria}/${art.slug}`;
  const collectors = attachCollectors(page);

  const res = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  expect(res?.status(), `HTTP 200 para ${art.slug}`).toBe(200);

  // Canonical presente y correcta.
  const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
  expect(canonical, `canonical presente para ${art.slug}`).toBeTruthy();
  expect(canonical).toContain(`/blog/${art.categoria}/${art.slug}`);

  // H1 único (R15).
  const h1Count = await page.locator('h1').count();
  expect(h1Count, `un solo h1 en ${art.slug}`).toBe(1);

  // JSON-LD con BlogPosting (debe existir al menos un bloque válido).
  const jsonLdCount = await page.locator('script[type="application/ld+json"]').count();
  expect(jsonLdCount, `al menos un JSON-LD en ${art.slug}`).toBeGreaterThan(0);

  const bodyText = await page
    .locator('body')
    .innerText({ timeout: 10_000 })
    .catch(() => '');

  // Textos nuevos presentes (correcciones aplicadas).
  if (art.textosNuevos) {
    for (const t of art.textosNuevos) {
      expect(bodyText, `texto nuevo presente en ${art.slug}: "${t}"`).toContain(t);
    }
  }
  // Textos antiguos ausentes.
  if (art.textosAntiguos) {
    for (const t of art.textosAntiguos) {
      expect(bodyText, `texto antiguo ausente en ${art.slug}: "${t}"`).not.toContain(t);
    }
  }

  // Aviso AiReviewNotice coherente con el estado.
  const copyCompleted = /Contenido contrastado documentalmente/i.test(bodyText);
  const copyNeedsReview = /cuestiones pendientes de revisi[oó]n jur[ií]dica/i.test(
    bodyText,
  );
  if (art.avisoEsperado === true) {
    // Tanto completed como needs_human_review muestran aviso; el copy varía.
    if (art.estado === 'completed') {
      expect(
        copyCompleted,
        `aviso 'contrastado documentalmente' en completed ${art.slug}`,
      ).toBe(true);
    } else if (art.estado === 'needs_human_review') {
      expect(
        copyNeedsReview,
        `aviso 'pendientes de revisión jurídica' en needs_human_review ${art.slug}`,
      ).toBe(true);
    }
  }

  // Enlaces internos navegables: al menos un <a href="/...">.
  const internalLinks = await page.locator('a[href^="/"]').count();
  expect(internalLinks, `al menos 1 enlace interno en ${art.slug}`).toBeGreaterThan(0);

  // CTA presente: botón/enlace de consulta (texto común).
  const ctaPresente =
    /solicitar consulta|consultar ahora|consulta gratis|hablar con un abogado|cont[áa]ctanos/i.test(
      bodyText,
    );
  expect(ctaPresente, `CTA presente en ${art.slug}`).toBe(true);

  // Layout: sin overflow horizontal.
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow, `sin overflow horizontal en ${art.slug} (${viewport})`).toBeLessThanOrEqual(2);

  // Errores de consola: filtramos analítica externa.
  const criticalConsoleErrors = collectors.consoleErrors.filter(
    (e) => !/clarity|gtm|google|analytics|chrome-extension|googletagmanager/i.test(e),
  );
  expect(
    criticalConsoleErrors,
    `sin errores de consola críticos en ${art.slug} (${viewport})`,
  ).toEqual([]);

  // Page errors siempre críticos.
  expect(collectors.pageErrors, `sin pageerrors en ${art.slug} (${viewport})`).toEqual([]);

  // Sin 4xx/5xx propias.
  expect(
    collectors.badResponses,
    `sin respuestas 4xx/5xx propias en ${art.slug} (${viewport})`,
  ).toEqual([]);

  // Screenshot de evidencia.
  await page.screenshot({
    path: resolve(SHOTS_DIR, `${art.slug}-${viewport}.png`),
    fullPage: false,
  });
}

// ─── Desktop ───────────────────────────────────────────────────────────────
test.describe('@production-only Fase 4B — Validación visual Lote 2 (Desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const art of ARTICULOS) {
    test(`desktop — ${art.slug} (${art.estado})`, async ({ page }) => {
      await checkArticulo(page, art, 'desktop');
    });
  }
});

// ─── Mobile (iPhone 13) ────────────────────────────────────────────────────
test.describe('@production-only Fase 4B — Validación visual Lote 2 (Mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  for (const art of ARTICULOS) {
    test(`mobile — ${art.slug} (${art.estado})`, async ({ page }) => {
      await checkArticulo(page, art, 'mobile');
    });
  }
});

// ─── Service worker sigue sirviéndose en este deployment ───────────────────
test.describe('@production-only Fase 4B — Service worker en producción', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('/sw.js sirve SW con BUILD_ID real', async ({ request }) => {
    const res = await request.get(`${BASE}/sw.js`);
    expect(res.status(), '/sw.js HTTP 200').toBe(200);
    const body = await res.text();
    expect(body, 'SW contiene CACHE pineda-pwa').toContain('pineda-pwa');
    expect(body, 'SW NO contiene placeholder __BUILD_ID__').not.toContain('__BUILD_ID__');
    const contentType = res.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/javascript|text\/javascript/i);
    if (BASE.includes('pinedayasociadoshn.com')) {
      expect(body, 'SW NO tiene cache dev en producción').not.toContain("'dev' === 'dev'");
    }
  });
});
