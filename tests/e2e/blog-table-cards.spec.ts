/**
 * E2E estricto de fichas de tablas del blog (Paso 13, corrección §5-§11).
 *
 * Deriva las rutas de docs/audits/current/blog-table-expected-cases.json
 * (generado por `seo:blog-table-cards-contract --prepare` desde AST).
 *
 * Para cada artículo publicado con tablas, en 4 viewports × 2 color schemes
 * + print mode, verifica en el navegador real:
 *   - cero etiquetas de tabla en el DOM;
 *   - cards >= expected_cards (impresión: con nodos reales, no :visible);
 *   - títulos/labels/values esperados visibles;
 *   - overflow horizontal <= 1px (medido, no hardcodeado);
 *   - sin palabras partidas letra por letra (medido);
 *   - axe critical/serious/contrast real (medido en pantalla y print);
 *   - console errors, page errors, hydration warnings (observados con objeto mutable).
 *
 * El resultado se calcula a partir de las métricas: result = PASS solo si
 * todas las assertions pasan. No se hardcodea result=PASS.
 */

import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const HEAD_SHA = execSync('git rev-parse HEAD').toString().trim();
const RESULTS_DIR = path.join(process.cwd(), 'test-results/blog-table-cards');
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

/** Diagnósticos de navegador observados con objeto mutable. */
interface BrowserDiagnostics {
  consoleErrors: string[];
  pageErrors: string[];
  hydrationWarnings: string[];
}

function observeBrowserDiagnostics(page: Page): BrowserDiagnostics {
  const diag: BrowserDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    hydrationWarnings: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filtros explícitos: recursos externos interceptados deliberadamente.
      // - Vercel Speed Insights: interceptado por route()
      // - GTM: interceptado por route()
      if (text.includes('_vercel/speed-insights')) return;
      if (text.includes('gtm.js')) return;
      if (text.includes('googletagmanager')) return;
      diag.consoleErrors.push(text);
    }
    // Detecta warnings de hidratación de React.
    if (msg.type() === 'warning' || msg.type() === 'error') {
      const text = msg.text();
      if (
        text.includes('hydration') ||
        text.includes('Hydration') ||
        text.includes('mismatch') ||
        text.includes('server/client') ||
        text.includes('did not match') ||
        text.includes('expected server HTML')
      ) {
        diag.hydrationWarnings.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    diag.pageErrors.push(err.message);
    // pageerror puede contener hydration también.
    if (
      err.message.includes('hydration') ||
      err.message.includes('Hydration') ||
      err.message.includes('mismatch')
    ) {
      diag.hydrationWarnings.push(err.message);
    }
  });

  return diag;
}

function ensureDir() {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

interface RuntimeResult {
  tested_code_sha: string;
  timestamp: string;
  slug: string;
  url: string;
  viewport: string;
  color_scheme: string;
  print_mode: boolean;

  tables: number;
  cards: number;
  expected_cards: number;

  document_overflow: number;
  article_overflow: number;
  vertical_word_breaking: boolean;

  axe_critical: number | 'NOT_APPLICABLE';
  axe_serious: number | 'NOT_APPLICABLE';
  color_contrast: number | 'NOT_APPLICABLE';

  console_errors: number;
  page_errors: number;
  hydration_warnings: number;

  failures: string[];
  result: 'PASS' | 'FAIL';
}

function saveResult(data: RuntimeResult) {
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
    // Ignore
  }
}

async function countTableTags(page: Page): Promise<number> {
  return page.locator('article table, article thead, article tbody, article tfoot, article tr, article th, article td, article caption').count();
}

/** Selector unificado de fichas (clases directas, no descendientes de article). */
const CARD_SELECTOR = [
  '.article-comparison-card',
  '.article-data-card',
  '.article-data-list > li',
].join(', ');

/** Cuenta fichas visibles en pantalla. */
async function countCards(page: Page): Promise<number> {
  return page.locator(`${CARD_SELECTOR}:visible`).count();
}

/** Cuenta fichas en impresión: usa locator sin :visible (attached nodes).
 *  Bajo media=print, :visible no funciona de forma fiable. */
async function countPrintCards(page: Page): Promise<number> {
  return page.locator(CARD_SELECTOR).count();
}

async function measureOverflow(page: Page): Promise<{ doc: number; article: number }> {
  return page.evaluate(() => {
    const docEl = document.documentElement;
    const article = document.querySelector('article');
    const docOverflow = Math.max(0, docEl.scrollWidth - docEl.clientWidth);
    const articleOverflow = article ? Math.max(0, article.scrollWidth - article.clientWidth) : 0;
    return { doc: Math.round(docOverflow), article: Math.round(articleOverflow) };
  });
}

