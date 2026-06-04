import { test, expect } from '@playwright/test';

test.describe('Smoke — rutas públicas', () => {
  test('home responde 200 y muestra hero', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    const res = await page.goto('/');
    expect(res?.status(), 'home status').toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(consoleErrors, 'no debe haber errores de consola').toEqual([]);
  });

  test('login page carga y permite alternar modo', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/LEX/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();

    const registerToggle = page.getByRole('button', { name: /registr/i }).first();
    if (await registerToggle.isVisible()) {
      await registerToggle.click();
      await expect(page.getByLabel(/nombre/i)).toBeVisible();
    }
  });

  test('atajos page carga', async ({ page }) => {
    const res = await page.goto('/atajos');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('calculadora redirige a login si no autenticado o carga la UI', async ({ page }) => {
    const res = await page.goto('/calculadora');
    expect([200, 307, 302], 'status permitido').toContain(res?.status() ?? 0);

    await expect(page.locator('body')).toBeVisible();
  });

  test('delitos page carga con listado', async ({ page }) => {
    const res = await page.goto('/delitos');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('CSP header presente y endurecido', async ({ request }) => {
    const res = await request.get('/');
    const csp = res.headers()['content-security-policy'];
    expect(csp, 'CSP debe estar presente').toBeTruthy();
    expect(csp, 'CSP no debe contener unsafe-eval').not.toContain('unsafe-eval');
    expect(csp, 'CSP debe incluir object-src none').toContain("object-src 'none'");
    expect(csp, 'CSP debe incluir frame-ancestors none').toContain("frame-ancestors 'none'");
  });

  test('terminos page carga y muestra secciones legales', async ({ page }) => {
    const res = await page.goto('/terminos');
    expect(res?.status()).toBe(200);
    const content = await page.content();
    expect(content).toMatch(/Términos y Condiciones/i);
    expect(content).toMatch(/sin asesoramiento legal/i);
    expect(content).toMatch(/Ley Aplicable/i);
  });

  test('privacidad page carga y muestra secciones legales', async ({ page }) => {
    const res = await page.goto('/privacidad');
    expect(res?.status()).toBe(200);
    const content = await page.content();
    expect(content).toMatch(/Privacidad/i);
    expect(content).toMatch(/Responsable del Tratamiento/i);
    expect(content).toMatch(/Base Legal/i);
  });

  test('dark mode: clase .dark aplica variables CSS correctas', async ({ page }) => {
    await page.goto('/login');
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
