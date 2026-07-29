import { expect, test, type Page } from '@playwright/test';

const ROUTES_WITH_VISIBLE_FAQ = [
  '/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026',
  '/blog/practica-legal/tramites-legales-nacaome',
];

const ROUTES_WITHOUT_VISIBLE_FAQ = [
  '/blog/derecho-de-familia/divorcio-honduras-guia-completa',
  '/blog/derecho-civil/usucapion-prescripcion-adquisitiva-honduras',
];

async function preparePage(page: Page) {
  await page.context().route('**/_vercel/speed-insights/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '',
    }),
  );
}

async function faqSchemas(page: Page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.flatMap((script) => {
      try {
        const value = JSON.parse(script.textContent ?? '');
        const nodes = Array.isArray(value) ? value : [value];
        return nodes.filter((node) => node?.['@type'] === 'FAQPage');
      } catch {
        return [];
      }
    }),
  );
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )).toBe(false);
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test.describe(`FAQ público ${viewport.name}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });

    test('Home no emite FAQ oculto', async ({ page }) => {
      await preparePage(page);
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
      expect(await faqSchemas(page)).toHaveLength(0);
      await expectNoOverflow(page);
    });

    test('FAQ visible coincide con schema, metadata y canonical', async ({ page }) => {
      await preparePage(page);
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      const response = await page.goto('/preguntas-frecuentes');
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
      await expect(page.locator('h1')).toContainText('Antes de su primera consulta');
      await expect(page.getByText('Información del bufete')).toBeVisible();
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /consulta gratuita.*confidencialidad.*documentación.*honorarios.*presupuesto.*atención/i,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://www.pinedayasociadoshn.com/preguntas-frecuentes',
      );

      const details = page.locator('details[data-faq-question]');
      const visibleQuestions = await details.locator('summary').allTextContents();
      const visibleAnswers = await details.locator('.faq-answer').evaluateAll((answers) =>
        answers.map((answer) => (answer.textContent ?? '').replace(/\s+/g, ' ').trim()),
      );
      const schemas = await faqSchemas(page);
      expect(schemas).toHaveLength(1);
      const entities = schemas[0].mainEntity as Array<{
        name: string;
        acceptedAnswer: { text: string };
      }>;
      expect(entities.map((entity) => entity.name)).toEqual(
        visibleQuestions.map((question) => question.trim()),
      );
      expect(entities.map((entity) => entity.acceptedAnswer.text)).toEqual(visibleAnswers);
      expect(entities).toHaveLength(await details.count());

      const freeConsultation = details.filter({
        hasText: '¿La primera consulta es gratuita?',
      });
      await expect(freeConsultation).toHaveCount(1);
      await expect(freeConsultation).toContainText('confidencial');
      await expect(freeConsultation).toContainText('sin compromiso');
      await expect(freeConsultation).toContainText('no se garantizan resultados');

      const firstSummary = details.first().locator('summary');
      await firstSummary.focus();
      await expect(firstSummary).toBeFocused();
      await firstSummary.press('Enter');
      await expect(details.first()).toHaveAttribute('open', '');
      await firstSummary.press('Enter');
      await expect(details.first()).not.toHaveAttribute('open', '');

      expect(await page.locator(
        '.faq-answer script, .faq-answer style, .faq-answer iframe, '
        + '.faq-answer object, .faq-answer embed, .faq-answer form, '
        + '.faq-answer img, .faq-answer table, .faq-answer [onclick], '
        + '.faq-answer [onerror]',
      ).count()).toBe(0);
      await expectNoOverflow(page);
      expect(consoleErrors).toEqual([]);
    });

    test('artículos solo emiten FAQPage cuando las preguntas son visibles', async ({ page }) => {
      await preparePage(page);
      for (const route of ROUTES_WITH_VISIBLE_FAQ) {
        expect((await page.goto(route))?.status()).toBe(200);
        const schemas = await faqSchemas(page);
        expect(schemas).toHaveLength(1);
        for (const entity of schemas[0].mainEntity as Array<{ name: string }>) {
          await expect(page.getByText(entity.name, { exact: true }).first()).toBeVisible();
        }
      }
      for (const route of ROUTES_WITHOUT_VISIBLE_FAQ) {
        expect((await page.goto(route))?.status()).toBe(200);
        expect(await faqSchemas(page)).toHaveLength(0);
      }
    });

    test('hubs jurídicos conservan FAQ visible y coherente', async ({ page }) => {
      await preparePage(page);
      for (const route of [
        '/derecho-penal',
        '/servicios-juridicos/derecho-de-familia',
      ]) {
        expect((await page.goto(route))?.status()).toBe(200);
        const schemas = await faqSchemas(page);
        expect(schemas).toHaveLength(1);
        const visible = await page.locator('details[data-faq-question]').count();
        expect(visible).toBe(schemas[0].mainEntity.length);
        await expectNoOverflow(page);
      }
    });
  });
}
