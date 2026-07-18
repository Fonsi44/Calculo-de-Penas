import { db } from '@/lib/db';
import {
  alertas,
  expedientes,
  tareas,
  documentosExpediente,
} from '@/lib/schema';
import { and, eq, desc, count, sql, lt, isNull, isNotNull, lte, or } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

export type SeveridadAlerta = 'info' | 'advertencia' | 'error' | 'critico';
export type EstadoAlerta = 'abierta' | 'en_progreso' | 'pospuesta' | 'resuelta' | 'descartada_con_motivo';

export interface AlertaItem {
  id: string;
  tipo: string;
  severidad: SeveridadAlerta;
  titulo: string;
  mensaje: string;
  expedienteId: string | null;
  propietarioId: string | null;
  vencimiento: Date | null;
  estado: EstadoAlerta;
  creadoEn: Date;
}

export async function listarAlertas(filters: {
  severidad?: string;
  estado?: string;
  expedienteId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: AlertaItem[]; total: number }> {
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = Math.max(filters.offset ?? 0, 0);

  const conditions = [];

  if (filters.severidad) {
    conditions.push(eq(alertas.severidad, filters.severidad as any));
  }

  if (filters.expedienteId) {
    conditions.push(eq(alertas.expedienteId, filters.expedienteId));
  }

  if (filters.estado === 'resuelta' || filters.estado === 'descartada_con_motivo') {
    conditions.push(eq(alertas.resuelta, true));
  } else if (filters.estado === 'abierta' || filters.estado === 'en_progreso' || filters.estado === 'pospuesta') {
    conditions.push(eq(alertas.resuelta, false));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ total: count() })
    .from(alertas)
    .where(where);

  const rows = await db
    .select()
    .from(alertas)
    .where(where)
    .orderBy(
      sql`CASE ${alertas.severidad} WHEN 'critico' THEN 0 WHEN 'error' THEN 1 WHEN 'advertencia' THEN 2 ELSE 3 END`,
      desc(alertas.creadoEn),
    )
    .limit(limit)
    .offset(offset);

  const items: AlertaItem[] = rows.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    severidad: r.severidad as SeveridadAlerta,
    titulo: r.titulo,
    mensaje: r.mensaje ?? '',
    expedienteId: r.expedienteId,
    propietarioId: null,
    vencimiento: null,
    estado: r.resuelta ? 'resuelta' : 'abierta',
    creadoEn: r.creadoEn ? new Date(r.creadoEn) : new Date(),
  }));

  return { items, total: countRow?.total ?? 0 };
}

export async function cambiarEstadoAlerta(
  alertaId: string,
  nuevoEstado: EstadoAlerta,
  motivo?: string,
  ctx?: any,
): Promise<void> {
  const [alerta] = await db
    .select()
    .from(alertas)
    .where(eq(alertas.id, alertaId))
    .limit(1);

  if (!alerta) throw new Error('Alerta no encontrada');

  const resuelta = nuevoEstado === 'resuelta' || nuevoEstado === 'descartada_con_motivo';
  const resueltaPor = resuelta ? (ctx?.usuarioId ?? '00000000-0000-0000-0000-000000000000') : null;

  await db
    .update(alertas)
    .set({
      resuelta,
      resueltaPor: resueltaPor,
      resueltaEn: resuelta ? new Date() : null,
    })
    .where(eq(alertas.id, alertaId));

  await logSgie({
    usuarioId: ctx?.usuarioId ?? '00000000-0000-0000-0000-000000000000',
    accion: 'webhook_processed',
    recurso: 'alertas',
    recursoId: alertaId,
    metadata: { estadoAnterior: alerta.resuelta ? 'resuelta' : 'abierta', estadoNuevo: nuevoEstado, motivo },
    exito: true,
  });
}

