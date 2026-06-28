/**
 * SGIE — Recuperación de contraseña (Sprint 4, tarea 4).
 *
 * Token de un solo uso, expiración corta (1h), hash del token en DB (nunca el
 * token plano). Respuesta neutra para evitar enumeración de usuarios.
 * Rate limiting por email/IP (lo aplica el endpoint).
 *
 * Reutiliza Resend (lib/email.ts) si está configurado; si no, el token se
 * genera pero el correo no se envía (se documenta la limitación).
 *
 * Auditoría: password_reset (solicitud) y password_changed (confirmación).
 *
 * Sprint 4.
 */
import { createHash, randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { passwordResetTokens, usuarios } from '@/lib/schema';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

const EXPIRACION_MS = 60 * 60 * 1000; // 1 hora

/** Genera un token aleatorio criptográficamente seguro (32 bytes → base64url). */
export function generarTokenReset(): string {
  return randomBytes(32).toString('base64url');
}

/** Calcula el hash SHA-256 del token (lo que se guarda en DB). */
export function hashTokenReset(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Crea un token de reset para un usuario. Invalida tokens previos no consumidos
 * ni expirados del mismo usuario (marca consumidos) para evitar acumulación.
 * Devuelve el token plano (para enviar por email) y el hash (para DB).
 */
export async function crearTokenReset(usuarioId: string): Promise<{ token: string; tokenHash: string; expiraEn: Date }> {
  // Invalidar tokens previos activos del usuario.
  await db.update(passwordResetTokens).set({ consumidoEn: new Date() })
    .where(and(eq(passwordResetTokens.usuarioId, usuarioId), isNull(passwordResetTokens.consumidoEn)));

  const token = generarTokenReset();
  const tokenHash = hashTokenReset(token);
  const expiraEn = new Date(Date.now() + EXPIRACION_MS);

  await db.insert(passwordResetTokens).values({ usuarioId, tokenHash, expiraEn });
  return { token, tokenHash, expiraEn };
}

/**
 * Valida un token: existe, no expirado, no consumido. Devuelve el usuarioId
 * si es válido, o null. NO consume el token (lo hace consumirTokenReset).
 */
export async function validarTokenReset(token: string): Promise<string | null> {
  const tokenHash = hashTokenReset(token);
  const [row] = await db.select({ usuarioId: passwordResetTokens.usuarioId, expiraEn: passwordResetTokens.expiraEn, consumidoEn: passwordResetTokens.consumidoEn })
    .from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
  if (!row) return null;
  if (row.consumidoEn) return null;
  if (new Date(row.expiraEn) < new Date()) return null;
  return row.usuarioId;
}

/**
 * Consume el token (marca consumido) y actualiza la contraseña.
 * Devuelve true si tuvo éxito. Idempotente: si el token ya está consumido,
 * devuelve false (no permite reusar).
 */
export async function consumirTokenReset(token: string, nuevaPassword: string): Promise<boolean> {
  const tokenHash = hashTokenReset(token);
  const usuarioId = await validarTokenReset(token);
  if (!usuarioId) return false;

  const nuevoHash = await hashPassword(nuevaPassword);
  await db.transaction(async (tx) => {
    await tx.update(usuarios).set({ passwordHash: nuevoHash }).where(eq(usuarios.id, usuarioId));
    await tx.update(passwordResetTokens).set({ consumidoEn: new Date() }).where(eq(passwordResetTokens.tokenHash, tokenHash));
  });
  return true;
}

/** Limpieza de tokens expirados (para job periódico opcional). */
export async function limpiarTokensExpirados(): Promise<number> {
  const r = await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiraEn, new Date()));
  return r?.rowCount ?? 0;
}
