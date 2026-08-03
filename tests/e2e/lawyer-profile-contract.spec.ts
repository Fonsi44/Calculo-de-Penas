import { expect, test } from '@playwright/test';

const ORIGIN = 'https://www.pinedayasociadoshn.com';
const profiles = [
  ['danilo-pineda-maradiaga', 'Danilo Pineda Maradiaga'],
  ['thania-marlene-paz', 'Thania Marlene Paz'],
  ['emil-barahona', 'Emil Barahona'],
] as const;

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test.describe(`perfiles profesionales ${viewport.name}`, () => {
    test.use({ viewport, deviceScaleFactor: 1 });

    for (const [slug, name] of profiles) {
      test(`${name}: identidad, fotografía y schema coherentes`, async ({ page }) => {
        await page.context().route('**/_vercel/speed-insights/**', (route) =>
          route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
        );
        const consoleErrors: string[] = [];
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });

        const response = await page.goto(`/equipo/${slug}`);
        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
        await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          'href',
          `${ORIGIN}/equipo/${slug}`,
        );

        const image = page.getByRole('img', { name: new RegExp(name) });
        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute('src', new RegExp(encodeURIComponent(`/images/equipo/${slug}.webp`)));
        const decoded = await image.evaluate((element: HTMLImageElement) => ({
          complete: element.complete,
          width: element.naturalWidth,
          height: element.naturalHeight,
        }));
        expect(decoded.complete).toBe(true);
        expect(decoded.width).toBeGreaterThan(0);
        expect(decoded.height / decoded.width).toBeCloseTo(1.25, 1);

        expect(await page.locator('script[type="application/ld+json"]').evaluateAll(
          (scripts) => scripts.some((script) => {
            try {
              const data = JSON.parse(script.textContent ?? '');
              return data?.['@type'] === 'ProfilePage'
                && data?.mainEntity?.['@id'];
            } catch {
              return false;
            }
          }),
        )).toBe(true);

        expect(await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        )).toBe(false);
        expect(consoleErrors).toEqual([]);
      });
    }

    test('despacho enlaza los tres perfiles', async ({ page }) => {
      expect((await page.goto('/despacho'))?.status()).toBe(200);
      for (const [slug, name] of profiles) {
        await expect(page.getByRole('link', { name: new RegExp(name) }).first())
          .toHaveAttribute('href', `/equipo/${slug}`);
      }
    });
  });
}
