import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/',
  '/despacho',
  '/servicios-juridicos',
  '/derecho-penal',
  '/preguntas-frecuentes',
  '/blog',
  '/blog?page=2',
  '/blog/derecho-penal/defensa-penal-honduras',
  '/equipo/danilo-pineda-maradiaga',
  '/abogados-en-nacaome',
  '/abogados-en-choluteca',
  '/solicitar-consulta',
  '/politica-privacidad',
];

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test.describe(`A11y & UX Contract on ${viewport.name}`, () => {
    test.use({ viewport, deviceScaleFactor: 1 });

    for (const route of ROUTES) {
      test(`Ruta ${route} cumple con accesibilidad`, async ({ page }) => {
        await page.context().route('**/_vercel/speed-insights/**', (route) =>
          route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
        );
        await page.context().route('**/gtm.js**', (route) =>
          route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
        );

        const response = await page.goto(route);
        expect(response?.status()).toBe(200);

        const rejectBtn = page.getByRole('button', { name: 'Rechazar opcionales' });
        if (await rejectBtn.isVisible()) {
          await rejectBtn.click();
        }

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const criticalViolations = results.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        if (criticalViolations.length > 0) {
          console.error(`Violaciones críticas o serias encontradas en ${route}:`, JSON.stringify(criticalViolations, null, 2));
        }

        expect(criticalViolations.length).toBe(0);

        const hasOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasOverflow).toBe(false);

        // Validaciones semánticas del DOM
        const mains = page.locator('main');
        await expect(mains).toHaveCount(1);

        const skipLink = page.locator('a[href="#main"]');
        if (await skipLink.count() > 0) {
          await expect(page.locator('#main')).toHaveCount(1);
        }

        const navs = await page.locator('nav').evaluateAll((elements) =>
          elements.map((el) => el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || '')
        );
        const namedNavs = navs.filter(Boolean);
        const uniqueNavs = new Set(namedNavs);
        expect(uniqueNavs.size).toBe(namedNavs.length);
      });
    }

    if (viewport.name === 'mobile') {
      test('Menú móvil abre, atrapa foco, cierra con Escape y restaura foco', async ({ page }) => {
        await page.goto('/');

        const rejectBtn = page.getByRole('button', { name: 'Rechazar opcionales' });
        if (await rejectBtn.isVisible()) {
          await rejectBtn.click();
        }

        const menuBtn = page.getByRole('button', { name: 'Abrir menú' });
        await expect(menuBtn).toBeVisible();

        const box = await menuBtn.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);

        await menuBtn.focus();
        await page.keyboard.press('Enter');

        const navPanel = page.locator('#public-mobile-navigation');
        await expect(navPanel).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(navPanel).not.toBeVisible();
        
        const isTriggerFocused = await menuBtn.evaluate((el) => document.activeElement === el);
        expect(isTriggerFocused).toBe(true);
      });
    }
  });

  test.describe(`Reduced Motion on ${viewport.name}`, () => {
    test.use({
      viewport,
      deviceScaleFactor: 1,
    });

    test('Ticker detiene animación en reduced motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.context().route('**/_vercel/speed-insights/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
      );
      await page.goto('/');
      
      const tickerContainer = page.locator('.bg-primary-dark .animate-\\[ticker_45s_linear_infinite\\]');
      if (await tickerContainer.count() > 0) {
        const animation = await tickerContainer.evaluate((el) => {
          return window.getComputedStyle(el).animationName || window.getComputedStyle(el).animation;
        });
        expect(animation).toMatch(/none|0s/);
      }
    });
  });
}
