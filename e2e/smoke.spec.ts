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
});
