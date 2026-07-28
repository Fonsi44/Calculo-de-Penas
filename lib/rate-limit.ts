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

const SENSITIVE_PREFIXES = new Set([
  'login',
  'auth',
  'contacto',
  'consulta',
  'chat_ip',
  'chat_sess',
  '2fa',
]);

function shouldFailClosed(keyPrefix: string): boolean {
  return process.env.NODE_ENV === 'production' && SENSITIVE_PREFIXES.has(keyPrefix);
}

export async function rateLimit(identifier: string, opts: RateLimitOpts = {}): Promise<RateLimitResult> {
  // Bypass en tests E2E para no bloquear flujos que hacen múltiples logins.
  // Usamos globalThis para evitar constant-folding de process.env por el
  // bundler de Next.js/Turbopack, que inlinea las variables en build time.
  const g = globalThis as { __E2E_DISABLE_RATE_LIMIT?: boolean };
  if (g.__E2E_DISABLE_RATE_LIMIT === true || process.env.NEXT_PUBLIC_DISABLE_RATE_LIMIT === 'true') {
    return { ok: true, remaining: DEFAULTS.max, resetAt: Date.now() + DEFAULTS.windowMs, retryAfterSec: 0 };
  }

  const windowMs = opts.windowMs ?? DEFAULTS.windowMs;
  const max = opts.max ?? DEFAULTS.max;
  const keyPrefix = opts.keyPrefix ?? 'default';
  const now = new Date();
  const resetAt = now.getTime() + windowMs;

  try {
    const insertResult = await db.insert(rateLimits)
      .values({
        identifier,
        keyPrefix,
        count: 1,
        windowStart: now,
        expiresAt: new Date(resetAt),
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
    const dbResetAt = new Date(row.expiresAt).getTime();
    const remaining = Math.max(0, max - row.count);
    const ok = row.count <= max;

    return {
      ok,
      remaining,
      resetAt: dbResetAt,
      retryAfterSec: ok ? 0 : Math.ceil((dbResetAt - Date.now()) / 1000),
    };
  } catch (e) {
    if (shouldFailClosed(keyPrefix)) {
      console.error('[rate-limit] fail-closed: DB rate limit no disponible para ruta sensible:', keyPrefix);
      return {
        ok: false,
        remaining: 0,
        resetAt,
        retryAfterSec: Math.ceil(windowMs / 1000),
      };
    }

    console.warn('[rate-limit] fallback mode no-prod/no-sensible (DB rate limit no disponible):', (e as Error).message);
    return { ok: true, remaining: max, resetAt, retryAfterSec: 0 };
  }
}

export function rateLimitResponse(res: RateLimitResult): Response {
  return Response.json(
    { error: 'Demasiadas solicitudes. Intente de nuevo más tarde.' },
    {
      status: 429,
      headers: {
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
