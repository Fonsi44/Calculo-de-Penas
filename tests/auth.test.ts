import { describe, it, expect } from 'vitest';
import {
  signToken,
  verifyToken,
  signTwoFactorChallenge,
  verifyTwoFactorChallenge,
  requireAuth,
  requireAdmin,
  getTokenFromCookies,
  authFailureResponse,
  createAuthResponse,
  createLogoutResponse,
  hashPassword,
  verifyPassword,
  AuthError,
  COOKIE_NAME,
  getCookieName,
} from '../lib/auth';
import jwt from 'jsonwebtoken';

describe('lib/auth — signToken / verifyToken', () => {
  const payload = { userId: 'user-1', email: 'a@b.com', rol: 'abogado' };

  it('firma y verifica un token válido', () => {
    const t = signToken(payload);
    const r = verifyToken(t);
    expect(r).not.toBeNull();
    expect(r?.userId).toBe(payload.userId);
    expect(r?.email).toBe(payload.email);
    expect(r?.rol).toBe(payload.rol);
    expect(r?.purpose).toBe('session');
  });

  it('rechaza challenges 2FA y JWT antiguos como sesión', () => {
    const challenge = signTwoFactorChallenge({ userId: 'user-1', jti: 'challenge-1' });
    expect(verifyToken(challenge)).toBeNull();
    expect(verifyTwoFactorChallenge(challenge)?.purpose).toBe('2fa_challenge');
  });

  it('rechaza una sesión como challenge 2FA', () => {
    expect(verifyTwoFactorChallenge(signToken(payload))).toBeNull();
  });

  it('rechaza JWT antiguo sin purpose y challenge expirado', () => {
    const secret = 'dev-only-secret-not-for-production-min-32-chars-AAAAA';
    const legacy = jwt.sign({ userId: 'user-1', email: 'a@b.com', rol: 'abogado' }, secret, { expiresIn: '1h' });
    const expired = jwt.sign({ purpose: '2fa_challenge', userId: 'user-1', jti: 'expired' }, secret, { expiresIn: -1 });
    expect(verifyToken(legacy)).toBeNull();
    expect(verifyTwoFactorChallenge(expired)).toBeNull();
  });

  it('retorna null ante token mal formado', () => {
    expect(verifyToken('no-es-jwt')).toBeNull();
    expect(verifyToken('a.b.c')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });

  it('retorna null ante firma inválida', () => {
    const t = signToken(payload);
    const corrupto = t.slice(0, -3) + 'AAA';
    expect(verifyToken(corrupto)).toBeNull();
  });
});

describe('lib/auth — getTokenFromCookies', () => {
  it('lee la cookie primaria', () => {
    const req = new Request('http://x', { headers: { cookie: `${COOKIE_NAME}=abc123` } });
    expect(getTokenFromCookies(req)).toBe('abc123');
  });

  it('retorna null sin cookie', () => {
    const req = new Request('http://x');
    expect(getTokenFromCookies(req)).toBeNull();
  });

  it('no decodifica cookies con prefijo similar', () => {
    const req = new Request('http://x', { headers: { cookie: 'otro=zzz' } });
    expect(getTokenFromCookies(req)).toBeNull();
  });

  it('maneja múltiples cookies', () => {
    const req = new Request('http://x', {
      headers: { cookie: `a=1; ${COOKIE_NAME}=mid; b=2` },
    });
    expect(getTokenFromCookies(req)).toBe('mid');
  });
});

describe('lib/auth — requireAuth / requireAdmin', () => {
  const payload = { userId: 'u-1', email: 'a@b.c', rol: 'abogado' };
  const adminPayload = { userId: 'u-2', email: 'admin@b.c', rol: 'admin' };

  function authedRequest(rol: 'abogado' | 'admin' = 'abogado'): Request {
    const t = signToken(rol === 'admin' ? adminPayload : payload);
    return new Request('http://x', { headers: { cookie: `${COOKIE_NAME}=${t}` } });
  }

  it('requireAuth retorna el payload con token válido', async () => {
    const u = await requireAuth(authedRequest());
    expect(u.userId).toBe('u-1');
    expect(u.rol).toBe('abogado');
  });

  it('requireAuth lanza AuthError 401 sin token', async () => {
    await expect(requireAuth(new Request('http://x'))).rejects.toThrow(AuthError);
    try {
      await requireAuth(new Request('http://x'));
    } catch (e) {
      expect((e as AuthError).status).toBe(401);
    }
  });

  it('requireAuth rechaza un challenge puesto como cookie de sesión', async () => {
    const challenge = signTwoFactorChallenge({ userId: 'u-1', jti: 'challenge-cookie' });
    await expect(requireAuth(new Request('http://x', { headers: { cookie: `${COOKIE_NAME}=${challenge}` } })))
      .rejects.toThrow(AuthError);
  });

  it('requireAdmin acepta rol admin', async () => {
    const u = await requireAdmin(authedRequest('admin'));
    expect(u.rol).toBe('admin');
  });

  it('requireAdmin rechaza rol abogado con 403', async () => {
    try {
      await requireAdmin(authedRequest('abogado'));
      throw new Error('debio haber lanzado');
    } catch (e) {
      expect((e as AuthError).status).toBe(403);
    }
  });
});

describe('lib/auth — authFailureResponse', () => {
  it('mapea AuthError 401 a Response 401', async () => {
    const r = authFailureResponse(new AuthError(401, 'No autorizado'));
    expect(r.status).toBe(401);
    const body = await r.json();
    expect(body.error).toBe('No autorizado');
  });

  it('mapea AuthError 403 a Response 403', async () => {
    const r = authFailureResponse(new AuthError(403, 'Requiere admin'));
    expect(r.status).toBe(403);
  });

  it('errores desconocidos devuelven 500 sin degradarlos a fallo de autenticación', async () => {
    const r = authFailureResponse(new Error('boom'));
    expect(r.status).toBe(500);
    const body = await r.json();
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.correlationId).toBeTruthy();
  });
});

