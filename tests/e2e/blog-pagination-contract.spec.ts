import { expect, test, type Page } from '@playwright/test';

const ORIGIN = 'https://www.pinedayasociadoshn.com';

async function collectionSchemaUrl(page: Page): Promise<string | undefined> {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => {
    for (const script of scripts) {
      try {
        const value = JSON.parse(script.textContent ?? '');
        const nodes = Array.isArray(value) ? value : [value];
        const collection = nodes.find((node) => node?.['@type'] === 'CollectionPage');
        if (collection) return collection.url;
      } catch {
        // Otros bloques JSON-LD no forman parte de este contrato.
      }
    }
    return undefined;
  });
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )).toBe(false);
}

async function preparePage(page: Page) {
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
  test.describe(`paginación canónica del blog ${viewport.name}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });

    test('hub página 2 alinea señales y navegación SSR', async ({ page }) => {
      await preparePage(page);
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      const response = await page.goto('/blog?page=2');
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${ORIGIN}/blog?page=2`,
      );
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/i);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        `${ORIGIN}/blog?page=2`,
      );
      await expect(page).toHaveTitle(/Página 2/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Página 2/);
      expect(await collectionSchemaUrl(page)).toBe(`${ORIGIN}/blog?page=2`);
      await expect(page.locator('link[rel="prev"]')).toHaveAttribute('href', `${ORIGIN}/blog`);
      await expect(page.locator('link[rel="next"]')).toHaveAttribute(
        'href',
        `${ORIGIN}/blog?page=3`,
      );

      const pagination = page.getByRole('navigation', { name: 'Paginación' });
      await expect(pagination.getByRole('link', { name: /Anterior/ })).toHaveAttribute('href', '/blog');
      const next = pagination.getByRole('link', { name: /Siguiente/ });
      await expect(next).toHaveAttribute('href', '/blog?page=3');
      await next.focus();
      await expect(next).toBeFocused();
      await expectNoOverflow(page);
      expect(consoleErrors).toEqual([]);
    });

    test('última página, categoría paginada y filtros cumplen contrato', async ({ page }) => {
      expect((await page.goto('/blog?page=11'))?.status()).toBe(200);
      await expect(page.locator('link[rel="next"]')).toHaveCount(0);

      expect((await page.goto('/blog/derecho-penal?page=2'))?.status()).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${ORIGIN}/blog/derecho-penal?page=2`,
      );
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/i);
      expect(await collectionSchemaUrl(page)).toBe(`${ORIGIN}/blog/derecho-penal?page=2`);

      expect((await page.goto('/blog?tag=ARSA'))?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex, follow/i);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${ORIGIN}/blog?tag=ARSA`,
      );
      expect(await collectionSchemaUrl(page)).toBeUndefined();

      expect((await page.goto('/blog?month=2026-06'))?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex, follow/i);
      await expectNoOverflow(page);
    });

    test('page=1 redirige y valores inválidos o fuera de rango son 404', async ({ request }) => {
      const duplicate = await request.get('/blog?page=1', { maxRedirects: 0 });
      expect(duplicate.status()).toBe(308);
      expect(duplicate.headers().location).toBe('/blog');

      const normalized = await request.get('/blog?page=01', { maxRedirects: 0 });
      expect(normalized.status()).toBe(308);
      expect(normalized.headers().location).toBe('/blog');

      for (const route of [
        '/blog?page=0',
        '/blog?page=-1',
        '/blog?page=abc',
        '/blog?page=1.5',
        '/blog?page=12',
      ]) {
        expect((await request.get(route, { maxRedirects: 0 })).status()).toBe(404);
      }
    });
  });
}
