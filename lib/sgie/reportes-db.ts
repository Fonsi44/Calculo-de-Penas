/**
 * SGIE — capa de datos para reportes operativos (Sprint 2, tarea 2).
 *
 * Agregaciones filtrables con scope por abogado (el admin ve todo). Devuelve
 * métricas y listados resumidos (no volcados completos de PII).
 *
 * Referencia: auditoría SGIE §4 (reportes/exportación).
 */
import { db } from '@/lib/db';
import {
  expedientes,
  clientes,
  tareas,
  documentosExpediente,
  alertas,
  enlacesMagicos,
  expedienteAsignaciones,
  expedientePermisos,
  usuarios,
  tiposProcedimiento,
} from '@/lib/schema';
import { and, count, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import type { ContextoAbogado } from './expedientes-db';

export interface FiltrosReporte {
  fechaDesde?: Date;
  fechaHasta?: Date;
  clienteId?: string;
  estado?: string;
  abogadoId?: string;
  tipoProcedimientoId?: string;
}

export interface MetricasReporte {
  expedientes: {
    total: number;
    porEstado: { estado: string; n: number }[];
    porCliente: { clienteId: string; nombre: string; n: number }[];
    porAbogado: { abogadoId: string; nombre: string; n: number }[];
    porProcedimiento: { procedimientoId: string; nombre: string; n: number }[];
    listado: {
      id: string; numeroInterno: string; estado: string; clienteNombre: string | null;
      procedimientoNombre: string | null; creadoEn: Date | null;
    }[];
  };
  tareas: {
    total: number;
    vencidas: number;
    completadas: number;
    pendientes: number;
  };
  documentos: {
    total: number;
    pendientesValidacion: number;
  };
  alertas: {
    activas: number;
    resueltas: number;
  };
  enlaces: {
    activos: number;
    expirados: number;
    revocados: number;
  };
}

/** IDs de expedientes accesibles. null = sin restricción (admin). */
async function idsAccesibles(ctx: ContextoAbogado): Promise<string[] | null> {
  if (ctx.esAdmin) return null;
  const [asig, perm] = await Promise.all([
    db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
      .where(and(eq(expedienteAsignaciones.abogadoId, ctx.usuarioId), isNull(expedienteAsignaciones.revocadaEn))),
    db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
      .where(and(eq(expedientePermisos.abogadoId, ctx.usuarioId), isNull(expedientePermisos.revocadoEn))),
  ]);
  return Array.from(new Set([...asig.map((r) => r.id), ...perm.map((r) => r.id)]));
}

/**
 * Genera el conjunto completo de métricas filtradas con scope.
 */
export async function generarReporte(
  ctx: ContextoAbogado,
  f: FiltrosReporte = {},
): Promise<MetricasReporte> {
  const accesibles = await idsAccesibles(ctx);

  // ── Expedientes ──────────────────────────────────────────────────────────
  const expConds = [];
  if (accesibles !== null) {
    if (accesibles.length === 0) {
      // Sin expedientes accesibles → reportes vacíos.
      return reporteVacio();
    }
    expConds.push(inArray(expedientes.id, accesibles));
  }
  if (f.clienteId) expConds.push(eq(expedientes.clienteId, f.clienteId));
  if (f.estado) expConds.push(eq(expedientes.estado, f.estado as never));
  if (f.tipoProcedimientoId) expConds.push(eq(expedientes.tipoProcedimientoId, f.tipoProcedimientoId));
  if (f.fechaDesde) expConds.push(gte(expedientes.creadoEn, f.fechaDesde));
  if (f.fechaHasta) expConds.push(lte(expedientes.creadoEn, f.fechaHasta));

  const expWhere = expConds.length > 0 ? and(...expConds) : undefined;

  // Filtro por abogado (responsable asignado).
  let expIdsFiltrados: string[] | null = null;
  if (f.abogadoId) {
    const asigAbogado = await db.select({ id: expedienteAsignaciones.expedienteId })
      .from(expedienteAsignaciones)
      .where(and(eq(expedienteAsignaciones.abogadoId, f.abogadoId), isNull(expedienteAsignaciones.revocadaEn)));
    expIdsFiltrados = asigAbogado.map((r) => r.id);
  }

  const whereFinal = expIdsFiltrados
    ? and(expWhere ?? sql`true`, inArray(expedientes.id, expIdsFiltrados.length > 0 ? expIdsFiltrados : ['00000000-0000-0000-0000-000000000000']))
    : expWhere;

  const [expRows, porEstado, porCliente, porProcedimiento, expListado] = await Promise.all([
    db.select({ n: count() }).from(expedientes).where(whereFinal),
    db.select({ estado: expedientes.estado, n: count() }).from(expedientes).where(whereFinal).groupBy(expedientes.estado),
    db.select({ clienteId: expedientes.clienteId, nombre: clientes.nombre, n: count() })
      .from(expedientes).leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
      .where(whereFinal).groupBy(expedientes.clienteId, clientes.nombre),
    db.select({ procedimientoId: expedientes.tipoProcedimientoId, nombre: tiposProcedimiento.nombre, n: count() })
      .from(expedientes).leftJoin(tiposProcedimiento, eq(expedientes.tipoProcedimientoId, tiposProcedimiento.id))
      .where(whereFinal).groupBy(expedientes.tipoProcedimientoId, tiposProcedimiento.nombre),
    db.select({
      id: expedientes.id, numeroInterno: expedientes.numeroInterno, estado: expedientes.estado,
      clienteNombre: clientes.nombre, procedimientoNombre: tiposProcedimiento.nombre, creadoEn: expedientes.creadoEn,
    }).from(expedientes)
      .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
      .leftJoin(tiposProcedimiento, eq(expedientes.tipoProcedimientoId, tiposProcedimiento.id))
      .where(whereFinal).limit(500),
  ]);

  // Por abogado (usa asignaciones).
  const porAbogado = accesibles === null || accesibles.length > 0
    ? await db.select({ abogadoId: expedienteAsignaciones.abogadoId, nombre: usuarios.nombre, n: count() })
        .from(expedienteAsignaciones)
        .innerJoin(usuarios, eq(expedienteAsignaciones.abogadoId, usuarios.id))
        .where(and(
          isNull(expedienteAsignaciones.revocadaEn),
          accesibles ? inArray(expedienteAsignaciones.expedienteId, accesibles) : sql`true`,
          f.abogadoId ? eq(expedienteAsignaciones.abogadoId, f.abogadoId) : sql`true`,
        ))
        .groupBy(expedienteAsignaciones.abogadoId, usuarios.nombre)
    : [];

  // ── Tareas (vinculadas a expedientes accesibles) ──────────────────────────
  const tarWhere = accesibles !== null && accesibles.length > 0
    ? inArray(tareas.expedienteId, accesibles)
    : accesibles === null ? undefined : sql`false`;
  const [tarTotal, tarVencidas, tarCompletadas, tarPendientes] = accesibles === null || accesibles.length > 0
    ? await Promise.all([
        db.select({ n: count() }).from(tareas).where(tarWhere),
        db.select({ n: count() }).from(tareas).where(and(tarWhere ?? sql`true`, lte(tareas.fechaVencimiento, new Date()), eq(tareas.estado, 'pendiente'))),
        db.select({ n: count() }).from(tareas).where(and(tarWhere ?? sql`true`, eq(tareas.estado, 'completada'))),
        db.select({ n: count() }).from(tareas).where(and(tarWhere ?? sql`true`, eq(tareas.estado, 'pendiente'))),
      ])
    : [[{ n: 0 }], [{ n: 0 }], [{ n: 0 }], [{ n: 0 }]];

  // ── Documentos ────────────────────────────────────────────────────────────
  const docWhere = accesibles !== null && accesibles.length > 0
    ? inArray(documentosExpediente.expedienteId, accesibles)
    : accesibles === null ? undefined : sql`false`;
  const [docTotal, docPendientes] = accesibles === null || accesibles.length > 0
    ? await Promise.all([
        db.select({ n: count() }).from(documentosExpediente).where(docWhere),
        db.select({ n: count() }).from(documentosExpediente)
          .where(and(docWhere ?? sql`true`, eq(documentosExpediente.estado, 'pendiente_abogado'))),
      ])
    : [[{ n: 0 }], [{ n: 0 }]];

  // ── Alertas ────────────────────────────────────────────────────────────────
  const alertWhere = accesibles !== null && accesibles.length > 0
    ? inArray(alertas.expedienteId, accesibles)
    : accesibles === null ? undefined : sql`false`;
  const [alertActivas, alertResueltas] = accesibles === null || accesibles.length > 0
    ? await Promise.all([
        db.select({ n: count() }).from(alertas).where(and(alertWhere ?? sql`true`, eq(alertas.resuelta, false))),
        db.select({ n: count() }).from(alertas).where(and(alertWhere ?? sql`true`, eq(alertas.resuelta, true))),
      ])
    : [[{ n: 0 }], [{ n: 0 }]];

  // ── Enlaces ────────────────────────────────────────────────────────────────
  const enlWhere = accesibles !== null && accesibles.length > 0
    ? inArray(enlacesMagicos.expedienteId, accesibles)
    : accesibles === null ? undefined : sql`false`;
  const [enlActivos, enlExpirados, enlRevocados] = accesibles === null || accesibles.length > 0
    ? await Promise.all([
        db.select({ n: count() }).from(enlacesMagicos).where(and(enlWhere ?? sql`true`, isNull(enlacesMagicos.revocadoEn), gte(enlacesMagicos.expiraEn, new Date()))),
        db.select({ n: count() }).from(enlacesMagicos).where(and(enlWhere ?? sql`true`, isNull(enlacesMagicos.revocadoEn), lte(enlacesMagicos.expiraEn, new Date()))),
        db.select({ n: count() }).from(enlacesMagicos).where(and(enlWhere ?? sql`true`, sql`${enlacesMagicos.revocadoEn} IS NOT NULL`)),
      ])
    : [[{ n: 0 }], [{ n: 0 }], [{ n: 0 }]];

  return {
    expedientes: {
      total: Number(expRows[0]?.n ?? 0),
      porEstado: porEstado.map((r) => ({ estado: r.estado, n: Number(r.n) })),
      porCliente: porCliente
        .filter((r) => r.clienteId !== null)
        .map((r) => ({ clienteId: r.clienteId!, nombre: r.nombre ?? '—', n: Number(r.n) }))
        .sort((a, b) => b.n - a.n),
      porAbogado: porAbogado.map((r) => ({ abogadoId: r.abogadoId, nombre: r.nombre, n: Number(r.n) })),
      porProcedimiento: porProcedimiento
        .filter((r) => r.procedimientoId !== null)
        .map((r) => ({ procedimientoId: r.procedimientoId!, nombre: r.nombre ?? '—', n: Number(r.n) })),
      listado: expListado,
    },
    tareas: {
      total: Number(tarTotal[0]?.n ?? 0),
      vencidas: Number(tarVencidas[0]?.n ?? 0),
      completadas: Number(tarCompletadas[0]?.n ?? 0),
      pendientes: Number(tarPendientes[0]?.n ?? 0),
    },
    documentos: {
      total: Number(docTotal[0]?.n ?? 0),
      pendientesValidacion: Number(docPendientes[0]?.n ?? 0),
    },
    alertas: {
      activas: Number(alertActivas[0]?.n ?? 0),
      resueltas: Number(alertResueltas[0]?.n ?? 0),
    },
    enlaces: {
      activos: Number(enlActivos[0]?.n ?? 0),
      expirados: Number(enlExpirados[0]?.n ?? 0),
      revocados: Number(enlRevocados[0]?.n ?? 0),
    },
  };
}

function reporteVacio(): MetricasReporte {
  return {
    expedientes: { total: 0, porEstado: [], porCliente: [], porAbogado: [], porProcedimiento: [], listado: [] },
    tareas: { total: 0, vencidas: 0, completadas: 0, pendientes: 0 },
    documentos: { total: 0, pendientesValidacion: 0 },
    alertas: { activas: 0, resueltas: 0 },
    enlaces: { activos: 0, expirados: 0, revocados: 0 },
  };
}
