import { db } from '@/lib/db';
import {
  jobsSgie,
  documentosExpediente,
  comunicacionesOutbox,
  correosEnviados,
  ocrResultados,
  aiTaskRouting,
  expedientes,
  usuariosSgie,
  usuarios,
  equipos,
  invitaciones,
  outboxEvents,
  deadLetterJobs,
  type UsuarioSgie,
} from '@/lib/schema';
import { eq, count, and, isNull, isNotNull, sql, desc, inArray } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

export interface DashboardIncidencias {
  jobsDlq: number;
  documentosAtascados: number;
  outboxFallidos: number;
  rebotes: number;
  ocrFallidos: number;
  iaFallidos: number;
  expedientesSinResponsable: number;
}

export interface DashboardRiesgo {
  vencimientos24h: number;
  vencimientos48h: number;
  vencimientos72h: number;
  slaIncumplidos: number;
  bloqueados: number;
  esperaCliente: number;
  revisionesAntiguas: number;
}

export interface DashboardPersonas {
  totalUsuarios: number;
  activosSgie: number;
  suspendidos: number;
  invitacionesPendientes: number;
  equipos: number;
}

export interface DashboardAutomatizacion {
  jobsPendientes: number;
  outboxPendientes: number;
  ocrRealizados: number;
  iaRealizadas: number;
  correcciones: number;
  comunicaciones: number;
  errores: number;
}

export interface DashboardSalud {
  db: boolean;
  blob: boolean;
  worker: boolean;
  cron: boolean;
  resend: boolean;
  ocr: boolean;
  ia: boolean;
  ultimaEjecucion: Date | null;
}

export async function obtenerDashboardCompleto(): Promise<{
  incidencias: DashboardIncidencias;
  riesgo: DashboardRiesgo;
  personas: DashboardPersonas;
  automatizacion: DashboardAutomatizacion;
  salud: DashboardSalud;
}> {
  const ahora = new Date();
  const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
  const en48h = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);
  const en72h = new Date(ahora.getTime() + 72 * 60 * 60 * 1000);

  const [
    [dlqCount],
    [docAtascados],
    [outboxFallidos],
    [rebotesCount],
    [ocrFallidosCount],
    [iaFallidosCount],
    [sinRespCount],
    [usersCount],
    [sgieActiveCount],
    [suspendidosCount],
    [invPendCount],
    [equiposCount],
    [jobsPendCount],
    [outboxPendCount],
    [ocrRealizadosCount],
    [iaRealizadasCount],
  ] = await Promise.all([
    db.select({ n: count() }).from(deadLetterJobs),
    db.select({ n: count() }).from(documentosExpediente).where(
      inArray(documentosExpediente.estado, ['pendiente_abogado', 'ocr_pendiente', 'ilegible', 'duplicado']),
    ),
    db.select({ n: count() }).from(outboxEvents).where(eq(outboxEvents.status, 'failed')),
    db.select({ n: count() }).from(correosEnviados).where(sql`${correosEnviados.error} LIKE '%Rebotado%'`),
    db.select({ n: count() }).from(ocrResultados).where(sql`${ocrResultados.confianza} < 0.3`),
    db.select({ n: count() }).from(aiTaskRouting).where(eq(aiTaskRouting.estado, 'failed')),
    db.select({ n: count() }).from(expedientes).where(isNull(expedientes.responsableId)),
    db.select({ n: count() }).from(usuarios),
    db.select({ n: count() }).from(usuariosSgie).where(eq(usuariosSgie.activoSgie, true)),
    db.select({ n: count() }).from(usuarios).where(eq(usuarios.bloqueado, true)),
    db.select({ n: count() }).from(invitaciones).where(eq(invitaciones.estado, 'pendiente')),
    db.select({ n: count() }).from(equipos),
    db.select({ n: count() }).from(jobsSgie).where(eq(jobsSgie.estado, 'pendiente')),
    db.select({ n: count() }).from(outboxEvents).where(eq(outboxEvents.status, 'pending')),
    db.select({ n: count() }).from(ocrResultados),
    db.select({ n: count() }).from(aiTaskRouting).where(eq(aiTaskRouting.estado, 'completed')),
  ]);

  const expedientesBloqueados = await db
    .select({ n: count() })
    .from(expedientes)
    .where(eq(expedientes.estado, 'bloqueado_por_cliente'));

  const revisionesAntiguas = await db
    .select({ n: count() })
    .from(documentosExpediente)
    .where(
      and(
        eq(documentosExpediente.estado, 'pendiente_abogado'),
        sql`${documentosExpediente.subidoEn} < NOW() - INTERVAL '7 days'`,
      ),
    );

  const [ultimoJob] = await db
    .select({ completadoEn: jobsSgie.completadoEn })
    .from(jobsSgie)
    .where(and(eq(jobsSgie.estado, 'completado'), isNotNull(jobsSgie.completadoEn)))
    .orderBy(desc(jobsSgie.completadoEn))
    .limit(1);

  return {
    incidencias: {
      jobsDlq: Number(dlqCount?.n ?? 0),
      documentosAtascados: Number(docAtascados?.n ?? 0),
      outboxFallidos: Number(outboxFallidos?.n ?? 0),
      rebotes: Number(rebotesCount?.n ?? 0),
      ocrFallidos: Number(ocrFallidosCount?.n ?? 0),
      iaFallidos: Number(iaFallidosCount?.n ?? 0),
      expedientesSinResponsable: Number(sinRespCount?.n ?? 0),
    },
    riesgo: {
      vencimientos24h: 0,
      vencimientos48h: 0,
      vencimientos72h: 0,
      slaIncumplidos: 0,
      bloqueados: Number(expedientesBloqueados?.[0]?.n ?? 0),
      esperaCliente: 0,
      revisionesAntiguas: Number(revisionesAntiguas?.[0]?.n ?? 0),
    },
    personas: {
      totalUsuarios: Number(usersCount?.n ?? 0),
      activosSgie: Number(sgieActiveCount?.n ?? 0),
      suspendidos: Number(suspendidosCount?.n ?? 0),
      invitacionesPendientes: Number(invPendCount?.n ?? 0),
      equipos: Number(equiposCount?.n ?? 0),
    },
    automatizacion: {
      jobsPendientes: Number(jobsPendCount?.n ?? 0),
      outboxPendientes: Number(outboxPendCount?.n ?? 0),
      ocrRealizados: Number(ocrRealizadosCount?.n ?? 0),
      iaRealizadas: Number(iaRealizadasCount?.n ?? 0),
      correcciones: 0,
      comunicaciones: 0,
      errores: Number(iaFallidosCount?.n ?? 0) + Number(outboxFallidos?.n ?? 0) + Number(dlqCount?.n ?? 0),
    },
    salud: {
      db: Boolean(process.env.DATABASE_URL),
      blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      worker: Boolean(ultimoJob?.completadoEn),
      cron: Boolean(process.env.CRON_SECRET),
      resend: Boolean(process.env.RESEND_API_KEY),
      ocr: (process.env.OCR_PROVIDER ?? 'stub') !== 'stub',
      ia: Boolean(process.env.DEEPSEEK_API_KEY),
      ultimaEjecucion: ultimoJob?.completadoEn ? new Date(ultimoJob.completadoEn) : null,
    },
  };
}