describe('lib/auth — createAuthResponse / createLogoutResponse', () => {
  it('createAuthResponse sin token no setea cookie', async () => {
    const r = createAuthResponse({ ok: true });
    expect(r.headers.get('set-cookie')).toBeNull();
    const body = await r.json();
    expect(body.ok).toBe(true);
  });

  it('createAuthResponse con token setea cookie', () => {
    const r = createAuthResponse({ ok: true }, 'jwt.token.here');
    const set = r.headers.get('set-cookie');
    expect(set).not.toBeNull();
    // El nombre de la cookie depende del entorno (getCookieName). En test
    // (NODE_ENV=test) se usa 'token'.
    expect(set).toContain(`${getCookieName()}=jwt.token.here`);
    expect(set).toContain('HttpOnly');
    expect(set).toContain('SameSite=Lax');
  });

  it('createLogoutResponse limpia cookie primaria', () => {
    const r = createLogoutResponse();
    const set = r.headers.get('set-cookie');
    expect(set).toContain(`${COOKIE_NAME}=`);
    expect(set).toContain('Max-Age=0');
  });
});

describe('lib/auth — cookie según entorno (getCookieName / shouldUseHostCookie)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const env = process.env as Record<string, string | undefined>;

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv;
    const g = globalThis as { __E2E_LOCAL_HTTP?: boolean };
    delete g.__E2E_LOCAL_HTTP;
  });

  it('development: token sin Secure', () => {
    env.NODE_ENV = 'development';
    const g = globalThis as { __E2E_LOCAL_HTTP?: boolean };
    g.__E2E_LOCAL_HTTP = false;
    expect(getCookieName()).toBe('token');
  });

  it('test: token sin Secure', () => {
    env.NODE_ENV = 'test';
    expect(getCookieName()).toBe('token');
  });

  it('production, global false: __Host-token con Secure', () => {
    env.NODE_ENV = 'production';
    const g = globalThis as { __E2E_LOCAL_HTTP?: boolean };
    g.__E2E_LOCAL_HTTP = false;
    expect(getCookieName()).toBe('__Host-token');
  });

  it('production + variables E2E, global false: __Host-token (no degrada)', () => {
    env.NODE_ENV = 'production';
    env.E2E_ENVIRONMENT = 'staging';
    env.E2E_LOCAL_HTTP = 'true';
    const g = globalThis as { __E2E_LOCAL_HTTP?: boolean };
    g.__E2E_LOCAL_HTTP = false; // instrumentation NO activó el modo
    expect(getCookieName()).toBe('__Host-token');
  });

  it('production, global true (E2E validado): token sin Secure', () => {
    env.NODE_ENV = 'production';
    const g = globalThis as { __E2E_LOCAL_HTTP?: boolean };
    g.__E2E_LOCAL_HTTP = true;
    expect(getCookieName()).toBe('token');
  });

  it('Host y Origin no afectan la decisión', () => {
    env.NODE_ENV = 'production';
    const g = globalThis as { __E2E_LOCAL_HTTP?: boolean };
    g.__E2E_LOCAL_HTTP = false;
    // Simular request con Host falsificado no cambia nada:
    expect(getCookieName()).toBe('__Host-token');
  });

  it('createAuthResponse en producción usa __Host-token + Secure', () => {
    env.NODE_ENV = 'production';
    const g = globalThis as { __E2E_LOCAL_HTTP?: boolean };
    g.__E2E_LOCAL_HTTP = false;
    const r = createAuthResponse({ ok: true }, 'jwt.token.here');
    const set = r.headers.get('set-cookie') || '';
    expect(set).toContain('__Host-token=jwt.token.here');
    expect(set).toContain('Secure');
    expect(set).toContain('HttpOnly');
  });

  it('createAuthResponse en E2E validado usa token sin Secure', () => {
    env.NODE_ENV = 'production';
    const g = globalThis as { __E2E_LOCAL_HTTP?: boolean };
    g.__E2E_LOCAL_HTTP = true;
    const r = createAuthResponse({ ok: true }, 'jwt.token.here');
    const set = r.headers.get('set-cookie') || '';
    expect(set).toContain('token=jwt.token.here');
    expect(set).not.toContain('Secure');
  });
});

describe('lib/auth — hashPassword / verifyPassword', () => {
  it('hashea y verifica correctamente', async () => {
    const h = await hashPassword('secreto-123');
    expect(h).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword('secreto-123', h)).toBe(true);
    expect(await verifyPassword('incorrecto', h)).toBe(false);
  });

  it('dos hashes del mismo password son distintos (salt)', async () => {
    const h1 = await hashPassword('secreto-123');
    const h2 = await hashPassword('secreto-123');
    expect(h1).not.toBe(h2);
    expect(await verifyPassword('secreto-123', h1)).toBe(true);
    expect(await verifyPassword('secreto-123', h2)).toBe(true);
  }, 15000);
});
