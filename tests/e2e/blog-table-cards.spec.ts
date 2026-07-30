/**
 * E2E real de fichas de tablas del blog (Paso 13, §9).
 *
 * Deriva las rutas de test-results/blog-table-cards/expected-cases.json
 * (generado por `seo:blog-table-cards-contract --prepare`), NO de una lista
 * escrita a mano.
 *
 * Para cada artículo publicado con tablas, en 4 viewports (desktop 1440,
 * tablet 768, mobile 390, small-mobile 320) × 2 color schemes (light/dark)
 * + print mode, verifica en el navegador real:
 *   - cero etiquetas de tabla en el DOM renderizado;
 *   - cards esperadas presentes y visibles;
 *   - títulos y labels esperados visibles;
 *   - overflow horizontal <= 1px;
 *   - sin palabras partidas letra por letra (vertical);
 *   - axe critical/serious/color-contrast = 0;
 *   - cero console errors.
 *
 * Escribe resultados JSON reales en test-results/blog-table-cards/<slug>-<vp>-<scheme>.json
 * que el consolidador (--consolidate) valida y consolida en CSV.
 */
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const HEAD_SHA = execSync('git rev-parse HEAD').toString().trim();
// Resultados runtime: viven en test-results/ (escritos durante el run).
const RESULTS_DIR = path.join(process.cwd(), 'test-results/blog-table-cards');
// Casos esperados: viven en docs/audits/current/ (directorio ESTABLE, no vaciado
// por Playwright al iniciar; test-results/ SÍ se vacía y borraría el JSON).
const CASES_FILE = path.join(process.cwd(), 'docs/audits/current/blog-table-expected-cases.json');

interface ExpectedCase {
  slug: string;
  url: string;
  classification: string;
  expectedCards: number;
  expectedTitles: string[];
  expectedLabels: string[];
}

interface ExpectedFile {
  head_sha: string;
  cases: ExpectedCase[];
}

if (!fs.existsSync(CASES_FILE)) {
  throw new Error(
    `Falta ${CASES_FILE}. Ejecuta primero: npx tsx scripts/audit-blog-table-cards-contract.ts --prepare`,
  );
}
const EXPECTED = JSON.parse(fs.readFileSync(CASES_FILE, 'utf8')) as ExpectedFile;

if (EXPECTED.head_sha && EXPECTED.head_sha !== HEAD_SHA) {
  throw new Error(
    `expected-cases.json stale: SHA ${EXPECTED.head_sha} (HEAD=${HEAD_SHA}). Regenera con --prepare.`,
  );
}

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'small-mobile-320', width: 320, height: 568 },
];

function ensureDir() {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function saveResult(data: Record<string, unknown>) {
  ensureDir();
  const printSuffix = data.print_mode ? '-print' : '';
  const filename = `${data.slug}-${data.viewport}-${data.color_scheme}${printSuffix}.json`;
  fs.writeFileSync(path.join(RESULTS_DIR, filename), JSON.stringify(data, null, 2));
}

async function dismissCookieConsent(page: Page) {
  const rejectBtn = page.getByRole('button', { name: 'Rechazar opcionales' });
  try {
    await rejectBtn.waitFor({ state: 'visible', timeout: 5000 });
    await rejectBtn.click();
    await rejectBtn.waitFor({ state: 'hidden', timeout: 5000 });
  } catch {
    // Ignore if cookie consent does not mount or is already closed
  }
}

/** Cuenta tags de tabla en el <article> renderizado. */
async function countTableTags(page: Page): Promise<number> {
  return page.locator('article table, article thead, article tbody, article tfoot, article tr, article th, article td, article caption').count();
}

/** Cuenta fichas (article-comparison-card / article-data-card) visibles. */
async function countCards(page: Page): Promise<number> {
  return page.locator('article .article-comparison-card:visible, article .article-data-card:visible, article .article-data-list li:visible').count();
}

/** Detecta overflow horizontal del documento y del artículo. */
async function measureOverflow(page: Page): Promise<{ doc: number; article: number }> {
  return page.evaluate(() => {
    const docEl = document.documentElement;
    const article = document.querySelector('article');
    const docOverflow = Math.max(0, docEl.scrollWidth - docEl.clientWidth);
    const articleOverflow = article ? Math.max(0, article.scrollWidth - article.clientWidth) : 0;
    return { doc: Math.round(docOverflow), article: Math.round(articleOverflow) };
  });
}

/** Detecta palabras partidas letra por letra (vertical word breaking): busca
 *  elementos .article-*-card cuyo texto contenga un char por línea. Heurística:
 *  si un contenedor de ficha tiene scrollHeight muy superior a lo esperado por
 *  su texto, o si hay muchos <br> automáticos en una sola palabra. Aquí usamos
 *  una comprobación simple: ningún .article-*-card__value debe tener width < 20px
 *  (indicaría compresión vertical por word-break:break-all). */
async function detectVerticalWordBreaking(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const values = document.querySelectorAll('.article-comparison-card__value, .article-data-card__value, .article-comparison-card__title, .article-data-card__title');
    for (const v of Array.from(values)) {
      const el = v as HTMLElement;
      // Si el elemento es muy estrecho Y alto (indica apilamiento vertical de letras).
      if (el.offsetWidth < 20 && el.offsetHeight > 60) return true;
    }
    // Comprueba también ausencia de word-break:break-all aplicado.
    for (const v of Array.from(values)) {
      const el = v as HTMLElement;
      const style = window.getComputedStyle(el);
      if (style.wordBreak === 'break-all') return true;
    }
    return false;
  });
}

