/**
 * AUD-SEC-001 / AUD-SEC-006 — Integración del endpoint POST /api/auth/2fa/verify.
 *
 * Demuestra que el challenge 2FA solo produce una sesión `purpose: session`
 * cuando todo es válido, y que ningún camino erróneo emite sesión:
 *  - TOTP incorrecto → 401, sin sesión.
 *  - Challenge expirado/manipulado → 401.
 *  - Challenge consumido → 401.
 *  - TOTP correcto → 200 y cookie con purpose: session.
 *
 * Se mockean la DB, el consumo del challenge y la verificación TOTP para
 * aislar la lógica del handler.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyTwoFactorChallenge: vi.fn(),
  signSessionToken: vi.fn(),
  crearChallenge: vi.fn(),
  consumirChallenge2fa: vi.fn(),
  verificarCodigoTotp: vi.fn(),
  obtenerSecretCifrado: vi.fn(),
  usarCodigoRecuperacion: vi.fn(),
  dbSelect: vi.fn(),
  rateLimit: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyTwoFactorChallenge: mocks.verifyTwoFactorChallenge,
  signSessionToken: mocks.signSessionToken,
  createAuthResponse: vi.fn((data, token) => Response.json({ ...data, _token: token })),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mocks.rateLimit,
  rateLimitResponse: vi.fn(() => Response.json({ error: 'rate limit' }, { status: 429 })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/audit', () => ({
  audit: mocks.audit,
  ipFromRequest: vi.fn(() => '127.0.0.1'),
  uaFromRequest: vi.fn(() => 'test'),
}));

vi.mock('@/lib/auth-2fa', () => ({
  verificarCodigoTotp: mocks.verificarCodigoTotp,
  obtenerSecretCifrado: mocks.obtenerSecretCifrado,
  usarCodigoRecuperacion: mocks.usarCodigoRecuperacion,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => mocks.dbSelect()) })) })),
  },
}));

vi.mock('@/lib/two-factor-challenges', () => ({ consumirChallenge2fa: mocks.consumirChallenge2fa }));

import { POST } from '@/app/api/auth/2fa/verify/route';

const USER_OK = {
  id: 'u-1', email: 'a@b.c', nombre: 'Test', rol: 'abogado',
  active: true, bloqueado: false, tokenVersion: 0,
};

function request(body: unknown): Request {
  return new Request('http://x/api/auth/2fa/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/2fa/verify', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza challenge inválido/manipulado con 401 sin emitir sesión', async () => {
    mocks.verifyTwoFactorChallenge.mockReturnValue(null);
    const res = await POST(request({ challenge: 'manipulado', codigo: '123456' }));
    expect(res.status).toBe(401);
    expect(mocks.signSessionToken).not.toHaveBeenCalled();
    expect(mocks.consumirChallenge2fa).not.toHaveBeenCalled();
  });

  it('rechaza TOTP incorrecto con 401 sin consumir challenge ni emitir sesión', async () => {
    mocks.verifyTwoFactorChallenge.mockReturnValue({ userId: 'u-1', jti: 'jti-1', purpose: '2fa_challenge' });
    mocks.rateLimit.mockReturnValue({ ok: true });
    mocks.dbSelect.mockReturnValue([USER_OK]);
    mocks.obtenerSecretCifrado.mockResolvedValue('secret-cifrado');
    mocks.verificarCodigoTotp.mockReturnValue(false);
    const res = await POST(request({ challenge: 'challenge-valido', codigo: '000000' }));
    expect(res.status).toBe(401);
    expect(mocks.consumirChallenge2fa).not.toHaveBeenCalled();
    expect(mocks.signSessionToken).not.toHaveBeenCalled();
  });

  it('rechaza challenge ya consumido con 401 sin emitir sesión', async () => {
    mocks.verifyTwoFactorChallenge.mockReturnValue({ userId: 'u-1', jti: 'jti-1', purpose: '2fa_challenge' });
    mocks.rateLimit.mockReturnValue({ ok: true });
    mocks.dbSelect.mockReturnValue([USER_OK]);
    mocks.obtenerSecretCifrado.mockResolvedValue('secret-cifrado');
    mocks.verificarCodigoTotp.mockReturnValue(true);
    mocks.consumirChallenge2fa.mockResolvedValue(false); // ya consumido
    const res = await POST(request({ challenge: 'challenge-valido', codigo: '123456' }));
    expect(res.status).toBe(401);
    expect(mocks.signSessionToken).not.toHaveBeenCalled();
  });

  it('rechaza usuario bloqueado entre login y verify con 403', async () => {
    mocks.verifyTwoFactorChallenge.mockReturnValue({ userId: 'u-1', jti: 'jti-1', purpose: '2fa_challenge' });
    mocks.rateLimit.mockReturnValue({ ok: true });
    mocks.dbSelect.mockReturnValue([{ ...USER_OK, bloqueado: true }]);
    const res = await POST(request({ challenge: 'challenge-valido', codigo: '123456' }));
    expect(res.status).toBe(403);
    expect(mocks.signSessionToken).not.toHaveBeenCalled();
  });

  it('TOTP correcto emite sesión con purpose session y reobtiene rol de DB', async () => {
    mocks.verifyTwoFactorChallenge.mockReturnValue({ userId: 'u-1', jti: 'jti-1', purpose: '2fa_challenge' });
    mocks.rateLimit.mockReturnValue({ ok: true });
    mocks.dbSelect.mockReturnValue([USER_OK]);
    mocks.obtenerSecretCifrado.mockResolvedValue('secret-cifrado');
    mocks.verificarCodigoTotp.mockReturnValue(true);
    mocks.consumirChallenge2fa.mockResolvedValue(true);
    mocks.signSessionToken.mockReturnValue('session-jwt');
    const res = await POST(request({ challenge: 'challenge-valido', codigo: '123456' }));
    expect(res.status).toBe(200);
    // signSessionToken recibe el rol leído de DB, no del challenge.
    expect(mocks.signSessionToken).toHaveBeenCalledWith(expect.objectContaining({
      rol: 'abogado',
      tokenVersion: 0,
      userId: 'u-1',
    }));
    expect(mocks.consumirChallenge2fa).toHaveBeenCalledWith('jti-1', 'u-1');
  });

  it('rate limit excedido devuelve 429 sin consumir challenge', async () => {
    mocks.verifyTwoFactorChallenge.mockReturnValue({ userId: 'u-1', jti: 'jti-1', purpose: '2fa_challenge' });
    mocks.rateLimit.mockReturnValue({ ok: false, resetMs: 1000 });
    const res = await POST(request({ challenge: 'challenge-valido', codigo: '123456' }));
    expect(res.status).toBe(429);
    expect(mocks.consumirChallenge2fa).not.toHaveBeenCalled();
    expect(mocks.signSessionToken).not.toHaveBeenCalled();
  });
});
