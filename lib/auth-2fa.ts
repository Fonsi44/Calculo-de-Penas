/**
 * SGIE — 2FA TOTP (Sprint 5, tarea 1).
 *
 * Capa de dos factores compatible con apps estándar (Google Authenticator,
 * Authy, 1Password). Secret TOTP cifrado en reposo (AES-256-GCM), códigos de
 * recuperación hasheados (SHA-256).
 *
 * Enrolamiento opt-in (admin/perfil). Si 2FA no está habilitado, el login
 * actual funciona sin cambios.
 *
 * IMPLEMENTACIÓN: TOTP RFC 6238 nativo con Node crypto (HMAC-SHA1), sin
 * dependencias externas. Se probó `otplib` pero su API v13 es async y requiere
 * configuración manual de plugins; la implementación nativa es más robusta y
 * auditable. Base32 propio para secret/URI.
 *
 * Sprint 5.
 */
import { createHmac, createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';
import { twoFactorSecrets, twoFactorRecoveryCodes, usuarios } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';

// ─── Base32 (RFC 4648) — para secrets compatibles con apps TOTP ───────────
const B32_ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += B32_ALFABETO[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += B32_ALFABETO[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(str: string): Buffer {
  const clean = str.replace(/=+$/, '').toUpperCase();
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const c of clean) {
    const idx = B32_ALFABETO.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// ─── TOTP RFC 6238 nativo ────────────────────────────────────────────────
const TOTP_STEP = 30; // segundos
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // tolerancia: ±1 step (30s)

/** Genera el código TOTP para un counter determinado. */
function totpGenerar(secretBuf: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // counter como big-endian de 64 bits.
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', secretBuf).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  const otp = bin % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

/** Verifica un código TOTP con ventana (timing-safe compare). */
function totpVerificar(secretBuf: Buffer, token: string): boolean {
  const counter = Math.floor(Date.now() / 1000 / TOTP_STEP);
  for (let w = -TOTP_WINDOW; w <= TOTP_WINDOW; w++) {
    const esperado = totpGenerar(secretBuf, counter + w);
    const a = Buffer.from(esperado);
    const b = Buffer.from(token);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

// ─── Cifrado del secret (AES-256-GCM) ────────────────────────────────────
function claveCifradoActual(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY debe estar configurada y tener al menos 32 caracteres para 2FA');
    }
    // Solo desarrollo/test: evita bloquear pruebas locales sin reutilizar JWT_SECRET.
    return scryptSync('dev-only-2fa-encryption-key-not-for-production', 'sgie-2fa-v2', 32);
  }
  return scryptSync(secret, 'sgie-2fa-v2', 32);
}

function clavesLectura(): Buffer[] {
  const claves = [claveCifradoActual()];
  const previous = process.env.ENCRYPTION_KEY_PREVIOUS;
  if (previous && previous.length >= 32) claves.push(scryptSync(previous, 'sgie-2fa-v2', 32));
  // Compatibilidad de lectura para filas creadas antes de esta remediación.
  // Nunca se usa para cifrar contenido nuevo; debe retirarse tras migración controlada.
  const legacy = process.env.JWT_SECRET;
  if (legacy && legacy.length >= 32) claves.push(scryptSync(legacy, 'sgie-2fa-salt', 32));
  return claves;
}

function cifrar(texto: string): string {
  const key = claveCifradoActual();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString('base64');
}

function descifrarConClave(payload: string, key: Buffer): string {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function descifrar(payload: string): string {
  for (const key of clavesLectura()) {
    try { return descifrarConClave(payload, key); } catch { /* probar la siguiente clave */ }
  }
  throw new Error('No se pudo descifrar el secreto 2FA');
}

const NUM_RECOVERY_CODES = 8;
const RECOVERY_CODE_LENGTH = 10;

/** Genera un nuevo secret TOTP aleatorio (base32, 20 bytes = 160 bits). */
export function generarSecretTotp(): string {
  return base32Encode(randomBytes(20));
}

/** Construye el URI otpauth:// para el QR (compatible con apps estándar). */
export function buildOtpAuthUri(email: string, secret: string): string {
  const issuer = 'Pineda y Asociados SGIE';
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP),
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?${params}`;
}

/** Verifica un código TOTP contra un secret (descifrado). */
export function verificarCodigoTotp(secretCifrado: string, codigo: string): boolean {
  try {
    const secretB32 = descifrar(secretCifrado);
    const secretBuf = base32Decode(secretB32);
    return totpVerificar(secretBuf, codigo);
  } catch {
    return false;
  }
}

/** Genera N códigos de recuperación alfanuméricos. */
export function generarCodigosRecuperacion(): string[] {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos
  const out: string[] = [];
  for (let i = 0; i < NUM_RECOVERY_CODES; i++) {
    let code = '';
    const bytes = randomBytes(RECOVERY_CODE_LENGTH);
    for (let j = 0; j < RECOVERY_CODE_LENGTH; j++) {
      code += charset[bytes[j] % charset.length];
    }
    out.push(code);
  }
  return out;
}

/** Hash SHA-256 de un código de recuperación. */
export function hashCodigoRecuperacion(code: string): string {
  return createHash('sha256').update(code.toUpperCase()).digest('hex');
}

/** Persiste un secret 2FA para un usuario (no habilitado hasta confirmar). */
export async function guardarSecretPendiente(usuarioId: string, secret: string): Promise<void> {
  const secretCifrado = cifrar(secret);
  const [existente] = await db.select().from(twoFactorSecrets).where(eq(twoFactorSecrets.usuarioId, usuarioId));
  if (existente) {
    await db.update(twoFactorSecrets).set({ secretCifrado, habilitado: false, actualizadoEn: new Date() })
      .where(eq(twoFactorSecrets.id, existente.id));
  } else {
    await db.insert(twoFactorSecrets).values({ usuarioId, secretCifrado, habilitado: false });
  }
}

/** Activa el 2FA y persiste los códigos de recuperación hasheados. */
export async function habilitar2fa(usuarioId: string, codigosRecuperacion: string[]): Promise<void> {
  const [existente] = await db.select().from(twoFactorSecrets).where(eq(twoFactorSecrets.usuarioId, usuarioId));
  if (!existente) throw new Error('No hay secret pendiente');

  await db.transaction(async (tx) => {
    await tx.update(twoFactorSecrets).set({ habilitado: true, actualizadoEn: new Date() })
      .where(eq(twoFactorSecrets.id, existente.id));
    // Reemplazar códigos previos (si regenera).
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.usuarioId, usuarioId));
    await tx.insert(twoFactorRecoveryCodes).values(
      codigosRecuperacion.map((c) => ({ usuarioId, codeHash: hashCodigoRecuperacion(c) })),
    );
  });
}

/** Desactiva el 2FA y borra códigos. */
export async function deshabilitar2fa(usuarioId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.usuarioId, usuarioId));
    await tx.delete(twoFactorSecrets).where(eq(twoFactorSecrets.usuarioId, usuarioId));
  });
}

/** ¿Tiene el usuario 2FA habilitado? */
export async function tiene2faHabilitado(usuarioId: string): Promise<boolean> {
  const [row] = await db.select({ habilitado: twoFactorSecrets.habilitado })
    .from(twoFactorSecrets).where(eq(twoFactorSecrets.usuarioId, usuarioId));
  return Boolean(row?.habilitado);
}

/** Verifica un código de recuperación y lo marca como usado. */
export async function usarCodigoRecuperacion(usuarioId: string, code: string): Promise<boolean> {
  const codeHash = hashCodigoRecuperacion(code);
  const [row] = await db.select({ id: twoFactorRecoveryCodes.id })
    .from(twoFactorRecoveryCodes)
    .where(and(eq(twoFactorRecoveryCodes.usuarioId, usuarioId), eq(twoFactorRecoveryCodes.codeHash, codeHash), isNull(twoFactorRecoveryCodes.usadoEn)));
  if (!row) return false;
  await db.update(twoFactorRecoveryCodes).set({ usadoEn: new Date() }).where(eq(twoFactorRecoveryCodes.id, row.id));
  return true;
}

/** Obtiene el secret cifrado (para verificar códigos en login). */
export async function obtenerSecretCifrado(usuarioId: string): Promise<string | null> {
  const [row] = await db.select({ secretCifrado: twoFactorSecrets.secretCifrado })
    .from(twoFactorSecrets).where(eq(twoFactorSecrets.usuarioId, usuarioId));
  return row?.secretCifrado ?? null;
}

/** Obtiene el email de un usuario (para el URI del QR). */
export async function obtenerEmailUsuario(usuarioId: string): Promise<string | null> {
  const [row] = await db.select({ email: usuarios.email }).from(usuarios).where(eq(usuarios.id, usuarioId));
  return row?.email ?? null;
}
