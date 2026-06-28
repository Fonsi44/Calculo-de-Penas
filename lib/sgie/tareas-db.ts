/**
 * SGIE — capa de acceso a datos para tareas (Sprint 1).
 *
 * CRUD de tareas con scope por abogado: cada abogado sólo ve/edita tareas
 * vinculadas a expedientes donde esté asignado o tenga permiso. El admin ve
 * todas. El scope se aplica SIEMPRE en la query (no en UI).
 *
 * Referencia: pinedayasociados.md §9 (Agenda/tareas), §6.2 (scope).
 *
 * Modelo: la tabla `tareas` (lib/schema.ts) NO tiene tabla de comentarios
 * asociada. Los comentarios quedan PENDIENTES de un futuro cambio de schema
 * (no se inventa estructura).
 */
import { db } from '@/lib/db';
import {
  tareas,
  expedienteAsignaciones,
  expedientePermisos,
  usuarios,
} from '@/lib/schema';
import { and, asc, count, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import type { ContextoAbogado } from './expedientes-db';

export type TareaEstado = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
export type TareaPrioridad = 'baja' | 'media' | 'alta' | 'urgente';

export interface TareaItem {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  prioridad: string;
  automatica: boolean | null;
  fechaVencimiento: Date | null;
  completadaEn: Date | null;
  creadaEn: Date | null;
  expedienteId: string | null;
  numeroInterno: string | null;
  asignadaA: string | null;
  asignadaNombre: string | null;
  creadaPor: string | null;
}

export interface CrearTareaInput {
  titulo: string;
  descripcion?: string;
  prioridad?: TareaPrioridad;
  expedienteId?: string;
  asignadaA?: string;
  fechaVencimiento?: Date;
}

export interface ActualizarTareaInput {
  titulo?: string;
  descripcion?: string;
  prioridad?: TareaPrioridad;
  estado?: TareaEstado;
  expedienteId?: string | null;
  asignadaA?: string | null;
  fechaVencimiento?: Date | null;
}

export interface ListarTareasOpts {
  expedienteId?: string;
  estado?: string;
  prioridad?: string;
  asignadaA?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

/**
 * IDs de expedientes accesibles por el abogado. null = sin restricción (admin).
 */
async function idsExpedientesAccesibles(ctx: ContextoAbogado): Promise<string[] | null> {
  if (ctx.esAdmin) return null;
  const [asignados, permitidos] = await Promise.all([
    db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
      .where(and(eq(expedienteAsignaciones.abogadoId, ctx.usuarioId), isNull(expedienteAsignaciones.revocadaEn))),
    db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
      .where(and(eq(expedientePermisos.abogadoId, ctx.usuarioId), isNull(expedientePermisos.revocadoEn))),
  ]);
  const ids = new Set<string>();
  [...asignados, ...permitidos].forEach((r) => ids.add(r.id));
  return Array.from(ids);
}

/**
 * Lista tareas accesibles con filtros. El admin ve todas; cada abogado sólo las
 * de sus expedientes asignados/permitidos. Las tareas sin expediente sólo las
 * ve el admin (no hay scope para tareas huérfanas de un abogado concreto).
 */
export async function listarTareas(
  ctx: ContextoAbogado,
  opts: ListarTareasOpts = {},
): Promise<{ tareas: TareaItem[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  const accesibles = await idsExpedientesAccesibles(ctx);

  const conditions = [];
  if (accesibles !== null) {
    // Abogado: sólo tareas de sus expedientes.
    if (accesibles.length === 0) return { tareas: [], total: 0 };
    conditions.push(inArray(tareas.expedienteId, accesibles));
  }
  if (opts.expedienteId) conditions.push(eq(tareas.expedienteId, opts.expedienteId));
  if (opts.estado) conditions.push(eq(tareas.estado, opts.estado as TareaEstado));
  if (opts.prioridad) conditions.push(eq(tareas.prioridad, opts.prioridad as TareaPrioridad));
  if (opts.asignadaA) conditions.push(eq(tareas.asignadaA, opts.asignadaA));
  if (opts.q) {
    const term = `%${opts.q}%`;
    conditions.push(or(ilike(tareas.titulo, term), ilike(tareas.descripcion, term))!);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [c]] = await Promise.all([
    db.select({
      id: tareas.id,
      titulo: tareas.titulo,
      descripcion: tareas.descripcion,
      estado: tareas.estado,
      prioridad: tareas.prioridad,
      automatica: tareas.automatica,
      fechaVencimiento: tareas.fechaVencimiento,
      completadaEn: tareas.completadaEn,
      creadaEn: tareas.creadaEn,
      expedienteId: tareas.expedienteId,
      asignadaA: tareas.asignadaA,
      asignadaNombre: usuarios.nombre,
      creadaPor: tareas.creadaPor,
    })
      .from(tareas)
      .leftJoin(usuarios, eq(tareas.asignadaA, usuarios.id))
      .where(where)
      .orderBy(asc(tareas.fechaVencimiento), desc(tareas.creadaEn))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(tareas).where(where),
  ]);

  // El número interno del expediente se une por separado para no duplicar filas
  // (leftJoin a expedientes + usuarios + otra join puede inflar resultados).
  const tareasConExpediente: TareaItem[] = rows.map((r) => ({
    ...r,
    numeroInterno: null, // se rellena abajo si procede
  }));

  if (tareasConExpediente.some((t) => t.expedienteId)) {
    const { expedientes } = await import('@/lib/schema');
    const expIds = Array.from(
      new Set(tareasConExpediente.map((t) => t.expedienteId).filter((x): x is string => Boolean(x))),
    );
    if (expIds.length > 0) {
      const expRows = await db
        .select({ id: expedientes.id, numeroInterno: expedientes.numeroInterno })
        .from(expedientes)
        .where(inArray(expedientes.id, expIds));
      const mapa = new Map(expRows.map((e) => [e.id, e.numeroInterno]));
      tareasConExpediente.forEach((t) => {
        if (t.expedienteId) t.numeroInterno = mapa.get(t.expedienteId) ?? null;
      });
    }
  }

  return { tareas: tareasConExpediente, total: c?.total ?? 0 };
}

/**
 * Verifica el scope del abogado sobre una tarea concreta.
 * El admin siempre tiene acceso. Un abogado tiene acceso si la tarea pertenece
 * a un expediente accesible, o si la tarea le está asignada, o si él la creó.
 */
export async function verificarAccesoTarea(
  tareaId: string,
  ctx: ContextoAbogado,
): Promise<boolean> {
  if (ctx.esAdmin) return true;
  const [tarea] = await db.select({
    expedienteId: tareas.expedienteId,
    asignadaA: tareas.asignadaA,
    creadaPor: tareas.creadaPor,
  }).from(tareas).where(eq(tareas.id, tareaId));
  if (!tarea) return false;
  // Tarea asignada al propio abogado o creada por él → acceso.
  if (tarea.asignadaA === ctx.usuarioId || tarea.creadaPor === ctx.usuarioId) return true;
  // Si no, requiere acceso al expediente.
  if (!tarea.expedienteId) return false;
  const accesibles = await idsExpedientesAccesibles(ctx);
  return accesibles?.includes(tarea.expedienteId) ?? false;
}

/**
 * Crea una tarea. Si se pasa `expedienteId`, el abogado debe tener acceso al
 * expediente (si no es admin). `creadaPor` = abogado actual.
 */
export async function crearTarea(
  input: CrearTareaInput,
  ctx: ContextoAbogado,
): Promise<{ id: string }> {
  // Validar acceso al expediente si se asocia uno.
  if (input.expedienteId) {
    const accesibles = await idsExpedientesAccesibles(ctx);
    if (accesibles !== null && !accesibles.includes(input.expedienteId)) {
      throw new Error('Sin acceso al expediente');
    }
  }

  const [t] = await db.insert(tareas).values({
    titulo: input.titulo.trim(),
    descripcion: input.descripcion?.trim() || null,
    prioridad: input.prioridad ?? 'media',
    expedienteId: input.expedienteId ?? null,
    asignadaA: input.asignadaA ?? null,
    fechaVencimiento: input.fechaVencimiento ?? null,
    creadaPor: ctx.usuarioId,
    estado: 'pendiente',
  }).returning({ id: tareas.id });

  if (!t) throw new Error('No se pudo crear la tarea');
  return t;
}

/**
 * Actualiza una tarea (campos editables + estado). Requiere scope.
 * Si el estado pasa a `completada`, fija `completadaEn`; si vuelve a `pendiente`
 * o `en_progreso`, limpia `completadaEn`.
 */
export async function actualizarTarea(
  tareaId: string,
  input: ActualizarTareaInput,
  ctx: ContextoAbogado,
): Promise<void> {
  const tieneAcceso = await verificarAccesoTarea(tareaId, ctx);
  if (!tieneAcceso) throw new Error('Sin acceso a la tarea');

  // Validar acceso al expediente si se reasocia.
  if (input.expedienteId) {
    const accesibles = await idsExpedientesAccesibles(ctx);
    if (accesibles !== null && !accesibles.includes(input.expedienteId)) {
      throw new Error('Sin acceso al expediente');
    }
  }

  const set: Record<string, unknown> = {};
  if (input.titulo !== undefined) set.titulo = input.titulo.trim();
  if (input.descripcion !== undefined) set.descripcion = input.descripcion.trim() || null;
  if (input.prioridad !== undefined) set.prioridad = input.prioridad;
  if (input.expedienteId !== undefined) set.expedienteId = input.expedienteId || null;
  if (input.asignadaA !== undefined) set.asignadaA = input.asignadaA || null;
  if (input.fechaVencimiento !== undefined) set.fechaVencimiento = input.fechaVencimiento;

  if (input.estado !== undefined) {
    set.estado = input.estado;
    set.completadaEn = input.estado === 'completada' ? new Date() : null;
  }

  if (Object.keys(set).length === 0) return;

  await db.update(tareas).set(set).where(eq(tareas.id, tareaId));
}
