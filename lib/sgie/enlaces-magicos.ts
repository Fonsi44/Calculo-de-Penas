/**
 * SGIE — enlaces mágicos (Fase 4).
 *
 * Tokens seguros (256 bits) para que el cliente suba documentos sin cuenta.
 * Expiración obligatoria, usos máximos, revocación manual, scope a
 * expediente/requisito. Rate limit por IP/token en el endpoint.
 *
 * SEGURIDAD: el token NUNCA se persiste en claro. Se almacena su hash SHA-256
 * (`token_hash`). El token en claro solo vive en memoria en el momento de
 * emisión (envío por email / respuesta inmediata al abogado) y viaja en la URL
 * /cargar/{token} como credencial del cliente. No se loguea ni audita.
 * Ver docs/architecture/ §22.2.
 */
import { db } from '@/lib/db';
import { enlacesMagicos } from '@/lib/schema';
import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import { generarTokenSeguro, hashToken } from './util';

export interface CrearEnlaceInput {
  expedienteId: string;
  requisitoExpedienteId?: string;
  clienteEmail?: string;
  diasExpiracion?: number;
  usosMaximos?: number;
}

export interface EnlaceValido {
  id: string;
  expedienteId: string;
  requisitoExpedienteId: string | null;
  clienteEmail: string | null;
  usosMaximos: number | null;
  usosActuales: number | null;
}

/**
 * Resultado de crear un enlace. El `token` en claro se devuelve SOLO aquí, en
 * memoria, para envío inmediato (email/respuesta al abogado). No se persiste.
 */
export interface EnlaceCreado {
  id: string;
  token: string;
  expedienteId: string;
  expiraEn: Date;
  usosMaximos: number | null;
}

/**
 * Crea un enlace mágico. Expiración por defecto 7 días, usos máximos 5.
 * Persiste solo `tokenHash` (sha256 del token); el token en claro se devuelve
 * únicamente en el objeto retornado para uso inmediato del emisor.
 */
export async function crearEnlace(input: CrearEnlaceInput, creadoPor: string): Promise<EnlaceCreado> {
  const dias = input.diasExpiracion ?? 7;
  const expiraEn = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  const token = generarTokenSeguro();
  const tokenHash = hashToken(token);

  const [enlace] = await db
    .insert(enlacesMagicos)
    .values({
      tokenHash,
      expedienteId: input.expedienteId,
      requisitoExpedienteId: input.requisitoExpedienteId ?? null,
      clienteEmail: input.clienteEmail ?? null,
      creadoPor,
      expiraEn,
      usosMaximos: input.usosMaximos ?? 5,
      usosActuales: 0,
    })
    .returning({
      id: enlacesMagicos.id,
      expedienteId: enlacesMagicos.expedienteId,
      expiraEn: enlacesMagicos.expiraEn,
      usosMaximos: enlacesMagicos.usosMaximos,
    });

  return { ...enlace, token };
}

export type ValidacionEnlace =
  | { ok: true; enlace: EnlaceValido }
  | { ok: false; error: string; codigo: 'no_encontrado' | 'expirado' | 'revocado' | 'agotado' };

/**
 * Valida un token de enlace mágico: existe (buscado por su hash), no expirado,
 * no revocado, con usos disponibles. NO consume el uso (eso lo hace el upload
 * exitoso). Recibe el token en claro y lo hashea para la búsqueda.
 */
export async function validarEnlace(token: string): Promise<ValidacionEnlace> {
  const tokenHash = hashToken(token);

  const [enlace] = await db
    .select({
      id: enlacesMagicos.id,
      expedienteId: enlacesMagicos.expedienteId,
      requisitoExpedienteId: enlacesMagicos.requisitoExpedienteId,
      clienteEmail: enlacesMagicos.clienteEmail,
      expiraEn: enlacesMagicos.expiraEn,
      usosMaximos: enlacesMagicos.usosMaximos,
      usosActuales: enlacesMagicos.usosActuales,
      revocadoEn: enlacesMagicos.revocadoEn,
    })
    .from(enlacesMagicos)
    .where(eq(enlacesMagicos.tokenHash, tokenHash));

  if (!enlace) {
    return { ok: false, error: 'Enlace no encontrado.', codigo: 'no_encontrado' };
  }
  if (enlace.revocadoEn) {
    return { ok: false, error: 'Este enlace ha sido revocado.', codigo: 'revocado' };
  }
  if (new Date(enlace.expiraEn) < new Date()) {
    return { ok: false, error: 'Este enlace ha expirado.', codigo: 'expirado' };
  }
  if (enlace.usosMaximos !== null && enlace.usosActuales !== null && enlace.usosActuales >= enlace.usosMaximos) {
    return { ok: false, error: 'Este enlace ha alcanzado el máximo de usos.', codigo: 'agotado' };
  }

  return {
    ok: true,
    enlace: {
      id: enlace.id,
      expedienteId: enlace.expedienteId,
      requisitoExpedienteId: enlace.requisitoExpedienteId,
      clienteEmail: enlace.clienteEmail,
      usosMaximos: enlace.usosMaximos,
      usosActuales: enlace.usosActuales,
    },
  };
}

/**
 * Consume un uso del enlace (tras un upload exitoso). Atómico con incremento.
 */
export async function consumirUsoEnlace(enlaceId: string): Promise<void> {
  await db
    .update(enlacesMagicos)
    .set({ usosActuales: sql`${enlacesMagicos.usosActuales} + 1` })
    .where(eq(enlacesMagicos.id, enlaceId));
}

/**
 * Revoca un enlace manualmente (admin o abogado con scope).
 */
export async function revocarEnlace(enlaceId: string, revocadoPor: string, motivo?: string): Promise<void> {
  await db
    .update(enlacesMagicos)
    .set({ revocadoEn: new Date(), revocadoPor, revocadoMotivo: motivo ?? null })
    .where(eq(enlacesMagicos.id, enlaceId));
}

/**
 * Limpieza: marca como revocados los enlaces expirados (para jobs de cron).
 * Devuelve cuántos se marcaron.
 */
export async function expirarEnlacesVencidos(): Promise<number> {
  const result = await db
    .update(enlacesMagicos)
    .set({ revocadoEn: new Date() })
    .where(
      and(
        isNull(enlacesMagicos.revocadoEn),
        lt(enlacesMagicos.expiraEn, new Date()),
      ),
    )
    .returning({ id: enlacesMagicos.id });
  return result.length;
}
