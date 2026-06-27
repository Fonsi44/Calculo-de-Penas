import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_BUILD_PHASE = process.env.NEXT_PHASE === 'phase-production-build';
const DEV_FALLBACK_SECRET = 'dev-only-secret-not-for-production-min-32-chars-AAAAA';

const WEAK_SECRET_PATTERNS: RegExp[] = [
  /change[-_]?in[-_]?production/i,
  /dev[-_]?only/i,
  /replace[-_]?with/i,
  /example/i,
  /placeholder/i,
  /lex[-_]?honduras[-_]?secret/i,
  /tu[-_]?secreto/i,
  /your[-_]?secret/i,
  /test1234/i,
];

let _secretValidated = false;
let _previousSecretValidated = false;

export function validateJwtSecret(secret: string | undefined, role: 'current' | 'previous'): void {
  if (!secret) return;
  if (secret.length < 32) {
    throw new Error(
      `JWT_SECRET${role === 'previous' ? '_PREVIOUS' : ''} debe tener al menos 32 caracteres (actual: ${secret.length}).`,
    );
  }
  if (IS_PROD && secret === DEV_FALLBACK_SECRET) {
    throw new Error('JWT_SECRET es el valor por defecto de desarrollo. No se permite en producción.');
  }
  for (const re of WEAK_SECRET_PATTERNS) {
    if (re.test(secret)) {
      const msg = `JWT_SECRET${role === 'previous' ? '_PREVIOUS' : ''} parece un placeholder o valor débil (coincide con patrón: ${re}). Genera uno nuevo con: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`;
      if (IS_PROD) throw new Error(msg);
      console.warn(`[auth] ADVERTENCIA: ${msg}`);
      return;
    }
  }
}

function ensureSecretValidated() {
  if (_secretValidated) return;
  _secretValidated = true;
  if (IS_BUILD_PHASE) return;
  try {
    validateJwtSecret(process.env.JWT_SECRET, 'current');
  } catch (e) {
    if (IS_PROD) throw e;
    console.warn(`[auth] ${(e as Error).message}`);
  }
}

function ensurePreviousSecretValidated() {
  if (_previousSecretValidated) return;
  _previousSecretValidated = true;
  if (IS_BUILD_PHASE) return;
  try {
    validateJwtSecret(process.env.JWT_SECRET_PREVIOUS, 'previous');
  } catch (e) {
    if (IS_PROD) throw e;
    console.warn(`[auth] ${(e as Error).message}`);
  }
}

const SALT_ROUNDS = 10;
const TOKEN_TTL_SECONDS = 60 * 60 * 24;

let _secret: string | null = null;
let _secretPrevious: string | null | undefined = undefined;

function getSecret(): string {
  ensureSecretValidated();
  if (_secret !== null) return _secret;
  const raw = process.env.JWT_SECRET;
  if (raw && raw.length >= 32) {
    _secret = raw;
    return _secret;
  }
  if (IS_PROD) {
    throw new Error('JWT_SECRET environment variable is required (>= 32 chars) in production');
  }
  _secret = DEV_FALLBACK_SECRET;
  return _secret;
}

function getSecretPrevious(): string | null {
  ensurePreviousSecretValidated();
  if (_secretPrevious !== undefined) return _secretPrevious;
  const raw = process.env.JWT_SECRET_PREVIOUS;
  if (raw && raw.length >= 32) {
    _secretPrevious = raw;
  } else {
    _secretPrevious = null;
  }
  return _secretPrevious;
}

export const COOKIE_NAME = IS_PROD ? '__Host-token' : 'token';
export const COOKIE_NAME_FALLBACK = 'token';

export const ALLOWED_EMAIL_DOMAIN = '@pinedayasociadoshn.com';

export const TEST_EMAIL_DOMAINS = ['@test.local', '@example.com'] as const;

export function isTestMode(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.ALLOW_TEST_EMAILS === 'true';
}

