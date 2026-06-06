import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('lib/auth lazy-load', () => {
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

  it('importar el módulo NO lanza aunque JWT_SECRET no exista', async () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SECRET_PREVIOUS;
    process.env.NODE_ENV = 'production';
    await expect(loadAuth()).resolves.toBeDefined();
  });

  it('signToken lanza en runtime si JWT_SECRET falta en producción', async () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    const auth = await loadAuth();
    expect(() => auth.signToken({ userId: 'u1', email: 'u@x.com', rol: 'user' }))
      .toThrow(/JWT_SECRET.*environment variable is required/);
  });

  it('verifyToken lanza en runtime si JWT_SECRET falta en producción', async () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    const auth = await loadAuth();
    expect(() => auth.verifyToken('a.b.c')).toThrow(/JWT_SECRET/);
  });

  it('signToken acepta JWT_SECRET válido en runtime sin re-lanzar al importar', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = STRONG;
    const auth = await loadAuth();
    expect(() => auth.signToken({ userId: 'u1', email: 'u@x.com', rol: 'user' })).not.toThrow();
  });
});
