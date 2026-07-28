import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { assertCapability, assertSgieAccess, defaultCapabilitiesForRole } from '@/lib/access-service';
import { HttpError, httpErrorResponse } from '@/lib/http-errors';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_TEST = process.env.NODE_ENV === 'test';
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

// OWASP recomienda rounds ≥ 12 (2026). bcryptjs es monótono: hashes generados
// con rounds anteriores siguen verificando, así que el rehash progresivo en
// login (`maybeRehashPassword`) eleva el coste de los hashes legacy sin romper
// sesiones existentes. Subir este valor impacta latencia de login (~250ms/round).
const SALT_ROUNDS = 12;
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

/**
 * En producción real la cookie se llama `__Host-token` (requiere Secure + HTTPS).
 * En staging local sobre HTTP se usa `token` simple porque las cookies __Host-
 * requieren HTTPS y el navegador las rechazaría.
 *
 * La decisión depende del runtime global `__E2E_LOCAL_HTTP`, seteado por
 * `instrumentation.ts` SOLO después de validar que:
 *   - E2E_ENVIRONMENT=staging
 *   - VERCEL_ENV no es production
 *   - VERCEL_ENV no es preview
 *   - E2E_LOCAL_HTTP=true
 *
 * Si el runtime global no está activo (por defecto), production usa
 * `__Host-token` aunque las variables de entorno estén presentes accident-
 * almente. Esto evita que un error de configuración degrade la cookie.
 *
 * En desarrollo y test (NODE_ENV != production) siempre se usa `token`
 * (HTTP local, sin Secure).
 */
function isRuntimeE2ELocalHttpMode(): boolean {
  const g = globalThis as { __E2E_LOCAL_HTTP?: boolean };
  return g.__E2E_LOCAL_HTTP === true;
}

function shouldUseHostCookie(): boolean {
  // Desarrollo y test local: cookie simple sobre HTTP.
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }
  // Producción real o Preview: cookie segura a menos que instrumentation
  // haya validado explícitamente el modo E2E local.
  return !isRuntimeE2ELocalHttpMode();
}

export function getCookieName(): string {
  return shouldUseHostCookie() ? '__Host-token' : 'token';
}