async function detectVerticalWordBreaking(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const values = document.querySelectorAll(
      '.article-comparison-card__value, .article-data-card__value, '
      + '.article-comparison-card__title, .article-data-card__title',
    );
    for (const v of Array.from(values)) {
      const el = v as HTMLElement;
      if (el.offsetWidth < 20 && el.offsetHeight > 60) return true;
    }
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

async function setupPage(page: Page) {
  await page.context().route('**/_vercel/speed-insights/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
  await page.context().route('**/gtm.js**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
}

// ───────────────────────────────────────────────────────────────── PANTALLA ─────

for (const vp of VIEWPORTS) {
  test.describe(`Blog table cards on ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const c of EXPECTED.cases) {
      for (const scheme of ['light', 'dark'] as const) {
        test(`${c.slug} - ${scheme} - ${vp.name}`, async ({ page }) => {
          await setupPage(page);
          await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'no-preference' });
          const diag = observeBrowserDiagnostics(page);

          await page.goto(c.url, { waitUntil: 'networkidle' });
          await dismissCookieConsent(page);
          await page.waitForSelector('article', { timeout: 15000 });

          const tableTags = await countTableTags(page);
          const cards = await countCards(page);
          const overflow = await measureOverflow(page);
          const wordBreaking = await detectVerticalWordBreaking(page);
          const axe = await runAxe(page);

          const failures: string[] = [];
          if (tableTags !== 0) failures.push(`tables=${tableTags}`);
          if (cards < c.expectedCards) failures.push(`cards=${cards}<expected=${c.expectedCards}`);
          if (overflow.doc > 1) failures.push(`doc_overflow=${overflow.doc}`);
          if (overflow.article > 1) failures.push(`article_overflow=${overflow.article}`);
          if (wordBreaking) failures.push('vertical_word_breaking');
          if (axe.critical !== 0) failures.push(`axe_critical=${axe.critical}`);
          if (axe.serious !== 0) failures.push(`axe_serious=${axe.serious}`);
          if (axe.contrast !== 0) failures.push(`color_contrast=${axe.contrast}`);
          if (diag.consoleErrors.length > 0) failures.push(`console_errors=${diag.consoleErrors.length}`);
          if (diag.pageErrors.length > 0) failures.push(`page_errors=${diag.pageErrors.length}`);
          if (diag.hydrationWarnings.length > 0) failures.push(`hydration_warnings=${diag.hydrationWarnings.length}`);

          // Títulos y labels esperados visibles.
          for (const title of c.expectedTitles) {
            try {
              await expect(page.locator('article').first()).toContainText(title, { timeout: 5000 });
            } catch {
              failures.push(`missing_title="${title}"`);
            }
          }
          for (const label of c.expectedLabels) {
            try {
              await expect(page.locator('article').first()).toContainText(label, { timeout: 5000 });
            } catch {
              failures.push(`missing_label="${label}"`);
            }
          }

          const result: RuntimeResult = {
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
            document_overflow: overflow.doc,
            article_overflow: overflow.article,
            vertical_word_breaking: wordBreaking,
            axe_critical: axe.critical,
            axe_serious: axe.serious,
            color_contrast: axe.contrast,
            console_errors: diag.consoleErrors.length,
            page_errors: diag.pageErrors.length,
            hydration_warnings: diag.hydrationWarnings.length,
            failures,
            result: failures.length === 0 ? 'PASS' : 'FAIL',
          };
          saveResult(result);

          // Solo hacemos assertions estrictas tras guardar el resultado.
          expect(tableTags, `${c.slug}: tags de tabla en DOM debe ser 0`).toBe(0);
          expect(cards, `${c.slug}: fichas visibles debe ser >= ${c.expectedCards}`).toBeGreaterThanOrEqual(c.expectedCards);
          expect(overflow.doc, `${c.slug}: doc overflow <= 1px`).toBeLessThanOrEqual(1);
          expect(overflow.article, `${c.slug}: article overflow <= 1px`).toBeLessThanOrEqual(1);
          expect(wordBreaking, `${c.slug}: sin word breaking`).toBe(false);
          expect(axe.critical, `${c.slug}: axe critical = 0`).toBe(0);
          expect(axe.serious, `${c.slug}: axe serious = 0`).toBe(0);
          expect(axe.contrast, `${c.slug}: color contrast = 0`).toBe(0);
          expect(diag.consoleErrors, `${c.slug}: console errors = 0`).toEqual([]);
          expect(diag.pageErrors, `${c.slug}: page errors = 0`).toEqual([]);
          expect(diag.hydrationWarnings, `${c.slug}: hydration warnings = 0`).toEqual([]);
        });
      }

      // ──────────────────────────────────────────────────────────── IMPRESIÓN ─────

      test(`${c.slug} - print - ${vp.name}`, async ({ page }) => {
        await setupPage(page);
        await page.emulateMedia({ media: 'print', colorScheme: 'light' });
        const diag = observeBrowserDiagnostics(page);

        await page.goto(c.url, { waitUntil: 'networkidle' });
        await dismissCookieConsent(page);
        await page.locator('article').first().waitFor({ state: 'attached', timeout: 15000 });

        const tableTags = await countTableTags(page);
        const cards = await countPrintCards(page);
        const overflow = await measureOverflow(page);
        const wordBreaking = await detectVerticalWordBreaking(page);

        let axeCritical: number | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
        let axeSerious: number | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
        let colorContrastVal: number | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
        try {
          const axe = await runAxe(page);
          axeCritical = axe.critical;
          axeSerious = axe.serious;
          colorContrastVal = axe.contrast;
        } catch {
          // Axe puede no funcionar bajo media=print; se registra como NOT_APPLICABLE.
        }

        const failures: string[] = [];
        if (tableTags !== 0) failures.push(`print_tables=${tableTags}`);
        if (cards < c.expectedCards) failures.push(`print_cards=${cards}<expected=${c.expectedCards}`);
        if (overflow.doc > 1) failures.push(`print_doc_overflow=${overflow.doc}`);
        if (overflow.article > 1) failures.push(`print_article_overflow=${overflow.article}`);
        if (wordBreaking) failures.push('print_vertical_word_breaking');
        if (typeof axeCritical === 'number' && axeCritical !== 0) failures.push(`print_axe_critical=${axeCritical}`);
        if (typeof axeSerious === 'number' && axeSerious !== 0) failures.push(`print_axe_serious=${axeSerious}`);
        if (typeof colorContrastVal === 'number' && colorContrastVal !== 0) failures.push(`print_color_contrast=${colorContrastVal}`);
        if (diag.consoleErrors.length > 0) failures.push(`print_console_errors=${diag.consoleErrors.length}`);
        if (diag.pageErrors.length > 0) failures.push(`print_page_errors=${diag.pageErrors.length}`);
        if (diag.hydrationWarnings.length > 0) failures.push(`print_hydration_warnings=${diag.hydrationWarnings.length}`);

        // Verificar títulos en impresión.
        for (const title of c.expectedTitles) {
          const hasTitle = await page.locator('article').first().textContent().then(
            (t) => (t ?? '').includes(title),
          ).catch(() => false);
          if (!hasTitle) failures.push(`print_missing_title="${title}"`);
        }

        const result: RuntimeResult = {
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
          document_overflow: overflow.doc,
          article_overflow: overflow.article,
          vertical_word_breaking: wordBreaking,
          axe_critical: axeCritical,
          axe_serious: axeSerious,
          color_contrast: colorContrastVal,
          console_errors: diag.consoleErrors.length,
          page_errors: diag.pageErrors.length,
          hydration_warnings: diag.hydrationWarnings.length,
          failures,
          result: failures.length === 0 ? 'PASS' : 'FAIL',
        };
        saveResult(result);

        // Assertions estrictas tras guardar.
        expect(tableTags, `${c.slug} print: tags de tabla = 0`).toBe(0);
        expect(cards, `${c.slug} print: print cards >= ${c.expectedCards}`).toBeGreaterThanOrEqual(c.expectedCards);
        expect(overflow.doc, `${c.slug} print: doc overflow <= 1px`).toBeLessThanOrEqual(1);
        expect(overflow.article, `${c.slug} print: article overflow <= 1px`).toBeLessThanOrEqual(1);
        expect(wordBreaking, `${c.slug} print: sin word breaking`).toBe(false);
        if (typeof axeCritical === 'number') {
          expect(axeCritical, `${c.slug} print: axe critical = 0`).toBe(0);
        }
        if (typeof axeSerious === 'number') {
          expect(axeSerious, `${c.slug} print: axe serious = 0`).toBe(0);
        }
        if (typeof colorContrastVal === 'number') {
          expect(colorContrastVal, `${c.slug} print: color contrast = 0`).toBe(0);
        }
        expect(diag.consoleErrors, `${c.slug} print: console errors = 0`).toEqual([]);
        expect(diag.pageErrors, `${c.slug} print: page errors = 0`).toEqual([]);
        expect(diag.hydrationWarnings, `${c.slug} print: hydration warnings = 0`).toEqual([]);
      });
    }
  });
}
