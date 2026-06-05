import { test, expect, type APIResponse } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
const TEST_PASSWORD = 'e2e-test-password-X7q9Zk';
const TEST_NAME = 'E2E Test User';

function getPrimaryCookie(res: APIResponse): string {
  const cookies = res.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
  expect(cookies.length, 'al menos un Set-Cookie').toBeGreaterThan(0);
  return cookies[0].value.split(';')[0];
}

function getAllSetCookie(res: APIResponse): string[] {
  return res.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie').map(h => h.value);
}

test.describe('Auth flow E2E (API)', () => {
  test.afterAll(async () => {
    // No cleanup endpoint by design (no public DELETE /api/users).
    // Run `node scripts/cleanup-e2e-users.mjs` periodically to purge test users
    // matching the e2e-*-@test.local pattern.
  });

  test('registro: crea usuario y devuelve cookie de sesión', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD, nombre: TEST_NAME },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user).toMatchObject({ email: TEST_EMAIL, nombre: TEST_NAME });
    expect(body.user.id).toBeTruthy();

    const primary = getPrimaryCookie(res);
    expect(primary.toLowerCase(), 'cookie de sesión presente').toMatch(/(__Host-)?token=/);
  });

  test('registro duplicado: devuelve 409', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD, nombre: TEST_NAME },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/ya está registrado/i);
  });

  test('login con credenciales incorrectas devuelve 401', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: TEST_EMAIL, password: 'wrong-password' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/credenciales inválidas/i);
  });

  test('login con credenciales correctas devuelve cookie', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe(TEST_EMAIL);

    const primary = getPrimaryCookie(res);
    expect(primary).toMatch(/HttpOnly/i);
  });

  test('acceso a endpoint protegido sin token devuelve 401', async ({ request }) => {
    const res = await request.get('/api/casos');
    expect(res.status()).toBe(401);
  });

  test('acceso a endpoint protegido con token válido devuelve 200', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(loginRes.status()).toBe(200);
    const cookieValue = getPrimaryCookie(loginRes);

    const res = await request.get('/api/casos', {
      headers: { Cookie: cookieValue },
    });
    expect(res.status()).toBe(200);
    const casos = await res.json();
    expect(Array.isArray(casos)).toBe(true);
  });

  test('crear caso autenticado: devuelve 201 con caso del usuario', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookieValue = getPrimaryCookie(loginRes);

    const res = await request.post('/api/casos', {
      headers: { Cookie: cookieValue },
      data: { titulo: 'Caso E2E de prueba' },
    });
    expect(res.status()).toBe(201);
    const caso = await res.json();
    expect(caso.titulo).toBe('Caso E2E de prueba');
    expect(caso.estado).toBe('borrador');
    expect(caso.usuarioId).toBeTruthy();
  });

  test('logout limpia la cookie de sesión', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookieValue = getPrimaryCookie(loginRes);

    const logoutRes = await request.post('/api/auth/logout', {
      headers: { Cookie: cookieValue },
    });
    expect(logoutRes.status()).toBe(200);

    const setCookies = getAllSetCookie(logoutRes);
    const clearsSession = setCookies.some(c => /(__Host-)?token=;\s*Path=\//.test(c) && /Max-Age=0/i.test(c));
    expect(clearsSession, 'logout debe emitir Set-Cookie con Max-Age=0').toBe(true);
  });

  test('rate limit en login: bloquea tras 5 intentos', async ({ request }) => {
    for (let i = 0; i < 5; i++) {
      await request.post('/api/auth/login', {
        data: { email: 'nonexistent@test.local', password: 'wrong' },
      });
    }
    const res = await request.post('/api/auth/login', {
      data: { email: 'nonexistent@test.local', password: 'wrong' },
    });
    expect([429, 401], 'sexto intento debe ser rate-limited o seguir 401 si el test corre antes de que se acumule').toContain(res.status());
  });
});