export function isAllowedAuthEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (isTestMode()) {
    if (TEST_EMAIL_DOMAINS.some((d) => normalized.endsWith(d))) return true;
  }
  return normalized.endsWith(ALLOWED_EMAIL_DOMAIN);
}

function cookieAttrs(): string {
  const parts = ['HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${TOKEN_TTL_SECONDS}`];
  if (IS_PROD) {
    parts.unshift('Secure');
  }
  return parts.join('; ');
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function signToken(payload: { userId: string; email: string; rol: string }): string {
  return jwt.sign(payload, getSecret(), { expiresIn: `${TOKEN_TTL_SECONDS}s` });
}

export function verifyToken(token: string): { userId: string; email: string; rol: string } | null {
  const secret = getSecret();
  try {
    return jwt.verify(token, secret) as { userId: string; email: string; rol: string };
  } catch {
    const previous = getSecretPrevious();
    if (previous) {
      try {
        return jwt.verify(token, previous) as { userId: string; email: string; rol: string };
      } catch {
        return null;
      }
    }
    return null;
  }
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const re = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const m = cookieHeader.match(re);
  return m ? m[1] : null;
}

export function getTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  const primary = readCookie(cookieHeader, COOKIE_NAME);
  if (primary) return primary;
  if (IS_PROD) {
    const fallback = readCookie(cookieHeader, COOKIE_NAME_FALLBACK);
    return fallback;
  }
  return null;
}

export type AuthUser = { userId: string; email: string; rol: string };

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function requireAuth(request: Request): AuthUser {
  const token = getTokenFromCookies(request);
  if (!token) throw new AuthError(401, 'No autorizado');
  const payload = verifyToken(token);
  if (!payload) throw new AuthError(401, 'Sesión inválida o expirada');
  return payload;
}

export function requireAdmin(request: Request): AuthUser {
  const user = requireAuth(request);
  if (user.rol !== 'admin') throw new AuthError(403, 'Requiere rol de administrador');
  return user;
}

/**
 * SGIE — requiere sesión con rol `abogado` o `admin`.
 *
 * El admin conserva acceso total al módulo SGIE (supervisión global),
 * por lo que ambos roles acceden. El scope fino por abogado (qué expedientes
 * ve un abogado) lo aplican las queries de `lib/sgie/expedientes-db.ts`,
 * no esta función. Referencia: pinedayasociados.md §6.1.
 *
 * NOTA: la verificación de bloqueo (revocación posterior al JWT) se hace en
 * `/api/auth/me` y en el login, no aquí, porque requiere leer la DB. Esta
 * función valida únicamente el JWT (stateless), coherente con `requireAdmin`.
 */
export function requireAbogado(request: Request): AuthUser {
  const user = requireAuth(request);
  if (user.rol !== 'abogado' && user.rol !== 'admin') {
    throw new AuthError(403, 'Requiere rol de abogado o administrador');
  }
  return user;
}

export function authFailureResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ error: 'No autorizado' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function createAuthResponse(data: unknown, token?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) {
    headers.append('Set-Cookie', `${COOKIE_NAME}=${token}; ${cookieAttrs()}`);
    if (IS_PROD) {
      headers.append('Set-Cookie', `${COOKIE_NAME_FALLBACK}=; Path=/; Max-Age=0; SameSite=Lax; Secure`);
    }
  }
  return new Response(JSON.stringify(data), { headers });
}

export function createLogoutResponse() {
  const clearPrimary = IS_PROD
    ? `${COOKIE_NAME}=; Path=/; Max-Age=0; Secure; SameSite=Lax`
    : `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  const clearFallback = `${COOKIE_NAME_FALLBACK}=; Path=/; Max-Age=0; SameSite=Lax${IS_PROD ? '; Secure' : ''}`;
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', clearPrimary);
  headers.append('Set-Cookie', clearFallback);
  return new Response(JSON.stringify({ message: 'Sesión cerrada' }), { headers });
}
