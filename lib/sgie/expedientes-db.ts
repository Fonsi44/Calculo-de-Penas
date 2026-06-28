/**
 * SGIE — capa de acceso a datos para expedientes (Fase 3).
 *
 * Regla crítica de scope: cada abogado sólo consulta expedientes donde esté
 * asignado (responsable/colaborador) o tenga permiso explícito concedido por
 * admin. El admin ve todo. El scope se aplica SIEMPRE en la query (no en UI).
 *
 * Referencia: pinedayasociados.md §6.2 (scope), §8.2 (estados), §11 (procedimientos).
 *
 * PRINCIPIO RECTOR: la IA/sistema nunca ejecuta transiciones críticas
 * (`validado` y posteriores). Esas requieren actor abogado explícito.
 */
import { db } from '@/lib/db';
import {
  expedientes,
  expedienteAsignaciones,
  expedientePermisos,
  requisitosExpediente,
  historialExpediente,
  tiposProcedimiento,
  clientes,
  usuarios,
  EXPEDIENTE_ESTADOS_CRITICOS,
  type ExpedienteEstado,
} from '@/lib/schema';
import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { extraerRequisitosDeDefinicion } from './procedimientos-db';

export interface ContextoAbogado {
  usuarioId: string;
  esAdmin: boolean;
  rol: string;
}

export interface ExpedienteListItem {
  id: string;
  numeroInterno: string;
  estado: ExpedienteEstado;
  prioridad: string;
  area: string | null;
  resumen: string | null;
  clienteNombre: string | null;
  responsableNombre: string | null;
  tipoProcedimientoNombre: string | null;
  creadoEn: Date | null;
  actualizadoEn: Date | null;
}

export interface ExpedienteDetalle extends ExpedienteListItem {
  clienteId: string | null;
  tipoProcedimientoId: string | null;
  procedimientoVersion: number | null;
  responsableId: string | null;
  cerradoEn: Date | null;
}

export interface ListarExpedientesOpts {
  q?: string;
  estado?: string;
  limit?: number;
  offset?: number;
}

/**
 * Devuelve los IDs de expedientes accesibles por el abogado (asignaciones
 * activas + permisos concedidos no revocados). Si es admin, devuelve null
 * (= sin restricción).
 */
async function idsExpedientesAccesibles(ctx: ContextoAbogado): Promise<string[] | null> {
  if (ctx.esAdmin) return null;

  const [asignados, permitidos] = await Promise.all([
    db
      .select({ id: expedienteAsignaciones.expedienteId })
      .from(expedienteAsignaciones)
      .where(
        and(
          eq(expedienteAsignaciones.abogadoId, ctx.usuarioId),
          isNull(expedienteAsignaciones.revocadaEn),
        ),
      ),
    db
      .select({ id: expedientePermisos.expedienteId })
      .from(expedientePermisos)
      .where(
        and(
          eq(expedientePermisos.abogadoId, ctx.usuarioId),
          isNull(expedientePermisos.revocadoEn),
        ),
      ),
  ]);

  const ids = new Set<string>();
  [...asignados, ...permitidos].forEach((r) => ids.add(r.id));
  return Array.from(ids);
}

/**
 * Lista expedientes con scope por abogado. El admin ve todos.
 */
