import { db } from '@/lib/db';
import {
  expedientes,
  tareas,
  jobsSgie,
  documentosExpediente,
  alertas,
} from '@/lib/schema';
import { and, eq, isNull, desc, sql, lt, lte, or } from 'drizzle-orm';

export interface WorkQueueItem {
  id: string;
  expedienteId: string;
  expedienteNumero: string;
  tipo: 'documento_revision' | 'comunicacion_aprobacion' | 'transicion_pendiente' | 'readiness' | 'baja_confianza' | 'contradiccion' | 'fecha_propuesta';
  titulo: string;
  prioridad: string;
  vencimiento: Date | null;
  responsable: string | null;
  estado: string;
  accion: string;
  creadoEn: Date;
}

function toDateOrNull(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toISOString' in (v as object)) return v as Date;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  return null;
}

export async function obtenerRequiereMiDecision(abogadoId: string): Promise<WorkQueueItem[]> {
  const items: WorkQueueItem[] = [];

  const [tareasPendientes, docsRevision, alertasAbiertas] = await Promise.all([
    db
      .select({
        id: tareas.id,
        expedienteId: tareas.expedienteId,
        expedienteNumero: expedientes.numeroInterno,
        titulo: tareas.titulo,
        prioridad: tareas.prioridad,
        vencimiento: tareas.fechaVencimiento,
        estado: tareas.estado,
        creadoEn: tareas.creadaEn,
      })
      .from(tareas)
      .innerJoin(expedientes, eq(tareas.expedienteId, expedientes.id))
      .where(
        and(
          eq(tareas.asignadaA, abogadoId),
          eq(tareas.estado, 'pendiente'),
          or(
            isNull(tareas.fechaVencimiento),
            lte(tareas.fechaVencimiento, sql`NOW() + INTERVAL '7 days'`),
          ),
        ),
      )
      .orderBy(desc(tareas.prioridad), tareas.fechaVencimiento)
      .limit(20),
    db
      .select({
        id: documentosExpediente.id,
        expedienteId: documentosExpediente.expedienteId,
        expedienteNumero: expedientes.numeroInterno,
        titulo: sql<string>`'Revisar documento: ' || ${documentosExpediente.nombreOriginal}`,
        estado: documentosExpediente.estado,
        creadoEn: documentosExpediente.subidoEn,
      })
      .from(documentosExpediente)
      .innerJoin(expedientes, eq(documentosExpediente.expedienteId, expedientes.id))
      .where(
        and(
          eq(documentosExpediente.estado, 'pendiente_abogado'),
          eq(expedientes.responsableId, abogadoId),
        ),
      )
      .orderBy(desc(documentosExpediente.subidoEn))
      .limit(20),
    db
      .select({
        id: alertas.id,
        expedienteId: alertas.expedienteId,
        expedienteNumero: expedientes.numeroInterno,
        titulo: alertas.titulo,
        prioridad: sql<string>`CASE WHEN ${alertas.severidad} = 'critico' THEN 'urgente' WHEN ${alertas.severidad} = 'error' THEN 'alta' ELSE 'media' END`,
        creadoEn: alertas.creadoEn,
      })
      .from(alertas)
      .innerJoin(expedientes, eq(alertas.expedienteId, expedientes.id))
      .where(
        and(
          eq(alertas.resuelta, false),
          eq(expedientes.responsableId, abogadoId),
        ),
      )
      .orderBy(desc(alertas.creadoEn))
      .limit(20),
  ]);

  for (const t of tareasPendientes) {
    if (!t.expedienteId) continue;
    items.push({
      id: `tarea-${t.id}`,
      expedienteId: t.expedienteId,
      expedienteNumero: t.expedienteNumero,
      tipo: 'readiness',
      titulo: t.titulo,
      prioridad: t.prioridad,
      vencimiento: toDateOrNull(t.vencimiento),
      responsable: null,
      estado: t.estado,
      accion: `/expedientes/${t.expedienteId}/tareas`,
      creadoEn: toDateOrNull(t.creadoEn) ?? new Date(),
    });
  }

  for (const d of docsRevision) {
    items.push({
      id: `doc-${d.id}`,
      expedienteId: d.expedienteId,
      expedienteNumero: d.expedienteNumero,
      tipo: 'documento_revision',
      titulo: d.titulo,
      prioridad: 'media',
      vencimiento: null,
      responsable: null,
      estado: d.estado,
      accion: `/expedientes/${d.expedienteId}/documentos/${d.id}`,
      creadoEn: toDateOrNull(d.creadoEn) ?? new Date(),
    });
  }

  for (const a of alertasAbiertas) {
    if (!a.expedienteId) continue;
    items.push({
      id: `alerta-${a.id}`,
      expedienteId: a.expedienteId,
      expedienteNumero: a.expedienteNumero,
      tipo: 'baja_confianza',
      titulo: a.titulo,
      prioridad: a.prioridad,
      vencimiento: null,
      responsable: null,
      estado: 'abierta',
      accion: `/expedientes/${a.expedienteId}`,
      creadoEn: toDateOrNull(a.creadoEn) ?? new Date(),
    });
  }

  items.sort((a, b) => {
    const orden: Record<string, number> = { urgente: 0, alta: 1, media: 2, baja: 3 };
    return (orden[a.prioridad] ?? 99) - (orden[b.prioridad] ?? 99);
  });

  return items.slice(0, 50);
}