export const COOKIE_NAME = '__Host-token';
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
  // En producción real se requiere Secure. En staging local sobre HTTP
  // (E2E_LOCAL_HTTP) no se añade Secure porque el navegador lo rechazaría.
  if (shouldUseHostCookie()) {
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

/**
 * Rehash progresivo: si un hash existente se generó con menos `rounds` que
 * `SALT_ROUNDS` (p.ej. hashes rounds=10 previos al bump), se re-hashea tras
 * un login exitoso. Recibe un callback de persistencia para desacoplar de la
 * capa DB y poder testearlo sin Drizzle.
 *
 * Es no-bloqueante: un fallo de DB al actualizar no impide el login (sólo
 * loggea). Idempotente: si los rounds ya son ≥ SALT_ROUNDS, no hace nada.
 */
export async function maybeRehashPassword(
  password: string,
  hash: string,
  persist: (newHash: string) => Promise<void>,
): Promise<void> {
  try {
    const rounds = bcryptjs.getRounds(hash);
    if (!Number.isFinite(rounds) || rounds >= SALT_ROUNDS) return;
    const newHash = await bcryptjs.hash(password, SALT_ROUNDS);
    await persist(newHash);
  } catch (e) {
    console.warn('[auth] rehash progresivo falló (no bloqueante):', (e as Error).message);
  }
}

export type SessionTokenPayload = {
  purpose: 'session';
  userId: string;
  email: string;
  rol: string;
  tokenVersion: number;
};

export type TwoFactorChallengePayload = {
  purpose: '2fa_challenge';
  userId: string;
  jti: string;
};

export function signSessionToken(payload: Omit<SessionTokenPayload, 'purpose'>): string {
  return jwt.sign({ ...payload, purpose: 'session' satisfies SessionTokenPayload['purpose'] }, getSecret(), {
    expiresIn: `${TOKEN_TTL_SECONDS}s`,
  });
}

/** Alias explícito de compatibilidad para consumidores internos; siempre emite sesión. */
export function signToken(payload: { userId: string; email: string; rol: string; tokenVersion?: number }): string {
  return signSessionToken({ ...payload, tokenVersion: payload.tokenVersion ?? 0 });
}

export function signTwoFactorChallenge(payload: Omit<TwoFactorChallengePayload, 'purpose'>): string {
  return jwt.sign({ ...payload, purpose: '2fa_challenge' satisfies TwoFactorChallengePayload['purpose'] }, getSecret(), {
    expiresIn: '5m',
  });
}

function verifyWithCurrentOrPrevious(token: string): jwt.JwtPayload | null {
  const secret = getSecret();
  try {
    return jwt.verify(token, secret) as jwt.JwtPayload;
  } catch {
    const previous = getSecretPrevious();
    if (previous) {
      try {
        return jwt.verify(token, previous) as jwt.JwtPayload;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  const payload = verifyWithCurrentOrPrevious(token);
  if (!payload || payload.purpose !== 'session'
    || typeof payload.userId !== 'string' || typeof payload.email !== 'string'
    || typeof payload.rol !== 'string' || !Number.isInteger(payload.tokenVersion)) return null;
  return payload as SessionTokenPayload;
}

export function verifyTwoFactorChallenge(token: string): TwoFactorChallengePayload | null {
  const payload = verifyWithCurrentOrPrevious(token);
  if (!payload || payload.purpose !== '2fa_challenge'
    || typeof payload.userId !== 'string' || typeof payload.jti !== 'string') return null;
  return payload as TwoFactorChallengePayload;
}

/** Compatibilidad segura: verifyToken solo verifica sesiones, nunca challenges. */
export const verifyToken = verifySessionToken;

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const re = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const m = cookieHeader.match(re);
  return m ? m[1] : null;
}

export function getTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  // Probar el nombre canónico y el fallback. En staging local (E2E_LOCAL_HTTP)
  // la cookie se setea como 'token'; en producción como '__Host-token'.
  const primary = readCookie(cookieHeader, COOKIE_NAME) ?? readCookie(cookieHeader, COOKIE_NAME_FALLBACK);
  if (primary) return primary;
  return null;
}

export type AuthUser = { userId: string; email: string; rol: string; tokenVersion: number };

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Revocación de sesión efectiva (SUBFASE 5).
 *
 * El JWT es stateless, pero un cambio de contraseña o un bloqueo administrativo
 * deben invalidar sesiones activas cuanto antes, no solo cuando el cliente
 * consulte `/api/auth/me`. Este helper valida que el `tokenVersion` del JWT
 * coincida con el de la DB y que el usuario siga `active` y no `bloqueado`.
 *
 * Para no añadir un round-trip a DB en cada request, se cachea el resultado por
 * usuario durante `FRESHNESS_TTL_MS` (5 s). El TTL es deliberadamente corto: la
 * revocación puede tardar hasta este tiempo en propagarse, aceptable frente al
 * coste de consultar la DB en cada handler protegido.
 *
 * Fail-closed en producción: si la DB falla, se rechaza la sesión. En test/dev
 * falla abierto (sin DB real) salvo que el test inyecte un mock.
 */
const FRESHNESS_TTL_MS = 5_000;
const freshnessCache = new Map<string, { expiresAt: number; ok: boolean }>();

/** Inyecta/reescribe el resultado de frescura para un usuario (uso en tests). */
export function __setFreshnessForTest(userId: string, ok: boolean, ttlMs = FRESHNESS_TTL_MS): void {
  freshnessCache.set(userId, { expiresAt: Date.now() + ttlMs, ok });
}

/** Limpia la caché de frescura (uso en tests y tras mutaciones críticas). */
export function invalidateFreshness(userId?: string): void {
  if (userId) freshnessCache.delete(userId);
  else freshnessCache.clear();
}

export async function validateSessionFreshness(userId: string, tokenVersion: number): Promise<void> {
  // Bypass durante el build de Next.js (no hay runtime de DB) y rutas públicas
  // que no deberían llegar aquí pero defensivamente no bloqueamos.
  if (IS_BUILD_PHASE) return;

  const cached = freshnessCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    if (!cached.ok) throw new AuthError(401, 'Sesión revocada');
    return;
  }

  // En tests sin DB real, confiamos en el token salvo mock explícito.
  if (IS_TEST && !process.env.AUTH_FRESHNESS_DB_ENABLED) {
    freshnessCache.set(userId, { expiresAt: Date.now() + FRESHNESS_TTL_MS, ok: true });
    return;
  }

  let ok = false;
  try {
    const [user] = await db.select({
      tokenVersion: usuarios.tokenVersion,
      active: usuarios.active,
      bloqueado: usuarios.bloqueado,
    }).from(usuarios).where(eq(usuarios.id, userId));
    ok = !!user && !!user.active && !user.bloqueado && user.tokenVersion === tokenVersion;
  } catch (_e) {
    // Fail-closed en producción: un error de DB no debe abrir paso.
    // Se lee NODE_ENV dinámicamente (no la const IS_PROD) para que la decisión
    // sea consistente con el entorno real en cada invocación y testeable.
    if (process.env.NODE_ENV === 'production') {
      throw new AuthError(401, 'No se pudo verificar la sesión');
    }
    // Dev: no bloqueamos desarrollo por una DB caída.
    ok = true;
  }

  freshnessCache.set(userId, { expiresAt: Date.now() + FRESHNESS_TTL_MS, ok });
  if (!ok) throw new AuthError(401, 'Sesión revocada');
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const token = getTokenFromCookies(request);
  if (!token) throw new AuthError(401, 'No autorizado');
  const payload = verifyToken(token);
  if (!payload) throw new AuthError(401, 'Sesión inválida o expirada');
  await validateSessionFreshness(payload.userId, payload.tokenVersion);
  return payload;
}

export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (process.env.NODE_ENV === 'test' && !process.env.ACCESS_DB_ENABLED) {
    if (!defaultCapabilitiesForRole(user.rol).has('users.manage')) {
      throw new AuthError(403, 'Requiere capacidad de administración');
    }
    return user;
  }
  await assertCapability(user.userId, 'users.manage');
  return user;
}