export async function listarExpedientes(
  ctx: ContextoAbogado,
  opts: ListarExpedientesOpts = {},
): Promise<{ expedientes: ExpedienteListItem[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  const accesibles = await idsExpedientesAccesibles(ctx);

  // Si un abogado no tiene ningún expediente asignado ni permitido, devolvemos
  // vacío sin más consultas.
  if (accesibles !== null && accesibles.length === 0) {
    return { expedientes: [], total: 0 };
  }

  const conditions = [];
  if (accesibles !== null) {
    if (accesibles.length === 0) {
      return { expedientes: [], total: 0 };
    }
    conditions.push(inArray(expedientes.id, accesibles));
  }
  if (opts.estado) {
    // Validación defensiva del enum; si no es un estado válido, se ignora.
    conditions.push(eq(expedientes.estado, opts.estado as ExpedienteEstado));
  }
  if (opts.q) {
    const term = `%${opts.q}%`;
    conditions.push(
      or(
        ilike(expedientes.numeroInterno, term),
        ilike(expedientes.resumen, term),
        ilike(clientes.nombre, term),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: expedientes.id,
        numeroInterno: expedientes.numeroInterno,
        estado: expedientes.estado,
        prioridad: expedientes.prioridad,
        area: expedientes.area,
        resumen: expedientes.resumen,
        creadoEn: expedientes.creadoEn,
        actualizadoEn: expedientes.actualizadoEn,
        clienteNombre: clientes.nombre,
        responsableNombre: usuarios.nombre,
        tipoProcedimientoNombre: tiposProcedimiento.nombre,
      })
      .from(expedientes)
      .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
      .leftJoin(usuarios, eq(expedientes.responsableId, usuarios.id))
      .leftJoin(tiposProcedimiento, eq(expedientes.tipoProcedimientoId, tiposProcedimiento.id))
      .where(where)
      .orderBy(desc(expedientes.actualizadoEn), desc(expedientes.creadoEn))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(expedientes)
      .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
      .where(where),
  ]);

  return {
    expedientes: rows.map((r) => ({
      id: r.id,
      numeroInterno: r.numeroInterno,
      estado: r.estado,
      prioridad: r.prioridad,
      area: r.area,
      resumen: r.resumen,
      clienteNombre: r.clienteNombre,
      responsableNombre: r.responsableNombre,
      tipoProcedimientoNombre: r.tipoProcedimientoNombre,
      creadoEn: r.creadoEn,
      actualizadoEn: r.actualizadoEn,
    })),
    total: countRow?.total ?? 0,
  };
}

/**
 * Verifica que el abogado tiene acceso a un expediente (asignación o permiso).
 * El admin siempre tiene acceso. Lanza error si no.
 */
export async function verificarAccesoExpediente(
  expedienteId: string,
  ctx: ContextoAbogado,
): Promise<boolean> {
  if (ctx.esAdmin) return true;

  const accesibles = await idsExpedientesAccesibles(ctx);
  return accesibles?.includes(expedienteId) ?? false;
}

export interface ExpedienteDetalleCompleto extends ExpedienteDetalle {
  requisitos: RequisitoExpedienteItem[];
  historial: HistorialItem[];
}

export interface RequisitoExpedienteItem {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  orden: number | null;
  confirmado: boolean | null;
}

export interface HistorialItem {
  id: string;
  accion: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  actorTipo: string;
  mensaje: string | null;
  creadoEn: Date | null;
  actorNombre: string | null;
}

/**
 * Obtiene el detalle completo de un expediente si el abogado tiene acceso.
 * Incluye checklist (requisitos) e historial (línea de tiempo).
 */
