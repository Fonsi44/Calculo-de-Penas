/**
 * SGIE — capa de acceso a datos para clientes (Fase 3).
 *
 * CRUD de clientes con detección de duplicados por identidad/RTN normalizado
 * (vía `duplicado_hash`). El abogado sólo ve clientes vinculados a sus
 * expedientes asignados; el admin ve todos. Scope en query.
 *
 * Referencia: pinedayasociados.md §8.1 (paso 2: alta o detección de cliente).
 */
import { db } from '@/lib/db';
import { clientes, expedienteAsignaciones } from '@/lib/schema';
import { and, count, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import type { ContextoAbogado } from './expedientes-db';

export interface ClienteItem {
  id: string;
  nombre: string;
  identidad: string | null;
  rtn: string | null;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  creadoEn: Date | null;
  expedientesCount: number;
}

export interface CrearClienteInput {
  nombre: string;
  identidad?: string;
  rtn?: string;
  email?: string;
  telefono?: string;
  notas?: string;
}

/**
 * Normaliza identidad/RTN para hash de duplicados: quita guiones/espacios,
 * mayúsculas. Permite detectar duplicados sin exponer PII en el índice.
 */
function hashDuplicado(identidad?: string, rtn?: string): string | null {
  const base = (identidad || rtn || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!base) return null;
  return createHash('sha256').update(base).digest('hex');
}

/**
 * Lista clientes accesibles por el abogado (scope). El admin ve todos.
 */
export async function listarClientes(
  ctx: ContextoAbogado,
  opts: { q?: string; limit?: number; offset?: number } = {},
): Promise<{ clientes: ClienteItem[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  // Scope: el filtrado por abogado se aplica vía subquery EXISTS más abajo.
  const conditions = [];
  if (opts.q) {
    const term = `%${opts.q}%`;
    conditions.push(
      or(ilike(clientes.nombre, term), ilike(clientes.email, term), ilike(clientes.identidad, term))!,
    );
  }

  // Para abogado no-admin, filtrar clientes que tengan al menos un expediente
  // asignado al abogado. Se hace vía subquery EXISTS.
  if (!ctx.esAdmin) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM expedientes e
        JOIN expediente_asignaciones ea ON ea.expediente_id = e.id
        WHERE e.cliente_id = ${clientes.id}
          AND ea.abogado_id = ${ctx.usuarioId}
          AND ea.revocada_en IS NULL
      )`,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: clientes.id,
        nombre: clientes.nombre,
        identidad: clientes.identidad,
        rtn: clientes.rtn,
        email: clientes.email,
        telefono: clientes.telefono,
        notas: clientes.notas,
        creadoEn: clientes.creadoEn,
      })
      .from(clientes)
      .where(where)
      .orderBy(clientes.creadoEn)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(clientes).where(where),
  ]);

  return {
    clientes: rows.map((r) => ({ ...r, expedientesCount: 0 })),
    total: countRow?.total ?? 0,
  };
}

/**
 * Detecta duplicados antes de crear un cliente. Devuelve el cliente existente
 * si hay coincidencia por identidad/RTN normalizado.
 */
export async function detectarDuplicado(input: CrearClienteInput): Promise<string | null> {
  const hash = hashDuplicado(input.identidad, input.rtn);
  if (!hash) return null;
  const [existente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.duplicadoHash, hash));
  return existente?.id ?? null;
}

/**
 * Crea un cliente. Si detecta duplicado por identidad/RTN, devuelve el id
 * existente en lugar de crear uno nuevo (detección de cliente existente §8.1).
 */
export async function crearOReutilizarCliente(
  input: CrearClienteInput,
  ctx: ContextoAbogado,
): Promise<{ id: string; creado: boolean }> {
  const duplicadoId = await detectarDuplicado(input);
  if (duplicadoId) {
    return { id: duplicadoId, creado: false };
  }

  const [cliente] = await db
    .insert(clientes)
    .values({
      nombre: input.nombre.trim(),
      identidad: input.identidad?.trim() || null,
      rtn: input.rtn?.trim() || null,
      email: input.email?.trim() || null,
      telefono: input.telefono?.trim() || null,
      notas: input.notas || null,
      duplicadoHash: hashDuplicado(input.identidad, input.rtn),
      creadoPor: ctx.usuarioId,
    })
    .returning({ id: clientes.id });

  if (!cliente) throw new Error('No se pudo crear el cliente');
  return { id: cliente.id, creado: true };
}
