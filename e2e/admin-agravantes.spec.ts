import { test, expect } from '@playwright/test';

/**
 * E2E — Fase 3/4/5: rutas y APIs de agravantes específicas, supuestos penales
 * y remisiones normativas.
 *
 * Estas pruebas validan el comportamiento de protección de rutas y el
 * contrato de las APIs nuevas. Todas las APIs internas (incluida
 * /api/remisiones-normativas) están protegidas por el proxy (reglas 17-19
 * AGENTS.md: uso exclusivo del bufete). La página admin requiere rol admin.
 *
 * La suite valida que sin sesión:
 *  - Las APIs devuelven 401 (no exponen datos internos al público).
 *  - La página admin redirige al login.
 */
test.describe('Fase 3/4/5 — Agravantes, supuestos penales y remisiones', () => {

  // -----------------------------------------------------------------------
  // Rutas admin protegidas (sin auth → login)
  // -----------------------------------------------------------------------
  test('/intranet/admin/agravantes redirige a login si no hay sesión', async ({ page }) => {
    const res = await page.goto('/intranet/admin/agravantes');
    // El proxy redirige a /intranet/login cuando no hay token.
    expect([200, 307, 302], 'status permitido (redirect a login)').toContain(res?.status() ?? 0);
    // Debe terminar en login o en la página de acceso denegado.
    await expect(page).toHaveURL(/\/intranet\/(login|acceso-denegado)/, { timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // API protegida: remisiones normativas (GET requiere auth — uso interno)
  // -----------------------------------------------------------------------
  test('GET /api/remisiones-normativas sin auth → 401 (uso interno del bufete)', async ({ request }) => {
    const res = await request.get('/api/remisiones-normativas');
    expect(res.status(), 'debe requerir auth (no público)').toBe(401);
  });

  test('GET /api/remisiones-normativas?articulo=370 sin auth → 401', async ({ request }) => {
    const res = await request.get('/api/remisiones-normativas?articulo=370');
    expect(res.status()).toBe(401);
  });

  // -----------------------------------------------------------------------
  // API protegida: supuestos penales (requiere auth)
  // -----------------------------------------------------------------------
  test('GET /api/supuestos-penales sin delitoId → 400 o 401', async ({ request }) => {
    const res = await request.get('/api/supuestos-penales');
    // Sin auth → 401; o si pasa auth pero falta delitoId → 400.
    expect([400, 401]).toContain(res.status());
  });

  test('GET /api/admin/agravantes sin auth → 401', async ({ request }) => {
    const res = await request.get('/api/admin/agravantes');
    expect(res.status(), 'admin requiere auth').toBe(401);
  });

  test('GET /api/admin/supuestos-penales sin auth → 401', async ({ request }) => {
    const res = await request.get('/api/admin/supuestos-penales');
    expect(res.status(), 'admin requiere auth').toBe(401);
  });

  test('POST /api/admin/agravantes sin auth → 401', async ({ request }) => {
    const res = await request.post('/api/admin/agravantes', {
      data: {
        supuesto_penal_id: '00000000-0000-0000-0000-000000000001',
        articulo_cp: '999',
        texto_agravante: 'test',
        fraccion_aumento: '1/3',
      },
    });
    expect(res.status(), 'crear agravante requiere auth').toBe(401);
  });

  // -----------------------------------------------------------------------
  // Validación del schema de creación (fracción inválida)
  // -----------------------------------------------------------------------
  test('POST /api/admin/agravantes con fracción inválida → 401 (auth antes que validación)', async ({ request }) => {
    const res = await request.post('/api/admin/agravantes', {
      data: {
        supuesto_penal_id: '00000000-0000-0000-0000-000000000001',
        articulo_cp: '999',
        texto_agravante: 'test',
        fraccion_aumento: 'invalida', // no cumple regex ^\d+/\d+$
      },
    });
    // 401 por falta de auth (la validación de schema ocurre después del auth).
    expect(res.status()).toBe(401);
  });
});
