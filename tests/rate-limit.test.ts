import { describe, it, expect, beforeEach } from 'vitest';
import {
  rateLimit,
  rateLimitResponse,
  getClientIp,
  clearAllBuckets,
  type RateLimitResult,
} from '../lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    clearAllBuckets();
  });

  it('primera llamada dentro de max devuelve ok=true con remaining=max-1', () => {
    const r = rateLimit('1.2.3.4', { windowMs: 60_000, max: 5 });
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(4);
    expect(r.retryAfterSec).toBe(0);
  });

  it('5 llamadas consecutivas devuelven ok=true con remaining descendente (max-1, max-2, max-3, max-4, max-5)', () => {
    const ip = '5.6.7.8';
    const expectedRemaining = [4, 3, 2, 1, 0];
    for (let i = 0; i < 5; i++) {
      const r = rateLimit(ip, { windowMs: 60_000, max: 5 });
      expect(r.ok).toBe(true);
      expect(r.remaining).toBe(expectedRemaining[i]);
    }
  });

  it('sexta llamada excede max y devuelve ok=false con retryAfterSec>0', () => {
    const ip = '9.10.11.12';
    for (let i = 0; i < 5; i++) rateLimit(ip, { windowMs: 60_000, max: 5 });
    const r = rateLimit(ip, { windowMs: 60_000, max: 5 });
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSec).toBeGreaterThan(0);
    expect(r.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it('identificadores distintos tienen buckets independientes', () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit('ip-A', { max: 5, windowMs: 60_000 }).ok).toBe(true);
    }
    expect(rateLimit('ip-A', { max: 5, windowMs: 60_000 }).ok).toBe(false);
    expect(rateLimit('ip-B', { max: 5, windowMs: 60_000 }).ok).toBe(true);
  });

  it('diferentes keyPrefix aíslan buckets del mismo identificador', () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit('user-1', { keyPrefix: 'login', max: 3, windowMs: 60_000 }).ok).toBe(true);
    }
    expect(rateLimit('user-1', { keyPrefix: 'login', max: 3, windowMs: 60_000 }).ok).toBe(false);
    expect(rateLimit('user-1', { keyPrefix: 'calcular', max: 3, windowMs: 60_000 }).ok).toBe(true);
  });

  it('reset del bucket tras pasar windowMs', () => {
    const r1 = rateLimit('reset-ip', { max: 2, windowMs: 50 });
    expect(r1.ok).toBe(true);
    expect(rateLimit('reset-ip', { max: 2, windowMs: 50 }).ok).toBe(true);
    expect(rateLimit('reset-ip', { max: 2, windowMs: 50 }).ok).toBe(false);
  });

  it('usa defaults cuando no se pasan opts (windowMs=60_000, max=5)', () => {
    const r = rateLimit('default-ip');
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(4);
    expect(r.resetAt - Date.now()).toBeGreaterThan(59_000);
  });

  it('resetAt siempre está en el futuro dentro de la ventana', () => {
    const r = rateLimit('future-ip', { windowMs: 30_000, max: 10 });
    expect(r.resetAt).toBeGreaterThan(Date.now());
    expect(r.resetAt - Date.now()).toBeLessThanOrEqual(30_000);
  });
});

describe('rateLimitResponse', () => {
  it('devuelve status 429 con body de error y headers correctos', () => {
    const res: RateLimitResult = {
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
      retryAfterSec: 30,
    };
    const r = rateLimitResponse(res);
    expect(r.status).toBe(429);
    expect(r.headers.get('Content-Type')).toBe('application/json');
    expect(r.headers.get('Retry-After')).toBe('30');
    expect(r.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(r.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(r.headers.get('X-RateLimit-Reset')).toMatch(/^\d+$/);
  });

  it('cuerpo JSON contiene mensaje de error entendible', async () => {
    const res: RateLimitResult = {
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 10_000,
      retryAfterSec: 10,
    };
    const r = rateLimitResponse(res);
    const body = await r.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});

describe('getClientIp', () => {
  it('extrae la primera IP de x-forwarded-for (puede haber varias separadas por coma)', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1, 10.0.0.2' },
    });
    expect(getClientIp(req)).toBe('203.0.113.5');
  });

  it('extrae IP única de x-forwarded-for', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '198.51.100.7' },
    });
    expect(getClientIp(req)).toBe('198.51.100.7');
  });

  it('usa x-real-ip si no hay x-forwarded-for', () => {
    const req = new Request('http://x', {
      headers: { 'x-real-ip': '203.0.113.99' },
    });
    expect(getClientIp(req)).toBe('203.0.113.99');
  });

  it('devuelve "unknown" si no hay headers de IP', () => {
    const req = new Request('http://x');
    expect(getClientIp(req)).toBe('unknown');
  });

  it('x-forwarded-for tiene prioridad sobre x-real-ip', () => {
    const req = new Request('http://x', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      },
    });
    expect(getClientIp(req)).toBe('1.1.1.1');
  });

  it('hace trim de espacios en x-forwarded-for', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '  10.0.0.5  , 10.0.0.6' },
    });
    expect(getClientIp(req)).toBe('10.0.0.5');
  });
});
