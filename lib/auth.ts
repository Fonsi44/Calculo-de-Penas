import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required (>= 32 chars) in production');
  }
}
const SECRET: string = JWT_SECRET || 'dev-only-secret-not-for-production-min-32-chars-AAAAA';
const SALT_ROUNDS = 10;
const TOKEN_TTL_SECONDS = 60 * 60 * 24;
const IS_PROD = process.env.NODE_ENV === 'production';

export const COOKIE_NAME = IS_PROD ? '__Host-token' : 'token';
export const COOKIE_NAME_FALLBACK = 'token';

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
  return jwt.sign(payload, SECRET, { expiresIn: `${TOKEN_TTL_SECONDS}s` });
}

export function verifyToken(token: string): { userId: string; email: string; rol: string } | null {
  try {
    return jwt.verify(token, SECRET) as { userId: string; email: string; rol: string };
  } catch {
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

export function createAuthResponse(data: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Set-Cookie'] = `${COOKIE_NAME}=${token}; ${cookieAttrs()}`;
    if (IS_PROD) {
      headers['Set-Cookie'] += `, ${COOKIE_NAME_FALLBACK}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
    }
  }
  return new Response(JSON.stringify(data), { headers });
}

export function createLogoutResponse() {
  const clearPrimary = IS_PROD
    ? `${COOKIE_NAME}=; Path=/; Max-Age=0; Secure; SameSite=Lax`
    : `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  const clearFallback = `${COOKIE_NAME_FALLBACK}=; Path=/; Max-Age=0; SameSite=Lax${IS_PROD ? '; Secure' : ''}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Set-Cookie': [clearPrimary, clearFallback].join(', '),
  };
  return new Response(JSON.stringify({ message: 'Sesión cerrada' }), { headers });
}
