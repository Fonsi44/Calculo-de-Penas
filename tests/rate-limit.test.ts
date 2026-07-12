import { describe, it, expect, vi, beforeEach } from 'vitest';

const returningMock = vi.fn();
const onConflictDoUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictDoUpdateMock });
const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

vi.mock('../lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
  },
}));

import {
  rateLimit,
  rateLimitResponse,
  getClientIp,
  type RateLimitResult,
} from '../lib/rate-limit';

describe('rateLimit', () => {
  const env = process.env as Record<string, string | undefined>;

  beforeEach(() => {
    insertMock.mockClear();
    valuesMock.mockClear();
    onConflictDoUpdateMock.mockClear();
    returningMock.mockClear();
    env.NODE_ENV = 'test';
  });

  function mockReturn(count: number, expiresAt?: Date) {
    returningMock.mockResolvedValue([{
      count,
      expiresAt: (expiresAt ?? new Date(Date.now() + 60_000)).toISOString(),
    }]);
  }

  it('primera llamada devuelve ok=true con remaining=max-1', async () => {
    mockReturn(1);
    const r = await rateLimit('1.2.3.4', { windowMs: 60_000, max: 5 });
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(4);
    expect(r.retryAfterSec).toBe(0);
  });

  it('count=5 (dentro de max) devuelve ok=true', async () => {
    mockReturn(5);
    const r = await rateLimit('ip', { windowMs: 60_000, max: 5 });
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(0);
  });

  it('count > max devuelve ok=false con retryAfterSec>0', async () => {
    mockReturn(6, new Date(Date.now() + 30_000));
    const r = await rateLimit('exceeded-ip', { windowMs: 60_000, max: 5 });
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSec).toBeGreaterThan(0);
    expect(r.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it('usa defaults cuando no se pasan opts (windowMs=60_000, max=5)', async () => {
    mockReturn(1);
    const r = await rateLimit('default-ip');
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(4);
  });

  it('resetAt está en el futuro', async () => {
    const future = new Date(Date.now() + 30_000);
    mockReturn(1, future);
    const r = await rateLimit('future-ip', { windowMs: 30_000, max: 10 });
    expect(r.resetAt).toBeGreaterThan(Date.now());
    expect(r.resetAt - Date.now()).toBeLessThanOrEqual(30_000);
  });

  it('identificadores distintos tienen buckets independientes', async () => {
    mockReturn(4);
    const a = await rateLimit('ip-A', { max: 5, windowMs: 60_000 });
    expect(a.ok).toBe(true);

    mockReturn(5);
    const b = await rateLimit('ip-A', { max: 5, windowMs: 60_000 });
    expect(b.ok).toBe(true);

    mockReturn(1);
    const c = await rateLimit('ip-B', { max: 5, windowMs: 60_000 });
    expect(c.ok).toBe(true);
  });

  it('diferentes keyPrefix aíslan buckets del mismo identificador', async () => {
    mockReturn(3);
    const a = await rateLimit('user-1', { keyPrefix: 'login', max: 3, windowMs: 60_000 });
    expect(a.ok).toBe(true);

    mockReturn(1);
    const b = await rateLimit('user-1', { keyPrefix: 'calcular', max: 3, windowMs: 60_000 });
    expect(b.ok).toBe(true);
  });

  it('en producción falla cerrado si DB falla en prefijo sensible', async () => {
    env.NODE_ENV = 'production';
    insertMock.mockImplementationOnce(() => {
      throw new Error('db down');
    });

    const r = await rateLimit('ip-login', { keyPrefix: 'login', max: 5, windowMs: 60_000 });

    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSec).toBe(60);
  });

  it('en producción falla cerrado si DB falla durante 2FA', async () => {
    env.NODE_ENV = 'production';
    insertMock.mockImplementationOnce(() => { throw new Error('db down'); });
    const r = await rateLimit('user:ip', { keyPrefix: '2fa', max: 10, windowMs: 60_000 });
    expect(r.ok).toBe(false);
  });

  it('en test mantiene fallback abierto si DB falla', async () => {
    insertMock.mockImplementationOnce(() => {
      throw new Error('db down');
    });

    const r = await rateLimit('ip-test', { keyPrefix: 'login', max: 5, windowMs: 60_000 });

    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(5);
  });
});

describe('rateLimitResponse', () => {
  it('devuelve status 429 con headers correctos', () => {
    const res: RateLimitResult = {
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
      retryAfterSec: 30,
    };
    const r = rateLimitResponse(res);
    expect(r.status).toBe(429);
    expect(r.headers.get('Retry-After')).toBe('30');
    expect(r.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('cuerpo JSON contiene mensaje de error', async () => {
    const res: RateLimitResult = {
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 10_000,
      retryAfterSec: 10,
    };
    const r = rateLimitResponse(res);
    const body = await r.json();
    expect(body).toHaveProperty('error');
  });
});

describe('getClientIp', () => {
  it('extrae la primera IP de x-forwarded-for', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
    });
    expect(getClientIp(req)).toBe('203.0.113.5');
  });

  it('usa x-real-ip si no hay x-forwarded-for', () => {
    const req = new Request('http://x', {
      headers: { 'x-real-ip': '203.0.113.99' },
    });
    expect(getClientIp(req)).toBe('203.0.113.99');
  });

  it('devuelve "unknown" sin headers de IP', () => {
    const req = new Request('http://x');
    expect(getClientIp(req)).toBe('unknown');
  });
});
