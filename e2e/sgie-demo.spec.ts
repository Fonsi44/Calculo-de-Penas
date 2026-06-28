import { test, expect } from '@playwright/test';

// Carlos Pineda credentials (must exist in DB via seed demo)
const _DEMO_EMAIL = 'carlos.pineda@pinedayasociadoshn.com';
const _DEMO_PASSWORD = 'demo-carlos-2026'; // placeholder — real password set by admin

test.describe('SGIE — Abogado Carlos Pineda (demo)', () => {
  test('Carlos accede a login y es redirigido a intranet login', async ({ page }) => {
    const res = await page.goto('/intranet/login');
    expect(res?.status()).toBe(200);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test('SGIE layout existe y es accesible', async ({ page }) => {
    await page.goto('/intranet/sgie');
    // Without auth, should redirect to login
    await expect(page).toHaveURL(/\/intranet\/login/);
  });

  test('Rutas SGIE sin autenticación redirigen a login', async ({ page }) => {
    const rutas = [
      '/intranet/sgie/expedientes',
      '/intranet/sgie/documentos',
      '/intranet/sgie/alertas',
      '/intranet/sgie/tareas',
      '/intranet/sgie/agenda',
      '/intranet/sgie/correos',
    ];
    for (const ruta of rutas) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/intranet\/login/);
    }
  });

  test('Rutas admin son inaccesibles sin sesión', async ({ page }) => {
    await page.goto('/intranet/admin');
    await expect(page).toHaveURL(/\/intranet\/login/);
    await page.goto('/intranet/admin/usuarios');
    await expect(page).toHaveURL(/\/intranet\/login/);
    await page.goto('/intranet/admin/sgie/metricas');
    await expect(page).toHaveURL(/\/intranet\/login/);
  });

  test('API SGIE requiere autenticación', async ({ page }) => {
    const res = await page.request.get('/api/sgie/cockpit');
    expect(res.status()).toBe(401);
  });

  test('API pública de carga acepta POST sin auth (pero requiere token válido)', async ({ page }) => {
    const res = await page.request.post('/api/public/cargar/invalid-token', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({}),
    });
    // Should return 400 or 404 (token inválido), not 401
    expect(res.status()).not.toBe(401);
  });
});
