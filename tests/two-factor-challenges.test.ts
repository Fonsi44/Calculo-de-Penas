import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  return { returning, where, set, update };
});

vi.mock('@/lib/db', () => ({ db: { update: mocks.update } }));
vi.mock('@/lib/schema', () => ({
  twoFactorChallenges: { jti: 'jti', usuarioId: 'usuario_id', consumedAt: 'consumed_at', expiresAt: 'expires_at' },
}));

import { consumirChallenge2fa } from '@/lib/two-factor-challenges';

describe('two-factor challenges', () => {
  beforeEach(() => vi.clearAllMocks());

  it('solo acepta el primer consumo atómico', async () => {
    mocks.returning.mockResolvedValueOnce([{ jti: 'one' }]).mockResolvedValueOnce([]);
    await expect(consumirChallenge2fa('one', 'user-1')).resolves.toBe(true);
    await expect(consumirChallenge2fa('one', 'user-1')).resolves.toBe(false);
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });
});