export async function obtenerExpediente(
  expedienteId: string,
  ctx: ContextoAbogado,
): Promise<ExpedienteDetalleCompleto | null> {
  const tieneAcceso = await verificarAccesoExpediente(expedienteId, ctx);
  if (!tieneAcceso) return null;

  const [base] = await db
    .select({
      id: expedientes.id,
      numeroInterno: expedientes.numeroInterno,
      estado: expedientes.estado,
      prioridad: expedientes.prioridad,
      area: expedientes.area,
      resumen: expedientes.resumen,
      creadoEn: expedientes.creadoEn,
      actualizadoEn: expedientes.actualizadoEn,
      cerradoEn: expedientes.cerradoEn,
      clienteId: expedientes.clienteId,
      clienteNombre: clientes.nombre,
      tipoProcedimientoId: expedientes.tipoProcedimientoId,
      tipoProcedimientoNombre: tiposProcedimiento.nombre,
      procedimientoVersion: expedientes.procedimientoVersion,
      responsableId: expedientes.responsableId,
      responsableNombre: usuarios.nombre,
    })
    .from(expedientes)
    .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
    .leftJoin(tiposProcedimiento, eq(expedientes.tipoProcedimientoId, tiposProcedimiento.id))
    .leftJoin(usuarios, eq(expedientes.responsableId, usuarios.id))
    .where(eq(expedientes.id, expedienteId));

  if (!base) return null;

  const [requisitos, historial] = await Promise.all([
    db
      .select({
        id: requisitosExpediente.id,
        nombre: requisitosExpediente.nombre,
        tipo: requisitosExpediente.tipo,
        estado: requisitosExpediente.estado,
        orden: requisitosExpediente.orden,
        confirmado: requisitosExpediente.confirmado,
      })
      .from(requisitosExpediente)
      .where(eq(requisitosExpediente.expedienteId, expedienteId))
      .orderBy(asc(requisitosExpediente.orden), asc(requisitosExpediente.creadoEn)),
    db
      .select({
        id: historialExpediente.id,
        accion: historialExpediente.accion,
        estadoAnterior: historialExpediente.estadoAnterior,
        estadoNuevo: historialExpediente.estadoNuevo,
        actorTipo: historialExpediente.actorTipo,
        mensaje: historialExpediente.mensaje,
        creadoEn: historialExpediente.creadoEn,
        actorNombre: usuarios.nombre,
      })
      .from(historialExpediente)
      .leftJoin(usuarios, eq(historialExpediente.actorId, usuarios.id))
      .where(eq(historialExpediente.expedienteId, expedienteId))
      .orderBy(desc(historialExpediente.creadoEn)),
  ]);

  return {
    ...base,
    requisitos,
    historial,
  };
}

export interface CrearExpedienteInput {
  numeroInterno: string;
  clienteId?: string;
  tipoProcedimientoId?: string;
  responsableId: string;
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  area?: string;
  resumen?: string;
  /**
   * Requisitos iniciales del checklist. Si se omite y se pasa `tipoProcedimientoId`,
   * se podrá sembrar desde la definición del procedimiento (futura fase; por ahora
   * se instancian los que vengan en este array).
   */
  requisitosIniciales?: Array<{ nombre: string; tipo?: 'obligatorio' | 'opcional' | 'condicional'; orden?: number }>;
}

/**
 * Crea un expediente y deja todo inicializado en una operación coherente:
 * 1. Inserta el expediente (estado `creado`).
 * 2. Asigna al responsable (rol `responsable`).
 * 3. Instancia los requisitos del checklist.
 * 4. Registra la entrada inicial en el historial.
 *
 * Devuelve el id creado. El estado crítico posterior lo cambia el abogado.
 */
