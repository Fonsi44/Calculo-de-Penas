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
import { clientes } from '@/lib/schema';
import { and, count, eq, ilike, or, sql } from 'drizzle-orm';
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

/** Política única de ámbito: admin ve todo; abogado solo clientes de expedientes
 * asignados o permitidos. Se inyecta en SELECT y UPDATE, nunca después. */
function condicionAmbitoCliente(ctx: ContextoAbogado) {
  if (ctx.esAdmin) return undefined;
  return sql`EXISTS (
    SELECT 1 FROM expedientes e
    LEFT JOIN expediente_asignaciones ea ON ea.expediente_id = e.id
      AND ea.abogado_id = ${ctx.usuarioId} AND ea.revocada_en IS NULL
    LEFT JOIN expediente_permisos ep ON ep.expediente_id = e.id
      AND ep.abogado_id = ${ctx.usuarioId} AND ep.revocado_en IS NULL
    WHERE e.cliente_id = ${clientes.id} AND (ea.expediente_id IS NOT NULL OR ep.expediente_id IS NOT NULL)
  )`;
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
  const scope = condicionAmbitoCliente(ctx);
  if (scope) conditions.push(scope);

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
export async function detectarDuplicado(input: CrearClienteInput, ctx: ContextoAbogado): Promise<{ id: string; accesible: boolean } | null> {
  const hash = hashDuplicado(input.identidad, input.rtn);
  if (!hash) return null;
  const [existente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.duplicadoHash, hash));
  if (!existente) return null;
  const scope = condicionAmbitoCliente(ctx);
  if (!scope) return { id: existente.id, accesible: true };
  const [visible] = await db.select({ id: clientes.id }).from(clientes)
    .where(and(eq(clientes.id, existente.id), scope));
  return { id: existente.id, accesible: Boolean(visible) };
}

/**
 * Crea un cliente. Si detecta duplicado por identidad/RTN, devuelve el id
 * existente en lugar de crear uno nuevo (detección de cliente existente §8.1).
 */
export async function crearOReutilizarCliente(
  input: CrearClienteInput,
  ctx: ContextoAbogado,
): Promise<{ id?: string; creado: boolean; duplicadoNoAccesible?: boolean }> {
  const duplicado = await detectarDuplicado(input, ctx);
  if (duplicado?.accesible) {
    return { id: duplicado.id, creado: false };
  }
  if (duplicado) {
    // No filtrar existencia ni UUID de un cliente fuera del ámbito.
    return { creado: false, duplicadoNoAccesible: true };
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
  const scope = condicionAmbitoCliente(ctx);
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
    .where(scope ? and(eq(clientes.id, clienteId), scope) : eq(clientes.id, clienteId));

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
    const expedienteVisible = sql`EXISTS (
      SELECT 1 FROM expediente_asignaciones ea
      WHERE ea.expediente_id = ${expedientes.id} AND ea.abogado_id = ${ctx.usuarioId}
        AND ea.revocada_en IS NULL
      UNION ALL
      SELECT 1 FROM expediente_permisos ep
      WHERE ep.expediente_id = ${expedientes.id} AND ep.abogado_id = ${ctx.usuarioId}
        AND ep.revocado_en IS NULL
    )`;
    const [r] = await db.select({ c: count() }).from(expedientes)
      .where(and(eq(expedientes.clienteId, clienteId), expedienteVisible));
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
): Promise<boolean> {
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

  if (Object.keys(set).length === 0) return Boolean(await obtenerCliente(clienteId, ctx));

  set.actualizadoEn = new Date();
  const scope = condicionAmbitoCliente(ctx);
  const updated = await db.update(clientes).set(set)
    .where(scope ? and(eq(clientes.id, clienteId), scope) : eq(clientes.id, clienteId))
    .returning({ id: clientes.id });
  return updated.length === 1;
}
