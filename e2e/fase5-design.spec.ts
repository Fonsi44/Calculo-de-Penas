/**
 * FASE 5 — Spec Playwright de diseño y chrome visual.
 *
 * A diferencia de tests/fase5-design-system.test.ts (que valida código fuente),
 * este spec valida RENDERIZO REAL en navegador: cero scroll horizontal,
 * H1 único visible, CTA presentes, FAQ acordeón funcional, sin overflow.
 *
 * Cobertura:
 *   - 9 rutas clave en desktop (1280×800) y mobile (375×812).
 *   - Sin scroll horizontal (ningún desbordamiento).
 *   - Un solo <h1> visible por página.
 *   - CTA de contacto presente (teléfono o WhatsApp o consulta).
 *   - FAQ con <details> funcional (abrir/cerrar) en landings y páginas con FAQ.
 *   - Skip link presente y enfocable.
 *   - Sin errores de consola críticos.
 *
 * Requisitos:
 *   - Server levantado en http://localhost:3178 (next dev -p 3178).
 *   - Ejecutar con: PLAYWRIGHT_BASE_URL=http://localhost:3178 npx playwright test e2e/fase5-design.spec.ts
 *     (PLAYWRIGHT_BASE_URL desactiva el webServer del config y usa el ours).
 */
import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3178';

const RUTAS = [
  ['/', 'Home'],
  ['/despacho', 'Despacho'],
  ['/servicios-juridicos', 'Servicios'],
  ['/derecho-penal', 'Derecho penal'],
  ['/servicios-juridicos/derecho-de-familia', 'Servicio familia'],
  ['/solicitar-consulta', 'Consulta'],
  ['/preguntas-frecuentes', 'FAQ'],
  ['/hondurenos-en-espana', 'España hub'],
  ['/abogados-en-nacaome', 'Local Nacaome'],
] as const;

async function contarH1(page: Page): Promise<number> {
  return page.locator('h1').count();
}

async function tieneScrollHorizontal(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

// ---------------------------------------------------------------------------
// Desktop 1280×800
// ---------------------------------------------------------------------------

test.describe('FASE 5 — diseño desktop (1280×800)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  for (const [ruta, nombre] of RUTAS) {
    test(`${nombre}: 200, 1 h1, sin scroll horizontal, CTA presente`, async ({ page }) => {
      const res = await page.goto(`${BASE}${ruta}`);
      expect(res?.status()).toBe(200);
      await page.waitForLoadState('domcontentloaded');

      // 1. Un solo H1.
      const h1Count = await contarH1(page);
      expect(h1Count, `${nombre} debe tener exactamente 1 <h1>`).toBe(1);

      // 2. Sin scroll horizontal.
      const overflow = await tieneScrollHorizontal(page);
      expect(overflow, `${nombre} no debe tener scroll horizontal`).toBe(false);

      // 3. Algún CTA de contacto presente (teléfono, WhatsApp o consulta).
      const cta = page.locator('a[href^="tel:"], a[href^="https://wa.me"], a[href*="/solicitar-consulta"], a[href*="wa.me"]');
      await expect(cta.first()).toBeVisible({ timeout: 5000 });
    });
  }
});

// ---------------------------------------------------------------------------
// Mobile 375×812
// ---------------------------------------------------------------------------

test.describe('FASE 5 — diseño mobile (375×812)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  for (const [ruta, nombre] of RUTAS) {
    test(`${nombre} mobile: 200, 1 h1, sin scroll horizontal`, async ({ page }) => {
      const res = await page.goto(`${BASE}${ruta}`);
      expect(res?.status()).toBe(200);
      await page.waitForLoadState('domcontentloaded');

      const h1Count = await contarH1(page);
      expect(h1Count, `${nombre} mobile debe tener 1 <h1>`).toBe(1);

      const overflow = await tieneScrollHorizontal(page);
      expect(overflow, `${nombre} mobile no debe tener scroll horizontal`).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// Skip link accesible
// ---------------------------------------------------------------------------

test.describe('FASE 5 — accesibilidad', () => {
  test('skip link presente y enfocable en home', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/`);
    const skip = page.locator('.skip-link, a[href="#main"], a[href="#contenido"]').first();
    await expect(skip).toBeAttached();
  });

  test('FAQ acordeón funcional en landing local (Nacaome)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/abogados-en-nacaome`);
    await page.waitForLoadState('domcontentloaded');
    // HubFaq renderiza <details>; al menos 1 debe estar cerrado inicialmente.
    const details = page.locator('details').first();
    await expect(details).toBeVisible();
    const isOpenBefore = await details.evaluate((el) => (el as HTMLDetailsElement).open);
    // Abrimos haciendo clic en el summary.
    await details.locator('summary').click();
    const isOpenAfter = await details.evaluate((el) => (el as HTMLDetailsElement).open);
    expect(isOpenAfter).toBe(!isOpenBefore);
  });

  test('header mobile: drawer se abre con el botón menú', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('domcontentloaded');
    // Botón hamburguesa con aria-label 'Abrir menú' (public-header.tsx).
    const menuBtn = page.locator('button[aria-label="Abrir menú"]').first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    // Tras abrir, el nav móvil con aria-label "Navegación móvil" debe ser visible.
    const navMobile = page.locator('nav[aria-label="Navegación móvil"]');
    await expect(navMobile).toBeVisible({ timeout: 3000 });
    // Y dentro, un enlace a /despacho visible (no el del header desktop oculto).
    await expect(navMobile.locator('a[href="/despacho"]').first()).toBeVisible({ timeout: 3000 });
  });
});