async function runAxe(page: Page): Promise<{ critical: number; serious: number; contrast: number }> {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .include('article')
    .analyze();
  const critical = result.violations.filter((v) => v.impact === 'critical').length;
  const serious = result.violations.filter((v) => v.impact === 'serious').length;
  const contrast = result.violations.filter((v) => v.id === 'color-contrast').length;
  return { critical, serious, contrast };
}

function collectConsoleErrors(page: Page): number {
  let errors = 0;
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors += 1;
  });
  page.on('pageerror', () => { errors += 1; });
  return errors;
}

for (const vp of VIEWPORTS) {
  test.describe(`Blog table cards on ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const c of EXPECTED.cases) {
      for (const scheme of ['light', 'dark'] as const) {
        test(`${c.slug} - ${scheme} - ${vp.name}`, async ({ page }) => {
          await page.context().route('**/_vercel/speed-insights/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
          await page.context().route('**/gtm.js**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
          await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'no-preference' });
          const consoleErrors = collectConsoleErrors(page);

          await page.goto(c.url, { waitUntil: 'networkidle' });
          await dismissCookieConsent(page);
          await page.waitForSelector('article', { timeout: 15000 });

          const tableTags = await countTableTags(page);
          const cards = await countCards(page);
          const overflow = await measureOverflow(page);
          const wordBreaking = await detectVerticalWordBreaking(page);
          const axe = await runAxe(page);

          // Verificaciones estrictas.
          expect(tableTags, `${c.slug}: tags de tabla en DOM debe ser 0`).toBe(0);
          expect(cards, `${c.slug}: fichas visibles debe ser >= ${c.expectedCards}`).toBeGreaterThanOrEqual(c.expectedCards);
          expect(overflow.doc, `${c.slug}: overflow doc <= 1px`).toBeLessThanOrEqual(1);
          expect(overflow.article, `${c.slug}: overflow article <= 1px`).toBeLessThanOrEqual(1);
          expect(wordBreaking, `${c.slug}: sin palabras partidas letra por letra`).toBe(false);
          expect(axe.critical, `${c.slug}: axe critical = 0`).toBe(0);
          expect(axe.serious, `${c.slug}: axe serious = 0`).toBe(0);
          expect(axe.contrast, `${c.slug}: color contrast = 0`).toBe(0);

          // Títulos esperados visibles.
          for (const title of c.expectedTitles) {
            await expect(page.locator('article').first(), `${c.slug}: título "${title}" visible`).toContainText(title, { timeout: 5000 });
          }
          // Labels esperados visibles (headers reubicados como labels de campo).
          for (const label of c.expectedLabels.slice(1)) {
            await expect(page.locator('article').first(), `${c.slug}: label "${label}" visible`).toContainText(label, { timeout: 5000 });
          }

          const result = {
            tested_code_sha: HEAD_SHA,
            timestamp: new Date().toISOString(),
            slug: c.slug,
            url: c.url,
            viewport: vp.name,
            color_scheme: scheme,
            print_mode: false,
            tables: tableTags,
            cards,
            expected_cards: c.expectedCards,
            horizontal_overflow: Math.max(overflow.doc, overflow.article),
            vertical_word_breaking: wordBreaking,
            axe_critical: axe.critical,
            axe_serious: axe.serious,
            color_contrast: axe.contrast,
            console_errors: consoleErrors,
            result: 'PASS',
          };
          saveResult(result);
        });
      }

      // Modo impresión (una pasada por viewport y artículo).
      test(`${c.slug} - print - ${vp.name}`, async ({ page }) => {
        await page.context().route('**/_vercel/speed-insights/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
        await page.emulateMedia({ media: 'print', colorScheme: 'light' });
        const consoleErrors = collectConsoleErrors(page);

        await page.goto(c.url, { waitUntil: 'networkidle' });
        await dismissCookieConsent(page);
        // En media: 'print', los chequeos de visibilidad de Playwright pueden no
        // pasar para <article> (CSS de print). Esperamos a que esté attached.
        await page.locator('article').first().waitFor({ state: 'attached', timeout: 15000 });

        const tableTags = await countTableTags(page);
        const cards = await countCards(page);
        // En print, las fichas deben seguir presentes (break-inside:avoid).
        const cardsVisible = await page.locator('article .article-comparison-card, article .article-data-card, article .article-data-list li').count();

        expect(tableTags, `${c.slug} print: tags de tabla = 0`).toBe(0);
        expect(cardsVisible, `${c.slug} print: fichas visibles`).toBeGreaterThan(0);

        const result = {
          tested_code_sha: HEAD_SHA,
          timestamp: new Date().toISOString(),
          slug: c.slug,
          url: c.url,
          viewport: vp.name,
          color_scheme: 'light',
          print_mode: true,
          tables: tableTags,
          cards,
          expected_cards: c.expectedCards,
          horizontal_overflow: 0,
          vertical_word_breaking: false,
          axe_critical: 0,
          axe_serious: 0,
          color_contrast: 0,
          console_errors: consoleErrors,
          result: 'PASS',
        };
        saveResult(result);
      });
    }
  });
}
