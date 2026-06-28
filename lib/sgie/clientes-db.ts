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
  // Sprint 5 — baja lógica.
  activo: boolean | null;
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
  opts: { q?: string; limit?: number; offset?: number; incluirInactivos?: boolean } = {},
): Promise<{ clientes: ClienteItem[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  // Sprint 5 — por defecto sólo activos.
  const conditions = [];
  if (!opts.incluirInactivos) {
    conditions.push(eq(clientes.activo, true));
  }
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
        activo: clientes.activo,
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

/**
 * Detalle de un cliente con el conteo de expedientes asociados accesibles por
 * el abogado. El admin ve el conteo total; un abogado sólo ve los suyos.
 *
 * Sprint 1 — ficha de cliente.
 */
export async function obtenerCliente(
  clienteId: string,
  ctx: ContextoAbogado,
): Promise<(ClienteItem & { creadoPor: string | null; desactivadoEn: Date | null; motivoDesactivacion: string | null }) | null> {
  const [row] = await db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      identidad: clientes.identidad,
      rtn: clientes.rtn,
      email: clientes.email,
      telefono: clientes.telefono,
      notas: clientes.notas,
      creadoEn: clientes.creadoEn,
      creadoPor: clientes.creadoPor,
      // Sprint 5 — baja lógica.
      activo: clientes.activo,
      desactivadoEn: clientes.desactivadoEn,
      desactivadoPor: clientes.desactivadoPor,
      motivoDesactivacion: clientes.motivoDesactivacion,
    })
    .from(clientes)
    .where(eq(clientes.id, clienteId));

  if (!row) return null;

  // Conteo de expedientes accesibles para este cliente.
  const { expedientes } = await import('@/lib/schema');
  let expedientesCount = 0;
  if (ctx.esAdmin) {
    const [r] = await db.select({ c: count() }).from(expedientes)
      .where(eq(expedientes.clienteId, clienteId));
    expedientesCount = r?.c ?? 0;
  } else {
    // Sólo expedientes del cliente que estén asignados al abogado.
    const [r] = await db.select({ c: count() }).from(expedientes)
      .innerJoin(
        expedienteAsignaciones,
        eq(expedienteAsignaciones.expedienteId, expedientes.id),
      )
      .where(and(
        eq(expedientes.clienteId, clienteId),
        eq(expedienteAsignaciones.abogadoId, ctx.usuarioId),
        isNull(expedienteAsignaciones.revocadaEn),
      ));
    expedientesCount = r?.c ?? 0;
  }

  return { ...row, expedientesCount };
}

export interface ActualizarClienteInput {
  nombre?: string;
  identidad?: string;
  rtn?: string;
  email?: string;
  telefono?: string;
  notas?: string;
  // Sprint 5 — baja lógica.
  activo?: boolean;
  motivoDesactivacion?: string;
}

/**
 * Actualiza los datos editables de un cliente. Recalcula el `duplicadoHash`
 * si cambian identidad/RTN.
 *
 * Sprint 1 — edición de cliente.
 * Sprint 5 — soporta baja lógica (activo/desactivadoEn/desactivadoPor/
 * motivoDesactivacion). No borra expedientes ni documentos asociados.
 */
export async function actualizarCliente(
  clienteId: string,
  input: ActualizarClienteInput,
  ctx: ContextoAbogado,
): Promise<void> {
  const set: Record<string, unknown> = {};
  if (input.nombre !== undefined) set.nombre = input.nombre.trim();
  if (input.identidad !== undefined) set.identidad = input.identidad.trim() || null;
  if (input.rtn !== undefined) set.rtn = input.rtn.trim() || null;
  if (input.email !== undefined) set.email = input.email.trim() || null;
  if (input.telefono !== undefined) set.telefono = input.telefono.trim() || null;
  if (input.notas !== undefined) set.notas = input.notas || null;

  // Recalcular hash de duplicado si cambian identidad/RTN.
  if (input.identidad !== undefined || input.rtn !== undefined) {
    set.duplicadoHash = hashDuplicado(
      input.identidad ?? undefined,
      input.rtn ?? undefined,
    );
  }

  // Sprint 5 — baja lógica.
  if (input.activo !== undefined) {
    set.activo = input.activo;
    if (input.activo) {
      // Reactivar: limpiar marca de desactivación.
      set.desactivadoEn = null;
      set.desactivadoPor = null;
      set.motivoDesactivacion = null;
    } else {
      // Desactivar: registrar quién/cuándo/motivo.
      set.desactivadoEn = new Date();
      set.desactivadoPor = ctx.usuarioId;
      set.motivoDesactivacion = input.motivoDesactivacion ?? null;
    }
  }

  if (Object.keys(set).length === 0) return;

  set.actualizadoEn = new Date();
  await db.update(clientes).set(set).where(eq(clientes.id, clienteId));
}
