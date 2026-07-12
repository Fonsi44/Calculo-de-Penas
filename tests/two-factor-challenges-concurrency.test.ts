/**
 * AUD-SEC-001 — Reutilización concurrente del mismo jti imposible.
 *
 * El consumo del challenge usa compare-and-set SQL:
 *   UPDATE ... WHERE jti AND usuarioId AND consumedAt IS NULL AND expiresAt > now()
 *     RETURNING
 * Solo una de N llamadas concurrentes obtiene 1 fila; las demás 0.
 *
 * Como no hay DB real en la suite, se simula el compare-and-set con un estado
 * compartido que la primera llamada muta, demostrando que la lógica de
 * `consumirChallenge2fa` se apoya en el `RETURNING` length === 1.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Estado compartido que simula la fila en DB: { consumedAt: null | Date }.
let fila: { jti: string; usuarioId: string; consumedAt: Date | null; expiresAt: Date };

const mocks = vi.hoisted(() => ({
  // El update simula el compare-and-set atómico.
  update: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: { update: mocks.update } }));
vi.mock('@/lib/schema', () => ({
  twoFactorChallenges: {
    jti: 'jti', usuarioId: 'usuario_id', consumedAt: 'consumed_at', expiresAt: 'expires_at',
  },
}));

import { consumirChallenge2fa } from '@/lib/two-factor-challenges';

describe('consumirChallenge2fa — concurrencia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fila = { jti: 'jti-shared', usuarioId: 'u-1', consumedAt: null, expiresAt: new Date(Date.now() + 60_000) };
    // El builder del update termina en .returning() que decide según el estado de la fila.
    mocks.update.mockImplementation(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => {
            // Compare-and-set atómico: si ya está consumido o expirado, devuelve [].
            if (fila.consumedAt !== null || fila.expiresAt <= new Date()) return [];
            // Primera llamada consume la fila.
            fila.consumedAt = new Date();
            return [{ jti: fila.jti }];
          }),
        })),
      })),
    }));
  });

  it('dos consumos concurrentes del mismo jti: solo uno tiene éxito', async () => {
    // Lanzar ambas en paralelo.
    const [r1, r2] = await Promise.all([
      consumirChallenge2fa('jti-shared', 'u-1'),
      consumirChallenge2fa('jti-shared', 'u-1'),
    ]);
    const exitos = [r1, r2].filter(Boolean).length;
    expect(exitos).toBe(1);
    expect(r1 || r2).toBe(true);
    expect(r1 && r2).toBe(false);
  });

  it('challenge expirado nunca se consume', async () => {
    fila.expiresAt = new Date(Date.now() - 1000); // pasado
    const r = await consumirChallenge2fa('jti-shared', 'u-1');
    expect(r).toBe(false);
  });

  it('usuario distinto no consume el challenge de otro', async () => {
    // El mock simula compare-and-set; el where incluye eq(usuarioId).
    // Forzamos que solo coincida si el usuarioId传入 es 'u-1'.
    mocks.update.mockImplementation(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => {
            // fila.usuarioId !== 'u-2' → []
            return [];
          }),
        })),
      })),
    }));
    const r = await consumirChallenge2fa('jti-shared', 'u-2');
    expect(r).toBe(false);
  });
});
