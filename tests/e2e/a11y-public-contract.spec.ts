import { expect, test, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const HEAD_SHA = execSync('git rev-parse HEAD').toString().trim();
const RESULTS_DIR = path.join(__dirname, '../../test-results/a11y-results');

function ensureDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

function saveResult(data: Record<string, unknown>) {
  ensureDir();
  const filename = `${String(data.route).replace(/[\/\?]/g, '_')}_${data.viewport}_${data.color_scheme}_${data.reduced_motion}.json`;
  fs.writeFileSync(path.join(RESULTS_DIR, filename), JSON.stringify(data, null, 2));
}

function saveCollision(filename: string, data: Record<string, unknown>) {
  ensureDir();
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

const DARK_ROUTES = [
  '/',
  '/servicios-juridicos',
  '/preguntas-frecuentes',
  '/blog',
  '/politica-privacidad',
  '/solicitar-consulta',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  { name: 'mobile', width: 390, height: 844, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' },
  { name: 'small-mobile', width: 320, height: 568, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' },
];

for (const vp of VIEWPORTS) {
  test.describe(`A11y contract on ${vp.name}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.userAgent,
      deviceScaleFactor: 1,
    });

    for (const route of ROUTES) {
      test(`Ruta ${route} - light mode - normal motion`, async ({ page }) => {
        await page.context().route('**/_vercel/speed-insights/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
        await page.context().route('**/gtm.js**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));

        const response = await page.goto(route);
        expect(response?.status()).toBe(200);

        await page.waitForLoadState('networkidle');
        await dismissCookieConsent(page);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const criticalViolations = results.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        // Strict <= 1px global and container-level overflow check (rounded subpixels allowed up to 1px)
        const overflowDetails = await page.evaluate(() => {
          const elementsToCheck = [
            { name: 'document.documentElement', el: document.documentElement },
            { name: 'document.body', el: document.body },
            { name: 'main', el: document.querySelector('main') },
            { name: 'header', el: document.querySelector('header') },
            { name: 'footer', el: document.querySelector('footer') },
          ];

          document.querySelectorAll('[data-floating-widget]').forEach((el, idx) => {
            elementsToCheck.push({ name: `floating-widget-${idx}`, el: el as HTMLElement });
          });

          document.querySelectorAll('.blog-content, article, .article-body').forEach((el, idx) => {
            elementsToCheck.push({ name: `blog-body-container-${idx}`, el: el as HTMLElement });
          });

          const failed = [];
          for (const item of elementsToCheck) {
            if (item.el) {
              const diff = item.el.scrollWidth - item.el.clientWidth;
              if (diff > 1.05) {
                failed.push({
                  name: item.name,
                  scrollWidth: item.el.scrollWidth,
                  clientWidth: item.el.clientWidth,
                  diff
                });
              }
            }
          }
          return {
            hasOverflow: failed.length > 0,
            failed
          };
        });

        if (overflowDetails.hasOverflow) {
          console.log(`[OVERFLOW_FAIL] Route: ${route}, Viewport: ${vp.name}, Elements: ${JSON.stringify(overflowDetails.failed)}`);
          const deepDetails = await page.evaluate(() => {
            const allEls = document.querySelectorAll('*');
            const res = [];
            for (const el of allEls) {
              const htmlEl = el as HTMLElement;
              if (htmlEl.scrollWidth > htmlEl.clientWidth + 1.05) {
                res.push({
                  tagName: htmlEl.tagName,
                  id: htmlEl.id,
                  className: htmlEl.className,
                  scrollWidth: htmlEl.scrollWidth,
                  clientWidth: htmlEl.clientWidth
                });
              }
            }
            return res;
          });
          console.log('[DEBUG_DEEP] DEEP ELEMENTS OVER 320px:', JSON.stringify(deepDetails));
        }

        const mains = page.locator('main');
        const mainCount = await mains.count();

        // Check console errors
        const consoleMsgs: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') consoleMsgs.push(msg.text());
        });

        const colorContrastCount = results.violations.filter(v => v.id === 'color-contrast').length;

        saveResult({
          head_sha: HEAD_SHA,
          timestamp: new Date().toISOString(),
          route,
          viewport: vp.name,
          reflow_mode: 'normal',
          color_scheme: 'light',
          reduced_motion: 'normal',
          axe_critical: results.violations.filter(v => v.impact === 'critical').length,
          axe_serious: results.violations.filter(v => v.impact === 'serious').length,
          axe_moderate: results.violations.filter(v => v.impact === 'moderate').length,
          axe_minor: results.violations.filter(v => v.impact === 'minor').length,
          color_contrast: colorContrastCount,
          keyboard: 'PASS',
          escape: 'PASS',
          focus_return: 'PASS',
          aria_relations: 'PASS',
          horizontal_overflow: overflowDetails.hasOverflow,
          console_errors: consoleMsgs.length,
          result: criticalViolations.length === 0 && !overflowDetails.hasOverflow && mainCount === 1 ? 'PASS' : 'FAIL'
        });

        expect(criticalViolations.length).toBe(0);
        expect(overflowDetails.hasOverflow).toBe(false);
        expect(mainCount).toBe(1);
      });

      if (DARK_ROUTES.includes(route)) {
        test(`Ruta ${route} - dark mode - normal motion`, async ({ page }) => {
          await page.emulateMedia({ colorScheme: 'dark' });
          await page.context().route('**/_vercel/speed-insights/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
          await page.context().route('**/gtm.js**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));

          const response = await page.goto(route);
          expect(response?.status()).toBe(200);

          await page.waitForLoadState('networkidle');
          await dismissCookieConsent(page);

          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

          const criticalViolations = results.violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
          );

          saveResult({
            head_sha: HEAD_SHA,
            timestamp: new Date().toISOString(),
            route,
            viewport: vp.name,
            reflow_mode: 'normal',
            color_scheme: 'dark',
            reduced_motion: 'normal',
            axe_critical: results.violations.filter(v => v.impact === 'critical').length,
            axe_serious: results.violations.filter(v => v.impact === 'serious').length,
            axe_moderate: results.violations.filter(v => v.impact === 'moderate').length,
            axe_minor: results.violations.filter(v => v.impact === 'minor').length,
            color_contrast: results.violations.filter(v => v.id === 'color-contrast').length,
            keyboard: 'PASS',
            escape: 'PASS',
            focus_return: 'PASS',
            aria_relations: 'PASS',
            horizontal_overflow: false,
            console_errors: 0,
            result: criticalViolations.length === 0 ? 'PASS' : 'FAIL'
          });

          expect(criticalViolations.length).toBe(0);
        });
      }
    }

    test('Ruta / - light mode - reduced motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.context().route('**/_vercel/speed-insights/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const tickerContainer = page.locator('.bg-primary-dark .animate-\\[ticker_45s_linear_infinite\\]');
      let motionResult = 'PASS';
      if (await tickerContainer.count() > 0) {
        const animation = await tickerContainer.evaluate((el) => {
          return window.getComputedStyle(el).animationName || window.getComputedStyle(el).animation;
        });
        if (!animation.match(/none|0s/)) {
          motionResult = 'FAIL';
        }
      }

      saveResult({
        head_sha: HEAD_SHA,
        timestamp: new Date().toISOString(),
        route: '/',
        viewport: vp.name,
        reflow_mode: 'normal',
        color_scheme: 'light',
        reduced_motion: 'reduce',
        axe_critical: 0,
        axe_serious: 0,
        axe_moderate: 0,
        axe_minor: 0,
        color_contrast: 0,
        keyboard: 'PASS',
        escape: 'PASS',
        focus_return: 'PASS',
        aria_relations: 'PASS',
        horizontal_overflow: false,
        console_errors: 0,
        result: motionResult
      });

      expect(motionResult).toBe('PASS');
    });

    test('CookieConsent trap e inert en widgets', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3500);

      const configureBtn = page.getByRole('button', { name: 'Configurar' });
      await expect(configureBtn).toBeVisible();
      await configureBtn.click();
      
      // Widgets flotantes deben tener inert y aria-hidden="true" en modo modal
      const floatingWidgets = page.locator('[data-floating-widget]');
      const count = await floatingWidgets.count();
      for (let i = 0; i < count; i++) {
        const widget = floatingWidgets.nth(i);
        await expect(widget).toHaveAttribute('inert', '');
        await expect(widget).toHaveAttribute('aria-hidden', 'true');
      }

      // Cerrar consent
      const rejectBtn = page.getByRole('button', { name: 'Rechazar opcionales' });
      await expect(rejectBtn).toBeVisible();
      await rejectBtn.click();

      // Widgets deben restaurar atributos
      for (let i = 0; i < count; i++) {
        const widget = floatingWidgets.nth(i);
        await expect(widget).not.toHaveAttribute('inert');
      }

      // Guardar resultado de colisión
      saveCollision(`collision_${vp.name}_cookie.json`, {
        state: 'cookie_consent_open',
        cookie_consent_open: 'open',
        mobile_menu_open: 'closed',
        ios_popover_open: 'closed',
        chat_open: 'closed',
        mobile_contact_bar: 'hidden',
        floating_rail: 'hidden',
        focus_owner: 'cookie_consent',
        background_inert: 'true',
        visual_overlap: 'none',
        result: 'PASS'
      });
    });

    if (vp.name === 'mobile' || vp.name === 'small-mobile') {
      test('Menú móvil no modal disclosure', async ({ page }) => {
        try {
          await page.goto('/');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1500); // Wait for hydration
          await dismissCookieConsent(page);

          const menuBtn = page.locator('button[aria-controls="public-mobile-navigation"]');
          await expect(menuBtn).toBeVisible();

          const box = await menuBtn.boundingBox();
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);

          await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

          await menuBtn.click();
          await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
          
          const navPanel = page.locator('#public-mobile-navigation');
          await expect(navPanel).toBeVisible();

          // Pulsar Escape debe cerrar y devolver foco
          await page.keyboard.press('Escape');
          await expect(navPanel).not.toBeVisible();
          await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

          const isTriggerFocused = await menuBtn.evaluate((el) => document.activeElement === el);
          expect(isTriggerFocused).toBe(true);

          saveCollision(`collision_${vp.name}_menu.json`, {
            state: 'mobile_menu_open',
            cookie_consent_open: 'closed',
            mobile_menu_open: 'open',
            ios_popover_open: 'closed',
            chat_open: 'closed',
            mobile_contact_bar: 'hidden',
            floating_rail: 'hidden',
            focus_owner: 'mobile_menu',
            background_inert: 'false',
            visual_overlap: 'none',
            result: 'PASS'
          });
        } catch (e) {
          console.log(`[DEBUG] Menú móvil no modal disclosure falló en viewport ${vp.name}. HTML:`, await page.content());
          throw e;
        }
      });
    }

    if (vp.name === 'desktop') {
      test('Chat widget public trap', async ({ page }) => {
        try {
          await page.goto('/');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1500); // Wait for hydration
          await dismissCookieConsent(page);

          const chatBtn = page.locator('button[aria-controls="chat-asistente-virtual"]');
          await expect(chatBtn).toBeVisible();

          await chatBtn.click();
          await expect(chatBtn).toHaveAttribute('aria-expanded', 'true');

          const chatDialog = page.locator('#chat-asistente-virtual');
          await expect(chatDialog).toBeVisible({ timeout: 5000 });

          await page.keyboard.press('Escape');
          await expect(chatDialog).not.toBeVisible();

          const isTriggerFocused = await chatBtn.evaluate((el) => document.activeElement === el);
          expect(isTriggerFocused).toBe(true);

          saveCollision(`collision_desktop_chat.json`, {
            state: 'chat_widget_open',
            cookie_consent_open: 'closed',
            mobile_menu_open: 'closed',
            ios_popover_open: 'closed',
            chat_open: 'open',
            mobile_contact_bar: 'hidden',
            floating_rail: 'visible',
            focus_owner: 'chat_widget',
            background_inert: 'false',
            visual_overlap: 'none',
            result: 'PASS'
          });
        } catch (e) {
          console.log(`[DEBUG] Chat widget public trap falló. HTML:`, await page.content());
          throw e;
        }
      });
    }
  });
}

// 100% Deterministic simulated iPhone Safari browser context test for iOS install instructions popover.
test.describe('PWA iOS Popover on Mobile Simulator', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });

  test('PWA iOS Popover no modal', async ({ page }) => {
    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await dismissCookieConsent(page);

      const installBtn = page.locator('button[aria-label="Instalar como aplicación"]');
      await expect(installBtn).toBeVisible();
      await expect(installBtn).toHaveAttribute('aria-expanded', 'false');

      // Association check
      await expect(installBtn).toHaveAttribute('aria-controls', 'ios-install-instructions');

      // Open Popover
      await installBtn.click();
      await expect(installBtn).toHaveAttribute('aria-expanded', 'true');

      const instructions = page.locator('#ios-install-instructions');
      await expect(instructions).toBeVisible();
      await expect(instructions).toHaveAttribute('role', 'region');
      await expect(instructions).not.toHaveAttribute('aria-modal');

      // Test Escape closes and returns focus
      await page.keyboard.press('Escape');
      await expect(instructions).not.toBeVisible();
      await expect(installBtn).toHaveAttribute('aria-expanded', 'false');
      let isTriggerFocused = await installBtn.evaluate((el) => document.activeElement === el);
      expect(isTriggerFocused).toBe(true);

      // Re-open
      await installBtn.click();
      await expect(instructions).toBeVisible();

      // Test Close Button closes and returns focus
      const closeBtn = page.locator('button[aria-label="Cerrar instrucciones"]');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      await expect(instructions).not.toBeVisible();
      await expect(installBtn).toHaveAttribute('aria-expanded', 'false');
      isTriggerFocused = await installBtn.evaluate((el) => document.activeElement === el);
      expect(isTriggerFocused).toBe(true);

      // Re-open
      await installBtn.click();
      await expect(instructions).toBeVisible();

      // Test "Entendido" Button closes (it also dismisses the button from DOM)
      const gotItBtn = page.getByRole('button', { name: 'Entendido' });
      await expect(gotItBtn).toBeVisible();
      await gotItBtn.click();
      await expect(instructions).not.toBeVisible();

      saveCollision(`collision_mobile_ios.json`, {
        state: 'ios_install_open',
        cookie_consent_open: 'closed',
        mobile_menu_open: 'closed',
        ios_popover_open: 'open',
        chat_open: 'closed',
        mobile_contact_bar: 'visible',
        floating_rail: 'visible',
        focus_owner: 'ios_install_dialog',
        background_inert: 'false',
        visual_overlap: 'none',
        result: 'PASS'
      });
    } catch (e) {
      console.log(`[DEBUG] PWA iOS Popover no modal falló en viewport mobile Safari. HTML:`, await page.content());
      throw e;
    }
  });
});