export async function generarAlertasVencimiento(): Promise<number> {
  const ahora = new Date();
  const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

  const tareasProximasVencer = await db
    .select({
      id: tareas.id,
      expedienteId: tareas.expedienteId,
      titulo: tareas.titulo,
      fechaVencimiento: tareas.fechaVencimiento,
    })
    .from(tareas)
    .where(
      and(
        eq(tareas.estado, 'pendiente'),
        lte(tareas.fechaVencimiento, en24h),
        isNotNull(tareas.fechaVencimiento),
      ),
    )
    .limit(50);

  let generadas = 0;

  for (const t of tareasProximasVencer) {
    const yaExiste = await db
      .select({ id: alertas.id })
      .from(alertas)
      .where(
        and(
          eq(alertas.expedienteId, t.expedienteId ?? ''),
          eq(alertas.tipo, 'vencimiento_tarea'),
          eq(alertas.titulo, `Tarea próxima a vencer: ${t.titulo}`),
          eq(alertas.resuelta, false),
        ),
      )
      .limit(1);

    if (yaExiste.length > 0) continue;

    await db.insert(alertas).values({
      expedienteId: t.expedienteId ?? null,
      tipo: 'vencimiento_tarea',
      severidad: 'advertencia',
      titulo: `Tarea próxima a vencer: ${t.titulo}`,
      mensaje: `La tarea "${t.titulo}" vence ${t.fechaVencimiento ? `el ${t.fechaVencimiento.toISOString().split('T')[0]}` : 'pronto'}.`,
      resuelta: false,
    });
    generadas++;
  }

  return generadas;
}

export async function generarAlertasSla(): Promise<number> {
  const ahora = new Date();

  const documentosAtascados = await db
    .select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      subidoEn: documentosExpediente.subidoEn,
    })
    .from(documentosExpediente)
    .where(
      and(
        inArray(documentosExpediente.estado, ['pendiente_abogado', 'ocr_pendiente']),
        sql`${documentosExpediente.subidoEn} < NOW() - INTERVAL '48 hours'`,
      ),
    )
    .limit(50);

  let generadas = 0;

  for (const d of documentosAtascados) {
    if (!d.expedienteId) continue;

    const yaExiste = await db
      .select({ id: alertas.id })
      .from(alertas)
      .where(
        and(
          eq(alertas.documentoId, d.id),
          eq(alertas.tipo, 'documento_sla'),
          eq(alertas.resuelta, false),
        ),
      )
      .limit(1);

    if (yaExiste.length > 0) continue;

    const horas = Math.floor((ahora.getTime() - new Date(d.subidoEn ?? '').getTime()) / 3600000);

    await db.insert(alertas).values({
      expedienteId: d.expedienteId,
      documentoId: d.id,
      tipo: 'documento_sla',
      severidad: 'advertencia',
      titulo: 'Documento excede SLA de procesamiento',
      mensaje: `Documento sin procesar desde hace ${horas}h (SLA: 48h).`,
      resuelta: false,
    });
    generadas++;
  }

  return generadas;
}

function inArray(col: any, values: string[]) {
  return sql`${col} IN (${sql.join(values.map(v => sql`${v}`), sql`, `)})`;
}

export async function generarAlertasInactividad(): Promise<number> {
  const expedientesInactivos = await db
    .select({
      id: expedientes.id,
      numeroInterno: expedientes.numeroInterno,
      actualizadoEn: expedientes.actualizadoEn,
    })
    .from(expedientes)
    .where(
      and(
        sql`${expedientes.actualizadoEn} < NOW() - INTERVAL '30 days'`,
        notIn(expedientes.estado, ['finalizado', 'archivado']),
      ),
    )
    .limit(50);

  let generadas = 0;

  for (const e of expedientesInactivos) {
    const yaExiste = await db
      .select({ id: alertas.id })
      .from(alertas)
      .where(
        and(
          eq(alertas.expedienteId, e.id),
          eq(alertas.tipo, 'inactividad'),
          eq(alertas.resuelta, false),
        ),
      )
      .limit(1);

    if (yaExiste.length > 0) continue;

    await db.insert(alertas).values({
      expedienteId: e.id,
      tipo: 'inactividad',
      severidad: 'info',
      titulo: `Expediente inactivo: ${e.numeroInterno}`,
      mensaje: `Sin actividad desde ${e.actualizadoEn ? new Date(e.actualizadoEn ?? Date.now()).toISOString().split('T')[0] : 'fecha desconocida'}.`,
      resuelta: false,
    });
    generadas++;
  }

  return generadas;
}

function notIn(col: any, values: string[]) {
  return sql`${col} NOT IN (${sql.join(values.map(v => sql`${v}`), sql`, `)})`;
}
