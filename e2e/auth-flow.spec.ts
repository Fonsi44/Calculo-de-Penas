import { test, expect, type APIResponse } from '@playwright/test';

const TEST_EMAIL = 'auth-test@pinedayasociadoshn.com';
const TEST_PASSWORD = 'e2e-test-password-X7q9Zk';

function getPrimaryCookie(res: APIResponse): string {
  const cookies = res.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
  expect(cookies.length, 'al menos un Set-Cookie').toBeGreaterThan(0);
  return cookies[0].value.split(';')[0];
}

function getAllSetCookie(res: APIResponse): string[] {
  return res.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie').map(h => h.value);
}

test.describe('Auth flow E2E (API)', () => {
  test.describe.configure({ mode: 'serial' });

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
    const setCookieHeader = res.headersArray().find(h => h.name.toLowerCase() === 'set-cookie');
    expect(setCookieHeader?.value, 'Set-Cookie debe incluir HttpOnly').toMatch(/HttpOnly/i);
    expect(primary, 'cookie de sesión presente').toMatch(/(__Host-)?token=/);
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
      headers: { Cookie: cookieValue, Origin: 'http://localhost:3000' },
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

  test('rate limit en login: bloquea tras mÃºltiples intentos', async ({ request }) => {
    const uniqueId = `rl-${Date.now()}`;
    let got429 = false;
    for (let i = 0; i < 12; i++) {
      const res = await request.post('/api/auth/login', {
        data: { email: `${uniqueId}-${i}@pinedayasociadoshn.com`, password: 'wrong' },
      });
      if (res.status() === 429) { got429 = true; break; }
    }
    expect(got429, 'debe recibir 429 rate-limited tras mÃºltiples intentos fallidos').toBe(true);
  });
});
