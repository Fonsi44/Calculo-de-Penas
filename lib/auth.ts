import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function signToken(payload: { userId: string; email: string; rol: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; email: string; rol: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; rol: string };
  } catch {
    return null;
  }
}

export function getTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

export function createAuthResponse(data: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Set-Cookie'] = `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`;
  }
  return new Response(JSON.stringify(data), { headers });
}

export function createLogoutResponse() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Set-Cookie': 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
  };
  return new Response(JSON.stringify({ message: 'Sesión cerrada' }), { headers });
}
