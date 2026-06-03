type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const DEFAULTS = {
  windowMs: 60_000,
  max: 5,
};

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

export interface RateLimitOpts {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

export function rateLimit(identifier: string, opts: RateLimitOpts = {}): RateLimitResult {
  const windowMs = opts.windowMs ?? DEFAULTS.windowMs;
  const max = opts.max ?? DEFAULTS.max;
  const key = `${opts.keyPrefix ?? 'default'}::${identifier}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: max - 1, resetAt, retryAfterSec: 0 };
  }

  if (existing.count >= max) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: max - existing.count, resetAt: existing.resetAt, retryAfterSec: 0 };
}

export function rateLimitResponse(res: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: 'Demasiadas solicitudes. Intente de nuevo más tarde.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(res.retryAfterSec),
        'X-RateLimit-Limit': String(res.remaining + 1),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(res.resetAt / 1000)),
      },
    },
  );
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export function clearAllBuckets(): void {
  buckets.clear();
}
