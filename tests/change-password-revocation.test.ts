/**
 * AUD-SEC-003 / SUBFASE 5 — Rotación de contraseña invalida sesiones anteriores.
 *
 * Demuestra que `requireAuth` (y por extensión proxy/require*) rechaza un JWT
 * cuyo `tokenVersion` ya no coincide con el de la DB, usando el helper
 * `validateSessionFreshness` introducido en la Subfase A.
 *
 * Flujo: se emite un token con tokenVersion=0; el cambio de contraseña eleva
 * tokenVersion a 1 en DB; el token previo (tokenVersion=0) debe ser rechazado.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  // Consulta de frescura que devuelve el estado actual de la DB.
  freshnessSelect: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => mocks.freshnessSelect()),
      })),
    })),
  },
}));

import {
  signSessionToken,
  requireAuth,
  validateSessionFreshness,
  invalidateFreshness,
  __setFreshnessForTest,
  COOKIE_NAME,
  AuthError,
} from '@/lib/auth';

const USER_ID = 'u-rev-1';

function authedRequest(tokenVersion: number): Request {
  const token = signSessionToken({
    userId: USER_ID, email: 'a@b.c', rol: 'abogado', tokenVersion,
  });
  return new Request('http://x', { headers: { cookie: `${COOKIE_NAME}=${token}` } });
}

describe('Rotación de contraseña invalida sesiones (token_version)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateFreshness();
    // Forzar el camino de DB real (sin el bypass de test) para estos tests.
    process.env.AUTH_FRESHNESS_DB_ENABLED = '1';
  });

  afterEach(() => {
    delete process.env.AUTH_FRESHNESS_DB_ENABLED;
  });

  it('token válido con tokenVersion coincidente es aceptado', async () => {
    mocks.freshnessSelect.mockReturnValue([
      { tokenVersion: 0, active: true, bloqueado: false },
    ]);
    const u = await requireAuth(authedRequest(0));
    expect(u.userId).toBe(USER_ID);
  });

  it('token previo (tokenVersion 0) rechazado tras cambio de contraseña (DB en 1)', async () => {
    // El cambio de contraseña elevó tokenVersion a 1; el token del atacante sigue en 0.
    mocks.freshnessSelect.mockReturnValue([
      { tokenVersion: 1, active: true, bloqueado: false },
    ]);
    await expect(requireAuth(authedRequest(0))).rejects.toThrow(AuthError);
  });

  it('usuario bloqueado tras emitir el token → sesión revocada', async () => {
    mocks.freshnessSelect.mockReturnValue([
      { tokenVersion: 0, active: true, bloqueado: true },
    ]);
    await expect(requireAuth(authedRequest(0))).rejects.toThrow(AuthError);
  });

  it('usuario desactivado tras emitir el token → sesión revocada', async () => {
    mocks.freshnessSelect.mockReturnValue([
      { tokenVersion: 0, active: false, bloqueado: false },
    ]);
    await expect(requireAuth(authedRequest(0))).rejects.toThrow(AuthError);
  });

  it('caché de frescura: tras invalidar, la próxima lectura usa DB', async () => {
    mocks.freshnessSelect.mockReturnValue([
      { tokenVersion: 0, active: true, bloqueado: false },
    ]);
    await validateSessionFreshness(USER_ID, 0); // llena caché ok=true
    invalidateFreshness(USER_ID); // simula cambio de contraseña
    mocks.freshnessSelect.mockClear();
    mocks.freshnessSelect.mockReturnValue([
      { tokenVersion: 1, active: true, bloqueado: false }, // versión nueva
    ]);
    await expect(validateSessionFreshness(USER_ID, 0)).rejects.toThrow(AuthError);
    expect(mocks.freshnessSelect).toHaveBeenCalledTimes(1); // consultó DB tras invalidar
  });

  it('fail-closed en producción ante error de DB', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.freshnessSelect.mockImplementation(() => { throw new Error('DB down'); });
    invalidateFreshness(USER_ID);
    try {
      await expect(validateSessionFreshness(USER_ID, 0)).rejects.toThrow(/verificar la sesión/);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
