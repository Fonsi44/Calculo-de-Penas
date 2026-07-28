/**
 * E2E Critical — Matriz de Autorización (escenarios 9-12).
 *
 * @critical
 *
 * Verifica:
 * - APIs admin rechazan abogado y anónimo
 * - Abogado A no accede a clientes/expedientes del abogado B (IDOR/BOLA)
 * - Mutación cruzada sin filas modificadas
 * - Admin conserva acceso legítimo a todo
 */
import { test, expect } from '@playwright/test';

const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@test.local',
  password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin123!',
};
const ABOGADO_A = {
  email: process.env.E2E_ABOGADO_A_EMAIL || 'abogado-a@test.local',
  password: process.env.E2E_ABOGADO_A_PASSWORD || 'TestAbogadoA123!',
};
const ABOGADO_B = {
  email: process.env.E2E_ABOGADO_B_EMAIL || 'abogado-b@test.local',
  password: process.env.E2E_ABOGADO_B_PASSWORD || 'TestAbogadoB123!',
};

const CLI_A1 = 'bbbbbbbb-0000-4000-a000-000000000001';
const EXP_A1 = 'cccccccc-0000-4000-a000-000000000001';

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post('/api/auth/login', { data: { email, password } });
  // Extraer solo el par name=value del header Set-Cookie (sin atributos como
  // HttpOnly, Path, SameSite que son inválidos en un header Cookie de request).
  const setCookie = res.headers()['set-cookie'] || '';
  return setCookie.split(';')[0];
}

test.describe('@critical Authorization — Roles y scope', () => {
  test('9. APIs admin rechazan abogado (403)', async ({ request }) => {
    const cookiesA = await loginAs(request, ABOGADO_A.email, ABOGADO_A.password);
    const res = await request.get('/api/admin/usuarios', { headers: { cookie: cookiesA } });
    expect(res.status()).toBe(403);
  });

  test('9. APIs admin rechazan anónimo (401)', async ({ request }) => {
    const res = await request.get('/api/admin/usuarios');
    expect(res.status()).toBe(401);
  });

  test('10. Abogado A obtiene sus clientes', async ({ request }) => {
    const cookiesA = await loginAs(request, ABOGADO_A.email, ABOGADO_A.password);
    const res = await request.get('/api/sgie/clientes', { headers: { cookie: cookiesA } });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.clientes?.length).toBeGreaterThan(0);
    // Su cliente debe estar en la lista
    const ids = body.clientes.map((c: { id: string }) => c.id);
    expect(ids).toContain(CLI_A1);
  });

  test('10. Abogado B NO ve cliente de A (IDOR — 404 indistinguible)', async ({ request }) => {
    const cookiesB = await loginAs(request, ABOGADO_B.email, ABOGADO_B.password);
    // Intentar leer cliente de A directamente
    const res = await request.get(`/api/sgie/clientes/${CLI_A1}`, {
      headers: { cookie: cookiesB },
    });
    // 404 indistinguible de "no existe"
    expect(res.status()).toBe(404);
    // La respuesta no debe filtrar ninguna información
    const body = await res.json();
    expect(body.id).toBeUndefined();
  });

  test('11. Abogado B no puede modificar cliente de A (mutación cruzada → 404 sin filas)', async ({ request }) => {
    const cookiesB = await loginAs(request, ABOGADO_B.email, ABOGADO_B.password);
    // PATCH cliente de A con notas de "ataque". Origin requerido por CSRF
    // (un navegador real siempre lo envía en mutaciones).
    const res = await request.patch(`/api/sgie/clientes/${CLI_A1}`, {
      data: { notas: 'HACK ATTEMPT' },
      headers: { cookie: cookiesB, Origin: 'http://localhost:3100' },
    });
    // Debe devolver 404 (no 403, para no revelar existencia)
    expect(res.status()).toBe(404);
  });

  test('10/11. Admin sí accede al cliente de A', async ({ request }) => {
    const cookiesAdmin = await loginAs(request, ADMIN.email, ADMIN.password);
    const res = await request.get(`/api/sgie/clientes/${CLI_A1}`, {
      headers: { cookie: cookiesAdmin },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // El API devuelve { cliente: { id, ... } }.
    const cliente = body.cliente ?? body;
    expect(cliente.id).toBe(CLI_A1);
    expect(cliente.email).toBeTruthy();
  });

  test('12. Admin puede acceder a cualquier expediente', async ({ request }) => {
    const cookiesAdmin = await loginAs(request, ADMIN.email, ADMIN.password);
    const res = await request.get(`/api/sgie/expedientes/${EXP_A1}`, {
      headers: { cookie: cookiesAdmin },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('12. Admin conserva acceso a SGIE', async ({ request }) => {
    const cookiesAdmin = await loginAs(request, ADMIN.email, ADMIN.password);
    const res = await request.get('/api/sgie/clientes', { headers: { cookie: cookiesAdmin } });
    expect(res.ok()).toBeTruthy();
  });
});
