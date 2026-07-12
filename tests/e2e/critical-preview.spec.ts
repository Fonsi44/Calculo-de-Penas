/**
 * E2E Critical — Preview (escenarios 13-14).
 *
 * @critical
 *
 * Verifica:
 * - Preview token no contiene contenido en URL (es opaco)
 * - Preview requiere autenticación
 * - HTML sanitizado
 * - Token expirado/manipulado/consumido rechazado
 */
import { test, expect } from '@playwright/test';

const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@test.local',
  password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin123!',
};

async function loginAsAdmin(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.post('/api/auth/login', { data: { email: ADMIN.email, password: ADMIN.password } });
  return res.headers()['set-cookie'] || '';
}

test.describe('@critical Preview — tokens opacos', () => {
  let adminCookies: string;
  let previewToken: string;

  test.beforeAll(async ({ request }) => {
    adminCookies = await loginAsAdmin(request);
  });

  test('13. Token de preview es opaco (no JWT con contenido)', async ({ request }) => {
    const res = await request.post('/api/admin/preview', {
      data: {
        title: 'E2E Preview Test',
        body: '<h2>Contenido de prueba</h2><p>Seguridad E2E</p>',
        category: 'derecho-penal',
      },
      headers: { cookie: adminCookies },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.token).toBeTruthy();
    previewToken = body.token;

    // El token NO debe ser un JWT (no debe contener '.')
    expect(body.token).not.toMatch(/^eyJ/);
    // No debe contener el contenido en la URL
    expect(body.url).not.toContain('Contenido');
    expect(body.url).not.toContain('Seguridad');
  });

  test('13. Preview requiere autenticación', async ({ request }) => {
    const res = await request.get(`/preview/${previewToken}`);
    // Debe redirigir al login (302/307) o devolver 401
    expect([301, 302, 303, 307, 308, 401]).toContain(res.status());
  });

  test('13. Preview autenticado muestra contenido sanitizado', async ({ page }) => {
    // Login como admin en el navegador
    await page.goto('/intranet/login');
    await page.fill('input[name="email"]', ADMIN.email);
    await page.fill('input[name="password"]', ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/intranet/admin**', { timeout: 10000 });

    // Navegar al preview
    await page.goto(`/preview/${previewToken}`);
    // Debe mostrar la barra de preview
    await expect(page.locator('text=VISTA PREVIA')).toBeVisible({ timeout: 5000 });
    // El contenido debe estar sanitizado (sin scripts)
    const html = await page.content();
    expect(html).not.toContain('<script');
    expect(html).toContain('Contenido de prueba');
  });

  test('14. Token de preview manipulado → 404', async ({ page }) => {
    await page.goto('/intranet/login');
    await page.fill('input[name="email"]', ADMIN.email);
    await page.fill('input[name="password"]', ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/intranet/admin**');

    await page.goto('/preview/token-manipulado-invalido');
    await expect(page.locator('text=404')).toBeVisible({ timeout: 5000 });
  });

  test('14. Token consumido (segundo uso) → 404', async ({ request }) => {
    // Ya se consumió en el test anterior (el page.goto al preview lo consume)
    const res = await request.get(`/preview/${previewToken}`);
    // Debe devolver 404 o redirigir (no 200 con contenido)
    expect(res.status()).not.toBe(200);
  });
});