export async function reintentarJobDlq(jobId: string): Promise<void> {
  const [dlq] = await db
    .select()
    .from(deadLetterJobs)
    .where(eq(deadLetterJobs.id, jobId))
    .limit(1);

  if (!dlq) throw new Error('Job en DLQ no encontrado');

  await db.transaction(async (tx) => {
    const [nuevoJob] = await tx
      .insert(jobsSgie)
      .values({
        tipo: dlq.tipo as any,
        refId: dlq.refId ?? null,
        payload: (dlq.payload as Record<string, unknown>) ?? null,
        estado: 'pendiente',
        intentos: 0,
        maxIntentos: 3,
      })
      .returning({ id: jobsSgie.id });

    await tx
      .delete(deadLetterJobs)
      .where(eq(deadLetterJobs.id, jobId));

    await logSgie({
      usuarioId: '00000000-0000-0000-0000-000000000000',
      accion: 'job_requeued',
      recurso: 'dead_letter_jobs',
      recursoId: jobId,
      metadata: { nuevoJobId: nuevoJob?.id, tipo: dlq.tipo },
      exito: true,
    });
  });
}

export async function cancelarJob(jobId: string): Promise<void> {
  const [job] = await db
    .select({ id: jobsSgie.id })
    .from(jobsSgie)
    .where(eq(jobsSgie.id, jobId))
    .limit(1);

  if (!job) throw new Error('Job no encontrado');

  await db
    .update(jobsSgie)
    .set({ estado: 'cancelado', lockedAt: null, lockExpiresAt: null, workerId: null })
    .where(eq(jobsSgie.id, jobId));

  await logSgie({
    usuarioId: '00000000-0000-0000-0000-000000000000',
    accion: 'job_failed',
    recurso: 'jobs_sgie',
    recursoId: jobId,
    metadata: { motivo: 'cancelado_por_admin' },
    exito: true,
  });
}

export async function reasignarExpediente(
  expedienteId: string,
  nuevoResponsableId: string,
  ctx: any,
): Promise<void> {
  const [exp] = await db
    .select({ id: expedientes.id })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId))
    .limit(1);

  if (!exp) throw new Error('Expediente no encontrado');

  await db
    .update(expedientes)
    .set({ responsableId: nuevoResponsableId, actualizadoEn: new Date() })
    .where(eq(expedientes.id, expedienteId));

  await logSgie({
    usuarioId: ctx?.usuarioId ?? '00000000-0000-0000-0000-000000000000',
    accion: 'expediente_updated',
    recurso: 'expediente',
    recursoId: expedienteId,
    metadata: { nuevoResponsableId },
    exito: true,
  });
}
