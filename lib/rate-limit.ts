import { db } from './db';
import { rateLimits } from './schema';
import { sql } from 'drizzle-orm';

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

const DEFAULTS = {
  windowMs: 60_000,
  max: 5,
};

export async function rateLimit(identifier: string, opts: RateLimitOpts = {}): Promise<RateLimitResult> {
  const windowMs = opts.windowMs ?? DEFAULTS.windowMs;
  const max = opts.max ?? DEFAULTS.max;
  const keyPrefix = opts.keyPrefix ?? 'default';
  const now = new Date();

  const insertResult = await db.insert(rateLimits)
    .values({
      identifier,
      keyPrefix,
      count: 1,
      windowStart: now,
      expiresAt: new Date(now.getTime() + windowMs),
    })
    .onConflictDoUpdate({
      target: [rateLimits.identifier, rateLimits.keyPrefix],
      set: {
        count: sql`CASE WHEN ${rateLimits.expiresAt} < NOW() THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimits.expiresAt} < NOW() THEN NOW() ELSE ${rateLimits.windowStart} END`,
        expiresAt: sql`CASE WHEN ${rateLimits.expiresAt} < NOW() THEN NOW() + make_interval(secs => ${windowMs / 1000}) ELSE ${rateLimits.expiresAt} END`,
      },
    })
    .returning({ count: rateLimits.count, expiresAt: rateLimits.expiresAt });

  const row = insertResult[0];
  const resetAt = new Date(row.expiresAt).getTime();
  const remaining = Math.max(0, max - row.count);
  const ok = row.count <= max;

  return {
    ok,
    remaining,
    resetAt,
    retryAfterSec: ok ? 0 : Math.ceil((resetAt - Date.now()) / 1000),
  };
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
