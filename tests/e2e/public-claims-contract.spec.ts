import { expect, test, type Page } from '@playwright/test';

const ORIGIN = 'https://www.pinedayasociadoshn.com';
const commercialProperties = [
  'priceRange',
  'paymentAccepted',
  'currenciesAccepted',
  'numberOfEmployees',
];

async function jsonLd(page: Page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.flatMap((script) => {
      try {
        const parsed = JSON.parse(script.textContent ?? '');
        return parsed['@graph'] ?? [parsed];
      } catch {
        return [];
      }
    }),
  );
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test.describe(`claims públicos ${viewport.name}`, () => {
    test.use({ viewport, deviceScaleFactor: 1 });

    test('catálogo visible, ItemList y OfferCatalog mantienen paridad', async ({ page }) => {
      await page.context().route('**/_vercel/speed-insights/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
      );
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      const response = await page.goto('/servicios-juridicos');
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
      await expect(page.getByText('presenta actualmente 14 áreas de práctica').first()).toBeVisible();
      await expect(page.locator('[data-testid="service-card"]')).toHaveCount(14);
      await expect(page.getByText(/^Responsable:/)).toHaveCount(6);
      await expect(page.getByText(/Cada caso lo dirige el abogado especialista/)).toHaveCount(0);

      const nodes = await jsonLd(page);
      const itemList = nodes.find((node) => node?.['@type'] === 'ItemList');
      const legal = nodes.find((node) =>
        Array.isArray(node?.['@type']) && node['@type'].includes('LegalService'));
      expect(itemList?.itemListElement).toHaveLength(14);
      expect(itemList?.itemListElement.map((item: { position: number }) => item.position))
        .toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
      expect(legal?.hasOfferCatalog?.itemListElement).toHaveLength(14);
      expect(legal?.hasOfferCatalog?.itemListElement.map(
        (offer: { itemOffered: { name: string } }) => offer.itemOffered.name,
      )).toEqual(itemList?.itemListElement.map((item: { name: string }) => item.name));
      for (const property of commercialProperties) expect(legal).not.toHaveProperty(property);
      expect(legal?.sameAs).not.toContain('https://x.com/Danilo_Pineda_M');
      expect(await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )).toBe(false);
      expect(errors).toEqual([]);
    });

    test('entidades separan perfiles personales y corporativos', async ({ page }) => {
      await page.goto('/');
      const nodes = await jsonLd(page);
      const organization = nodes.find((node) => node?.['@type'] === 'Organization');
      const danilo = nodes.find((node) => node?.['@id'] === `${ORIGIN}/#danilo-pineda-maradiaga`);
      expect(organization?.foundingDate).toBe('2010');
      expect(organization?.sameAs).not.toContain('https://x.com/Danilo_Pineda_M');
      expect(danilo?.sameAs).toContain('https://x.com/Danilo_Pineda_M');
      expect(danilo?.sameAs).not.toEqual(
        expect.arrayContaining([expect.stringContaining('maps.app.goo.gl')]),
      );
    });

    test('servicios con y sin responsable siguen accesibles', async ({ page }) => {
      for (const route of [
        '/derecho-penal',
        '/servicios-juridicos/derecho-de-familia',
        '/servicios-juridicos/derecho-laboral',
        '/servicios-juridicos/derecho-bancario-y-financiero',
        '/servicios-juridicos/regulacion-sanitaria',
        '/servicios-juridicos/tributario-fiscal',
      ]) {
        expect((await page.goto(route))?.status()).toBe(200);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${ORIGIN}${route}`);
        expect(await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        )).toBe(false);
      }
    });
  });
}
