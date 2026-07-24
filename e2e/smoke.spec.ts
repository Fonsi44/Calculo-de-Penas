import { test, expect } from '@playwright/test';

const CSP_EVAL_WARN = 'eval() is not supported in this environment';

function isRealError(msg: string) {
  return !msg.includes(CSP_EVAL_WARN);
}

test.describe('Smoke — rutas públicas', () => {
  test('home responde 200 y muestra hero', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isRealError(msg.text())) consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => isRealError(err.message) && consoleErrors.push(err.message));

    const res = await page.goto('/');
    expect(res?.status(), 'home status').toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(consoleErrors, 'no debe haber errores de consola reales').toEqual([]);
  });

  test('login page carga y permite alternar modo', async ({ page }) => {
    await page.goto('/intranet/login');
    await expect(page).toHaveTitle(/Pineda y Asociados|LEX/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();

    const registerToggle = page.getByRole('button', { name: /registr/i }).first();
    if (await registerToggle.isVisible()) {
      await registerToggle.click();
      await expect(page.getByLabel(/nombre/i)).toBeVisible();
    }
  });

  test('atajos page es privada (404 público)', async ({ page }) => {
    const res = await page.goto('/atajos');
    expect(res?.status()).toBe(404);
  });

  test('calculadora es privada (404 público)', async ({ page }) => {
    const res = await page.goto('/calculadora');
    expect(res?.status()).toBe(404);
  });

  test('/login ya no es una ruta pública (404 correcto)', async ({ page }) => {
    // `/login` fue eliminado como ruta pública; solo existe `/intranet/login`.
    // Ver proxy.ts: PUBLIC_PAGE_EXACT no incluye '/login'.
    const res = await page.goto('/login');
    expect(res?.status()).toBe(404);
  });

  test('delitos page es privada (404 público)', async ({ page }) => {
    const res = await page.goto('/delitos');
    expect(res?.status()).toBe(404);
  });

  test('CSP header presente y endurecido', async ({ request }) => {
    const res = await request.get('/');
    const csp = res.headers()['content-security-policy'];
    expect(csp, 'CSP debe estar presente').toBeTruthy();
    expect(csp, 'CSP no debe contener unsafe-eval').not.toContain('unsafe-eval');
    expect(csp, 'CSP debe incluir object-src none').toContain("object-src 'none'");
    expect(csp, 'CSP debe incluir frame-ancestors self').toContain("frame-ancestors 'self'");
  });

  test('terminos page carga y muestra secciones legales', async ({ page }) => {
    const res = await page.goto('/terminos');
    expect(res?.status()).toBe(200);
    const content = await page.content();
    expect(content).toMatch(/Términos y Condiciones/i);
    expect(content).toMatch(/asesoramiento legal/i);
    expect(content).toMatch(/Ley aplicable/i);
  });

  test('aviso-legal page carga y muestra secciones legales', async ({ page }) => {
    const res = await page.goto('/aviso-legal');
    expect(res?.status()).toBe(200);
    const content = await page.content();
    expect(content).toMatch(/Aviso Legal/i);
    expect(content).toMatch(/Marco normativo/i);
  });

  test('politica-privacidad page carga y muestra secciones legales', async ({ page }) => {
    const res = await page.goto('/politica-privacidad');
    expect(res?.status()).toBe(200);
    const content = await page.content();
    expect(content).toMatch(/Privacidad/i);
    expect(content).toMatch(/Responsable/i);
    expect(content).toMatch(/Base legal/i);
  });

  test('politica-cookies page carga y muestra secciones legales', async ({ page }) => {
    const res = await page.goto('/politica-cookies');
    expect(res?.status()).toBe(200);
    const content = await page.content();
    expect(content).toMatch(/Cookies/i);
    expect(content).toMatch(/__Host-token/);
  });

  test('disclaimer page carga y muestra secciones legales', async ({ page }) => {
    const res = await page.goto('/disclaimer');
    expect(res?.status()).toBe(200);
    const content = await page.content();
    expect(content).toMatch(/Disclaimer/i);
    expect(content).toMatch(/calculadora de penas/i);
  });

  test('redirect /privacidad → /politica-privacidad', async ({ page }) => {
    const res = await page.goto('/privacidad');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveURL(/\/politica-privacidad$/);
  });

  test('dark mode: clase .dark aplica variables CSS correctas', async ({ page }) => {
    await page.goto('/intranet/login');
    const html = page.locator('html');

    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(lightBg).toBeTruthy();

    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lex-theme', 'dark');
    });
    await expect(html).toHaveClass(/dark/);

    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(darkBg, 'bg debe cambiar al activar dark').not.toBe(lightBg);

    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lex-theme', 'light');
    });
    await expect(html).not.toHaveClass(/dark/);

    const lightBg2 = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(lightBg2, 'bg debe volver al valor original').toBe(lightBg);
  });
});