/**
 * SGIE — requiere sesión con rol `abogado` o `admin`.
 *
 * El admin conserva acceso total al módulo SGIE (supervisión global),
 * por lo que ambos roles acceden. El scope fino por abogado (qué expedientes
 * ve un abogado) lo aplican las queries de `lib/sgie/expedientes-db.ts`,
 * no esta función. Ver docs/architecture/ §6.1.
 *
 * La verificación de bloqueo/revocación (posterior al JWT) se hace vía
 * `validateSessionFreshness` (token_version + active + bloqueado), con caché
 * corta para no añadir un round-trip por request.
 */
export async function requireAbogado(request: Request): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (process.env.NODE_ENV === 'test' && !process.env.ACCESS_DB_ENABLED) {
    if (!defaultCapabilitiesForRole(user.rol).has('cases.read')) {
      throw new AuthError(403, 'Requiere acceso SGIE');
    }
    return user;
  }
  await assertSgieAccess(user.userId);
  return user;
}

export function authFailureResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (err instanceof HttpError) return httpErrorResponse(err);
  return httpErrorResponse(err);
}

export function createAuthResponse(data: unknown, token?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) {
    headers.append('Set-Cookie', `${getCookieName()}=${token}; ${cookieAttrs()}`);
    if (shouldUseHostCookie()) {
      headers.append('Set-Cookie', `${COOKIE_NAME_FALLBACK}=; Path=/; Max-Age=0; SameSite=Lax; Secure`);
    }
  }
  return new Response(JSON.stringify(data), { headers });
}

export function createLogoutResponse() {
  const secureAttr = shouldUseHostCookie() ? '; Secure' : '';
  const clearPrimary = `${COOKIE_NAME}=; Path=/; Max-Age=0${secureAttr}; SameSite=Lax`;
  const clearFallback = `${COOKIE_NAME_FALLBACK}=; Path=/; Max-Age=0; SameSite=Lax${secureAttr}`;
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', clearPrimary);
  headers.append('Set-Cookie', clearFallback);
  return new Response(JSON.stringify({ message: 'Sesión cerrada' }), { headers });
}