export async function obtenerEsperandoTerceros(abogadoId: string): Promise<WorkQueueItem[]> {
  const items: WorkQueueItem[] = [];

  const [clientesBloqueo, docsPendientes] = await Promise.all([
    db
      .select({
        id: expedientes.id,
        expedienteNumero: expedientes.numeroInterno,
        titulo: sql<string>`'Esperando respuesta del cliente'`,
        prioridad: expedientes.prioridad,
        estado: expedientes.estado,
        creadoEn: expedientes.actualizadoEn,
      })
      .from(expedientes)
      .where(
        and(
          eq(expedientes.responsableId, abogadoId),
          eq(expedientes.estado, 'bloqueado_por_cliente'),
        ),
      )
      .orderBy(desc(expedientes.prioridad))
      .limit(10),
    db
      .select({
        id: expedientes.id,
        expedienteNumero: expedientes.numeroInterno,
        titulo: sql<string>`'Esperando documentos del cliente'`,
        prioridad: expedientes.prioridad,
        estado: expedientes.estado,
        creadoEn: expedientes.actualizadoEn,
      })
      .from(expedientes)
      .where(
        and(
          eq(expedientes.responsableId, abogadoId),
          or(
            eq(expedientes.estado, 'enlace_enviado'),
            eq(expedientes.estado, 'documentos_parcialmente_recibidos'),
          ),
        ),
      )
      .orderBy(desc(expedientes.prioridad))
      .limit(10),
  ]);

  for (const e of clientesBloqueo) {
    items.push({
      id: `bloqueo-${e.id}`,
      expedienteId: e.id,
      expedienteNumero: e.expedienteNumero,
      tipo: 'comunicacion_aprobacion',
      titulo: e.titulo,
      prioridad: e.prioridad,
      vencimiento: null,
      responsable: null,
      estado: e.estado,
      accion: `/expedientes/${e.id}`,
      creadoEn: toDateOrNull(e.creadoEn) ?? new Date(),
    });
  }

  for (const e of docsPendientes) {
    items.push({
      id: `pendiente-${e.id}`,
      expedienteId: e.id,
      expedienteNumero: e.expedienteNumero,
      tipo: 'fecha_propuesta',
      titulo: e.titulo,
      prioridad: e.prioridad,
      vencimiento: null,
      responsable: null,
      estado: e.estado,
      accion: `/expedientes/${e.id}`,
      creadoEn: toDateOrNull(e.creadoEn) ?? new Date(),
    });
  }

  return items;
}