export async function crearExpediente(
  input: CrearExpedienteInput,
  ctx: ContextoAbogado,
): Promise<{ id: string; numeroInterno: string }> {
  const procedimientoVersion: number | null = await (async () => {
    if (!input.tipoProcedimientoId) return null;
    const [tp] = await db
      .select({ version: tiposProcedimiento.version })
      .from(tiposProcedimiento)
      .where(eq(tiposProcedimiento.id, input.tipoProcedimientoId));
    return tp?.version ?? null;
  })();

  const [exp] = await db
    .insert(expedientes)
    .values({
      numeroInterno: input.numeroInterno,
      clienteId: input.clienteId ?? null,
      tipoProcedimientoId: input.tipoProcedimientoId ?? null,
      procedimientoVersion,
      responsableId: input.responsableId,
      estado: 'creado',
      prioridad: input.prioridad ?? 'media',
      area: input.area ?? null,
      resumen: input.resumen ?? null,
      creadoPor: ctx.usuarioId,
    })
    .returning({ id: expedientes.id, numeroInterno: expedientes.numeroInterno });

  if (!exp) throw new Error('No se pudo crear el expediente');

  // Asignación responsable.
  await db.insert(expedienteAsignaciones).values({
    expedienteId: exp.id,
    abogadoId: input.responsableId,
    rol: 'responsable',
    asignadoPor: ctx.usuarioId,
  });

  // Checklist inicial.
  //
  // Prioridad de fuentes (Sprint 0 — instanciación desde procedimiento):
  //   1. Si el caller pasa `requisitosIniciales` explícitos, se usan (compat
  //      hacia atrás con tests y con cualquier caller que los fije).
  //   2. Si no, y se pasó `tipoProcedimientoId`, se cargan los requisitos desde
  //      la `definicion` del procedimiento vigente (documentosRequeridos/
  //      Opcionales/Condicionales). No se inventan requisitos: si la definición
  //      no los define, el expediente nace sin checklist y el abogado lo
  //      completa después.
  let requisitosFinales: Array<{ nombre: string; tipo?: 'obligatorio' | 'opcional' | 'condicional'; orden?: number }> =
    input.requisitosIniciales ?? [];

  if (requisitosFinales.length === 0 && input.tipoProcedimientoId) {
    const [tp] = await db
      .select({ definicion: tiposProcedimiento.definicion })
      .from(tiposProcedimiento)
      .where(eq(tiposProcedimiento.id, input.tipoProcedimientoId));
    requisitosFinales = extraerRequisitosDeDefinicion(tp?.definicion);
  }

  if (requisitosFinales.length > 0) {
    await db.insert(requisitosExpediente).values(
      requisitosFinales.map((r, i) => ({
        expedienteId: exp.id,
        nombre: r.nombre,
        tipo: r.tipo ?? 'obligatorio',
        orden: r.orden ?? i,
      })),
    );
  }

  // Historial inicial.
  await db.insert(historialExpediente).values({
    expedienteId: exp.id,
    accion: 'expediente_creado',
    estadoNuevo: 'creado',
    actorId: ctx.usuarioId,
    actorTipo: ctx.esAdmin ? 'admin' : 'abogado',
    mensaje: 'Expediente creado',
  });

  return exp;
}

/**
 * Mapa de transiciones de estado permitidas. Las transiciones críticas
 * (`validado` y posteriores) sólo las puede ejecutar el abogado; el caller
 * debe pasar `actorTipo='abogado'|'admin'` para ellas.
 */
export function transicionPermitida(
  desde: ExpedienteEstado,
  hacia: ExpedienteEstado,
  actorTipo: 'abogado' | 'admin' | 'sistema',
): boolean {
  // Transiciones prohibidas para el sistema.
  const haciaCritico = EXPEDIENTE_ESTADOS_CRITICOS.has(hacia);
  if (haciaCritico && actorTipo === 'sistema') return false;

  // Mapa de adyacencia (simplificado; ampliable). No es restrictivo más allá
  // de las críticas: permite flexibilidad operativa controlada por el abogado.
  const permitidas: Record<string, string[]> = {
    creado: ['pendiente_de_checklist', 'pendiente_de_documentos'],
    pendiente_de_checklist: ['pendiente_de_documentos'],
    pendiente_de_documentos: ['enlace_enviado', 'documentos_parcialmente_recibidos'],
    enlace_enviado: ['documentos_parcialmente_recibidos', 'documentos_completos'],
    documentos_parcialmente_recibidos: ['documentos_completos', 'enlace_enviado'],
    documentos_completos: ['analisis_pendiente'],
    analisis_pendiente: ['analisis_completado', 'inconsistencias_detectadas'],
    analisis_completado: ['pendiente_validacion_abogado', 'inconsistencias_detectadas'],
    inconsistencias_detectadas: ['pendiente_validacion_abogado', 'analisis_pendiente'],
    pendiente_validacion_abogado: ['validado', 'analisis_pendiente'],
    validado: ['pendiente_de_firma'],
    pendiente_de_firma: ['en_tramite', 'validado'],
    en_tramite: ['en_seguimiento'],
    en_seguimiento: ['finalizado', 'en_tramite'],
    finalizado: ['archivado'],
    archivado: [],
  };

  const destinos = permitidas[desde] ?? [];
  return destinos.includes(hacia);
}

