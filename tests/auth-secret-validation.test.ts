import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('validateJwtSecret', () => {
  const ORIGINAL_ENV = process.env;
  const STRONG = 'a'.repeat(48) + 'X7q9Zk-realistic-random-base64url-strong';

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  function loadAuth() {
    return import('@/lib/auth');
  }

  it('lanza en producción si el secreto es < 32 chars al firmar', async () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    process.env.JWT_SECRET = 'short';
    const auth = await loadAuth();
    expect(() => auth.signToken({ userId: 'u1', email: 'u@x.com', rol: 'user' }))
      .toThrow(/al menos 32 caracteres/);
  });

  it('lanza en producción si el secreto es el fallback de desarrollo', async () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    process.env.JWT_SECRET = 'dev-only-secret-not-for-production-min-32-chars-AAAAA';
    const auth = await loadAuth();
    expect(() => auth.signToken({ userId: 'u1', email: 'u@x.com', rol: 'user' }))
      .toThrow(/valor por defecto de desarrollo/);
  });

  it('lanza en producción si el secreto coincide con un patrón débil', async () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    process.env.JWT_SECRET = 'change-in-production-please-use-48-random-bytes-XYZ';
    const auth = await loadAuth();
    expect(() => auth.signToken({ userId: 'u1', email: 'u@x.com', rol: 'user' }))
      .toThrow(/placeholder|débil/);
  });

  it('NO lanza en desarrollo aunque el secreto sea débil (solo warning)', async () => {
    Object.assign(process.env, { NODE_ENV: 'development' });
    process.env.JWT_SECRET = 'change-in-production-please-use-48-random-bytes-XYZ';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const auth = await loadAuth();
    expect(() => auth.signToken({ userId: 'u1', email: 'u@x.com', rol: 'user' })).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/ADVERTENCIA.*placeholder|débil/));
    warn.mockRestore();
  });

  it('NO lanza si el secreto es fuerte (>= 48 chars random)', async () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    process.env.JWT_SECRET = STRONG;
    const auth = await loadAuth();
    expect(() => auth.signToken({ userId: 'u1', email: 'u@x.com', rol: 'user' })).not.toThrow();
  });

  it('valida también JWT_SECRET_PREVIOUS al verificar', async () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    process.env.JWT_SECRET = STRONG;
    process.env.JWT_SECRET_PREVIOUS = 'short';
    const auth = await loadAuth();
    expect(() => auth.verifyToken('any.token.here'))
      .toThrow(/PREVIOUS.*al menos 32 caracteres/);
  });

  it('rechaza "lex-honduras-secret-change-in-production-2026" (patrones múltiples)', async () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    process.env.JWT_SECRET = 'lex-honduras-secret-change-in-production-2026-pad-pad-pad-pad';
    const auth = await loadAuth();
    expect(() => auth.signToken({ userId: 'u1', email: 'u@x.com', rol: 'user' }))
      .toThrow();
  });
});
