import { expect, test, type Page } from '@playwright/test';

const ORIGIN = 'https://www.pinedayasociadoshn.com';
const WITH_COVER_AND_CTA =
  '/blog/derecho-penal/defensa-penal-honduras';
const WITHOUT_COVER =
  '/blog/derecho-penal/derechos-detenido-honduras-guia-constitucional';
const EXPECTED_LOCAL_INVENTORY = Number.parseInt(
  process.env.E2E_EXPECTED_BLOG_ARTICLES ?? '134',
  10,
);

async function expectHealthyPage(page: Page, errors: string[]) {
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )).toBe(false);
  expect(errors).toEqual([]);
}

async function isolatePreviewTelemetry(page: Page) {
  await page.context().route('**/_vercel/speed-insights/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '',
    }),
  );
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test.describe(`rendimiento y equivalencia del blog ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('hub conserva inventario y no serializa bodies internos', async ({ page }) => {
      await isolatePreviewTelemetry(page);
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      const response = await page.goto('/blog');
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
      await expect(page.locator('[data-blog-inventory-summary]')).toContainText(
        `${EXPECTED_LOCAL_INVENTORY} artículos disponibles`,
      );
      await expect(page.locator('[data-blog-inventory-summary]')).toContainText(
        '4 destacados',
      );
      const html = await page.content();
      expect(html).not.toContain('"legalReviewNotes"');
      expect(html).not.toContain('"reviewedContentHash"');
      expect(html).not.toContain('class="article-body"');
      await expectHealthyPage(page, errors);
    });

    test('detalle conserva body, firma, CTA, navegación y schema', async ({ page }) => {
      await isolatePreviewTelemetry(page);
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      expect((await page.goto(WITH_COVER_AND_CTA))?.status()).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${ORIGIN}${WITH_COVER_AND_CTA}`,
      );
      await expect(page.locator('.article-body')).not.toBeEmpty();
      await expect(page.locator('[data-cta-location="blog_inline"]')).toHaveCount(1);
      expect(await page.getByText(
        'Revisión jurídica institucional:',
        { exact: false },
      ).count()).toBeGreaterThan(0);
      await expect(page.getByRole('navigation', { name: 'Navegación entre artículos' }))
        .toBeVisible();
      await expect(page.getByRole('heading', { name: 'Artículos relacionados' }))
        .toBeVisible();
      await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(0);
      await expectHealthyPage(page, errors);

      expect((await page.goto(WITHOUT_COVER))?.status()).toBe(200);
      await expect(page.locator('main img[alt="Derechos del detenido en Honduras"]'))
        .toHaveCount(0);
      await expect(page.locator('.article-body')).not.toBeEmpty();
      await expectHealthyPage(page, errors);
    });
  });
}