export async function obtenerEnRiesgo(abogadoId: string): Promise<WorkQueueItem[]> {
  const ahora = new Date();
  const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
  const en48h = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);

  const [tareasVencidas, tareasProximasVencer, jobsFallidos] = await Promise.all([
    db
      .select({
        id: tareas.id,
        expedienteId: tareas.expedienteId,
        expedienteNumero: expedientes.numeroInterno,
        titulo: tareas.titulo,
        prioridad: tareas.prioridad,
        vencimiento: tareas.fechaVencimiento,
        creadaEn: tareas.creadaEn,
      })
      .from(tareas)
      .innerJoin(expedientes, eq(tareas.expedienteId, expedientes.id))
      .where(
        and(
          eq(tareas.asignadaA, abogadoId),
          eq(tareas.estado, 'pendiente'),
          lt(tareas.fechaVencimiento, ahora),
        ),
      )
      .orderBy(tareas.fechaVencimiento)
      .limit(20),
    db
      .select({
        id: tareas.id,
        expedienteId: tareas.expedienteId,
        expedienteNumero: expedientes.numeroInterno,
        titulo: tareas.titulo,
        prioridad: tareas.prioridad,
        vencimiento: tareas.fechaVencimiento,
        creadaEn: tareas.creadaEn,
      })
      .from(tareas)
      .innerJoin(expedientes, eq(tareas.expedienteId, expedientes.id))
      .where(
        and(
          eq(tareas.asignadaA, abogadoId),
          eq(tareas.estado, 'pendiente'),
          lte(tareas.fechaVencimiento, en48h),
          sql`${tareas.fechaVencimiento} > ${ahora}`,
        ),
      )
      .orderBy(tareas.fechaVencimiento)
      .limit(20),
    db
      .select({
        id: jobsSgie.id,
        refId: jobsSgie.refId,
        titulo: sql<string>`'Job fallido: ' || ${jobsSgie.tipo}`,
        creadoEn: jobsSgie.creadoEn,
      })
      .from(jobsSgie)
      .where(
        and(
          eq(jobsSgie.estado, 'fallido'),
          eq(jobsSgie.workerId, abogadoId),
        ),
      )
      .orderBy(desc(jobsSgie.creadoEn))
      .limit(10),
  ]);

  const items: WorkQueueItem[] = [];

  for (const t of tareasVencidas) {
    if (!t.expedienteId) continue;
    items.push({
      id: `vencida-${t.id}`,
      expedienteId: t.expedienteId,
      expedienteNumero: t.expedienteNumero,
      tipo: 'fecha_propuesta',
      titulo: `VENCIDA: ${t.titulo}`,
      prioridad: 'urgente',
      vencimiento: toDateOrNull(t.vencimiento),
      responsable: null,
      estado: 'vencida',
      accion: `/expedientes/${t.expedienteId}/tareas`,
      creadoEn: toDateOrNull(t.creadaEn) ?? new Date(),
    });
  }

  for (const t of tareasProximasVencer) {
    if (!t.expedienteId) continue;
    const es24h = t.vencimiento && new Date(t.vencimiento) <= en24h;
    items.push({
      id: `proxima-${t.id}`,
      expedienteId: t.expedienteId,
      expedienteNumero: t.expedienteNumero,
      tipo: 'fecha_propuesta',
      titulo: `${es24h ? 'PRÓXIMA A VENCER' : 'VENCE PRONTO'}: ${t.titulo}`,
      prioridad: es24h ? 'alta' : 'media',
      vencimiento: toDateOrNull(t.vencimiento),
      responsable: null,
      estado: 'pendiente',
      accion: `/expedientes/${t.expedienteId}/tareas`,
      creadoEn: toDateOrNull(t.creadaEn) ?? new Date(),
    });
  }

  for (const j of jobsFallidos) {
    items.push({
      id: `job-${j.id}`,
      expedienteId: j.refId ?? '',
      expedienteNumero: '',
      tipo: 'contradiccion',
      titulo: j.titulo,
      prioridad: 'alta',
      vencimiento: null,
      responsable: null,
      estado: 'fallido',
      accion: `/admin/jobs`,
      creadoEn: toDateOrNull(j.creadoEn) ?? new Date(),
    });
  }

  return items;
}

export async function obtenerTrabajoRapido(abogadoId: string): Promise<WorkQueueItem[]> {
  const items: WorkQueueItem[] = [];

  const [tareasSinVencimiento, docsRecientes] = await Promise.all([
    db
      .select({
        id: tareas.id,
        expedienteId: tareas.expedienteId,
        expedienteNumero: expedientes.numeroInterno,
        titulo: tareas.titulo,
        prioridad: tareas.prioridad,
        creadaEn: tareas.creadaEn,
      })
      .from(tareas)
      .innerJoin(expedientes, eq(tareas.expedienteId, expedientes.id))
      .where(
        and(
          eq(tareas.asignadaA, abogadoId),
          eq(tareas.estado, 'pendiente'),
          isNull(tareas.fechaVencimiento),
        ),
      )
      .orderBy(desc(tareas.prioridad), desc(tareas.creadaEn))
      .limit(10),
    db
      .select({
        id: documentosExpediente.id,
        expedienteId: documentosExpediente.expedienteId,
        expedienteNumero: expedientes.numeroInterno,
        titulo: sql<string>`'Clasificar: ' || ${documentosExpediente.nombreOriginal}`,
        creadoEn: documentosExpediente.subidoEn,
      })
      .from(documentosExpediente)
      .innerJoin(expedientes, eq(documentosExpediente.expedienteId, expedientes.id))
      .where(
        and(
          eq(documentosExpediente.estado, 'subido'),
          eq(expedientes.responsableId, abogadoId),
        ),
      )
      .orderBy(desc(documentosExpediente.subidoEn))
      .limit(10),
  ]);

  for (const t of tareasSinVencimiento) {
    if (!t.expedienteId) continue;
    items.push({
      id: `rapida-${t.id}`,
      expedienteId: t.expedienteId,
      expedienteNumero: t.expedienteNumero,
      tipo: 'readiness',
      titulo: t.titulo,
      prioridad: t.prioridad,
      vencimiento: null,
      responsable: null,
      estado: 'pendiente',
      accion: `/expedientes/${t.expedienteId}/tareas`,
      creadoEn: toDateOrNull(t.creadaEn) ?? new Date(),
    });
  }

  for (const d of docsRecientes) {
    items.push({
      id: `clasificar-${d.id}`,
      expedienteId: d.expedienteId,
      expedienteNumero: d.expedienteNumero,
      tipo: 'documento_revision',
      titulo: d.titulo,
      prioridad: 'baja',
      vencimiento: null,
      responsable: null,
      estado: 'subido',
      accion: `/expedientes/${d.expedienteId}/documentos/${d.id}`,
      creadoEn: toDateOrNull(d.creadoEn) ?? new Date(),
    });
  }

  return items;
}