/**
 * Cambia el estado de un expediente. Verifica scope, transición permitida y
 * restricción de actor para estados críticos. Registra historial.
 * Devuelve null si no tiene acceso; lanza si la transición no está permitida.
 */
export async function cambiarEstadoExpediente(
  expedienteId: string,
  nuevoEstado: ExpedienteEstado,
  ctx: ContextoAbogado,
): Promise<{ estadoAnterior: string; estadoNuevo: string } | null> {
  const tieneAcceso = await verificarAccesoExpediente(expedienteId, ctx);
  if (!tieneAcceso) return null;

  const [actual] = await db
    .select({ estado: expedientes.estado })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId));
  if (!actual) return null;

  const actorTipo: 'abogado' | 'admin' | 'sistema' = ctx.esAdmin ? 'admin' : 'abogado';
  if (!transicionPermitida(actual.estado, nuevoEstado, actorTipo)) {
    throw new Error(
      `Transición no permitida: ${actual.estado} → ${nuevoEstado} (actor: ${actorTipo})`,
    );
  }

  const cierre = nuevoEstado === 'finalizado' || nuevoEstado === 'archivado' ? new Date() : null;

  await db
    .update(expedientes)
    .set({ estado: nuevoEstado, actualizadoEn: new Date(), ...(cierre ? { cerradoEn: cierre } : {}) })
    .where(eq(expedientes.id, expedienteId));

  await db.insert(historialExpediente).values({
    expedienteId,
    accion: 'estado_cambiado',
    estadoAnterior: actual.estado,
    estadoNuevo: nuevoEstado,
    actorId: ctx.usuarioId,
    actorTipo,
    mensaje: `Estado: ${actual.estado} → ${nuevoEstado}`,
  });

  return { estadoAnterior: actual.estado, estadoNuevo: nuevoEstado };
}

/**
 * Confirma el checklist del expediente: marca los requisitos como confirmados
 * y pasa el expediente a `pendiente_de_documentos` (desde `creado` o
 * `pendiente_de_checklist`). Acción del abogado (no sistema).
 */
export async function confirmarChecklist(
  expedienteId: string,
  ctx: ContextoAbogado,
): Promise<{ ok: boolean } | null> {
  const tieneAcceso = await verificarAccesoExpediente(expedienteId, ctx);
  if (!tieneAcceso) return null;

  const actorTipo: 'abogado' | 'admin' = ctx.esAdmin ? 'admin' : 'abogado';

  await db
    .update(requisitosExpediente)
    .set({ confirmado: true, actualizadoEn: new Date() })
    .where(eq(requisitosExpediente.expedienteId, expedienteId));

  await cambiarEstadoExpediente(expedienteId, 'pendiente_de_documentos', ctx);

  await db.insert(historialExpediente).values({
    expedienteId,
    accion: 'checklist_confirmado',
    actorId: ctx.usuarioId,
    actorTipo,
    mensaje: 'Checklist confirmado por el abogado',
  });

  return { ok: true };
}

/**
 * Genera un número interno único para un nuevo expediente.
 * Formano sugerido: SGIE-YYYY-NNNNNN (secuencia por año).
 * No es normativo; el despacho puede ajustar el prefijo.
 */
export async function generarNumeroInterno(): Promise<string> {
  const year = new Date().getFullYear();
  // Conteo de expedientes del año actual como base de secuencia.
  const [row] = await db
    .select({ n: count() })
    .from(expedientes)
    .where(sql`EXTRACT(YEAR FROM ${expedientes.creadoEn}) = ${year}`);
  const seq = (Number(row?.n ?? 0) + 1).toString().padStart(4, '0');
  // Añade un sufijo aleatorio corto para reducir colisiones en concurrencia.
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `SGIE-${year}-${seq}-${suffix}`;
}
