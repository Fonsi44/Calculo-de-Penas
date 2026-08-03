import { expect, test, type Page } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});

const CTA_ARTICLES = [
  '/blog/derecho-penal/defensa-penal-honduras',
  '/blog/derecho-laboral/despido-laboral-honduras-guia-completa',
  '/blog/derecho-de-familia/custodia-hijos-honduras-juez',
  '/blog/derecho-civil/usucapion-prescripcion-adquisitiva-honduras',
  '/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras',
];

const ARTICLES_WITHOUT_INLINE_CTA = [
  '/blog/practica-legal/tramites-legales-nacaome',
  '/blog/derecho-aduanero/guia-aduanera-importaciones-honduras',
  '/blog/derecho-aduanero/abogado-aduanero-san-lorenzo',
  '/blog/derecho-mercantil/abogado-empresas-san-lorenzo',
  '/blog/derecho-de-familia/abogado-familia-choluteca',
];

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
}

async function rejectOptionalCookies(page: Page) {
  const reject = page.getByRole('button', { name: 'Rechazar opcionales' });
  if (await reject.count()) await reject.click();
}

test.describe('blog público móvil 390 × 844', () => {
  test('listados, paginación, categoría y menú móvil', async ({ context, page }) => {
    const consoleErrors: string[] = [];
    await context.route('**/_vercel/speed-insights/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: '',
      }),
    );
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    for (const route of ['/blog', '/blog?page=5', '/blog?page=9', '/blog/derecho-penal']) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await rejectOptionalCookies(page);
      await expect(page.locator('h1')).toHaveCount(1);
      await expectNoHorizontalOverflow(page);
    }

    const menu = page.getByRole('button', { name: 'Abrir menú' });
    await expect(menu).toBeVisible();
    await menu.focus();
    await expect(menu).toBeFocused();
    await menu.click();
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('contrato HTTP de las dos rutas hereditarias', async ({ request, page }) => {
    const source = await request.get(
      '/blog/derecho-civil/herencias-honduras-fallece-familiar',
      { maxRedirects: 0 },
    );
    expect([301, 308]).toContain(source.status());
    expect(source.headers().location).toBe(
      '/blog/derecho-civil/testamentos-sucesiones-herencia-honduras',
    );

    const response = await page.goto(
      '/blog/derecho-civil/testamentos-sucesiones-herencia-honduras',
    );
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(
      'Testamentos y sucesiones en Honduras: trámites hereditarios',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://www.pinedayasociadoshn.com/blog/derecho-civil/testamentos-sucesiones-herencia-honduras',
    );
    await expect(page.locator('.article-body')).toBeVisible();
    await expect(page.locator('footer')).toBeAttached();
    await expectNoHorizontalOverflow(page);
  });

  test('cinco artículos con CTA prudente', async ({ page }) => {
    for (const route of CTA_ARTICLES) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      const cta = page.locator('[data-event-name="seo_blog_cta_click"]');
      await expect(cta).toBeVisible();
      await expect(cta).toContainText('evaluación inicial confidencial');
      await expect(cta).not.toContainText('gratuita');
      await expect(page.locator('.article-body')).toContainText(
        'No se garantizan resultados',
      );
      await expectNoHorizontalOverflow(page);
    }
  });

  test('cinco artículos sin CTA inline conservan estructura', async ({ page }) => {
    for (const route of ARTICLES_WITHOUT_INLINE_CTA) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('[data-event-name="seo_blog_cta_click"]')).toHaveCount(0);
      await expect(page.locator('.article-body')).toBeVisible();
      await expect(page.locator('.article-body h2')).not.toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    }
  });
});
