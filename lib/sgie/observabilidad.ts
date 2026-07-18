/**
 * SGIE — Métricas operativas y estado de integraciones (Fase 2).
 *
 * Consultas de solo lectura sobre el estado actual del sistema:
 * jobs, outbox, documentos, comunicaciones y workers.
 * No realiza mutaciones.
 */
import { db } from '@/lib/db';
import { jobsSgie, comunicacionesOutbox, documentosExpediente, correosEnviados, deadLetterJobs } from '@/lib/schema';
import { eq, count, desc, isNotNull, sql } from 'drizzle-orm';
import { getIaConfig } from '@/lib/sgie/ia-documental';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface MetricasOperativas {
  jobs: {
    pendientes: number;
    en_proceso: number;
    fallidos: number;
    completados: number;
    dead_letter: number;
    mas_antiguo_minutos: number | null;
  };
  outbox: {
    pendientes: number;
    fallidos: number;
    completados: number;
  };
  documentos: {
    recibidos: number;
    pendientes: number;
    procesando: number;
    revision_requerida: number;
    procesados: number;
    fallidos: number;
  };
  comunicaciones: {
    pendientes: number;
    enviadas: number;
    retrasadas: number;
    rebotadas: number;
    fallidas: number;
    canceladas: number;
  };
  workers: {
    ultima_ejecucion: string | null;
    configurado: boolean;
  };
}

export interface EstadoIntegraciones {
  ocr: { configurado: boolean; proveedor: string };
  ia: { configurado: boolean; modo: string };
  resend: { configurado: boolean };
  blob: { configurado: boolean };
}

// ─── Métricas operativas ─────────────────────────────────────────────────────

export async function obtenerMetricasOperativas(): Promise<MetricasOperativas> {
  const [jobsCounts] = await db
    .select({
      pendientes: sql<number>`COALESCE(SUM(CASE WHEN ${jobsSgie.estado} = 'pendiente' THEN 1 ELSE 0 END), 0)`,
      en_proceso: sql<number>`COALESCE(SUM(CASE WHEN ${jobsSgie.estado} = 'en_proceso' THEN 1 ELSE 0 END), 0)`,
      fallidos: sql<number>`COALESCE(SUM(CASE WHEN ${jobsSgie.estado} = 'fallido' THEN 1 ELSE 0 END), 0)`,
      completados: sql<number>`COALESCE(SUM(CASE WHEN ${jobsSgie.estado} = 'completado' THEN 1 ELSE 0 END), 0)`,
    })
    .from(jobsSgie);

  const [deadLetterCount] = await db
    .select({ total: count() })
    .from(deadLetterJobs);

  const [jobMasAntiguo] = await db
    .select({ creadoEn: jobsSgie.creadoEn })
    .from(jobsSgie)
    .where(eq(jobsSgie.estado, 'pendiente'))
    .orderBy(jobsSgie.creadoEn)
    .limit(1);

  const [outboxCounts] = await db
    .select({
      pendientes: sql<number>`COALESCE(SUM(CASE WHEN ${comunicacionesOutbox.estado} = 'pending' THEN 1 ELSE 0 END), 0)`,
      fallidos: sql<number>`COALESCE(SUM(CASE WHEN ${comunicacionesOutbox.estado} = 'failed' THEN 1 ELSE 0 END), 0)`,
      completados: sql<number>`COALESCE(SUM(CASE WHEN ${comunicacionesOutbox.estado} = 'sent' THEN 1 ELSE 0 END), 0)`,
    })
    .from(comunicacionesOutbox);

  const [docCounts] = await db
    .select({
      recibidos: sql<number>`COALESCE(SUM(CASE WHEN ${documentosExpediente.estado} IN ('subido','clasificando') THEN 1 ELSE 0 END), 0)`,
      pendientes: sql<number>`COALESCE(SUM(CASE WHEN ${documentosExpediente.estado} IN ('ocr_pendiente','clasificado','texto_extraido') THEN 1 ELSE 0 END), 0)`,
      revision_requerida: sql<number>`COALESCE(SUM(CASE WHEN ${documentosExpediente.estado} IN ('pendiente_abogado','pendiente_validacion_abogado') THEN 1 ELSE 0 END), 0)`,
      procesados: sql<number>`COALESCE(SUM(CASE WHEN ${documentosExpediente.estado} = 'ia_procesada' THEN 1 ELSE 0 END), 0)`,
    })
    .from(documentosExpediente);

  const [commsCounts] = await db
    .select({
      pendientes: sql<number>`COALESCE(SUM(CASE WHEN ${correosEnviados.estado} = 'pendiente' THEN 1 ELSE 0 END), 0)`,
      enviadas: sql<number>`COALESCE(SUM(CASE WHEN ${correosEnviados.estado} = 'enviado' THEN 1 ELSE 0 END), 0)`,
      fallidas: sql<number>`COALESCE(SUM(CASE WHEN ${correosEnviados.estado} = 'fallido' THEN 1 ELSE 0 END), 0)`,
    })
    .from(correosEnviados);

  const masAntiguoMinutos = jobMasAntiguo?.creadoEn
    ? Math.floor((Date.now() - new Date(jobMasAntiguo.creadoEn).getTime()) / 60000)
    : null;

  // Workers: ver si hay jobs recientes completados
  const [ultimoJob] = await db
    .select({ completadoEn: jobsSgie.completadoEn })
    .from(jobsSgie)
    .where(isNotNull(jobsSgie.completadoEn))
    .orderBy(desc(jobsSgie.completadoEn))
    .limit(1);

  return {
    jobs: {
      pendientes: Number(jobsCounts?.pendientes ?? 0),
      en_proceso: Number(jobsCounts?.en_proceso ?? 0),
      fallidos: Number(jobsCounts?.fallidos ?? 0),
      completados: Number(jobsCounts?.completados ?? 0),
      dead_letter: Number(deadLetterCount?.total ?? 0),
      mas_antiguo_minutos: masAntiguoMinutos,
    },
    outbox: {
      pendientes: Number(outboxCounts?.pendientes ?? 0),
      fallidos: Number(outboxCounts?.fallidos ?? 0),
      completados: Number(outboxCounts?.completados ?? 0),
    },
    documentos: {
      recibidos: Number(docCounts?.recibidos ?? 0),
      pendientes: Number(docCounts?.pendientes ?? 0),
      procesando: 0,
      revision_requerida: Number(docCounts?.revision_requerida ?? 0),
      procesados: Number(docCounts?.procesados ?? 0),
      fallidos: 0,
    },
    comunicaciones: {
      pendientes: Number(commsCounts?.pendientes ?? 0),
      enviadas: Number(commsCounts?.enviadas ?? 0),
      retrasadas: 0,
      rebotadas: 0,
      fallidas: Number(commsCounts?.fallidas ?? 0),
      canceladas: 0,
    },
    workers: {
      ultima_ejecucion: ultimoJob?.completadoEn
        ? new Date(ultimoJob.completadoEn).toISOString()
        : null,
      configurado: Boolean(process.env.DATABASE_URL),
    },
  };
}

// ─── Estado de integraciones ─────────────────────────────────────────────────

export function obtenerEstadoIntegraciones(): EstadoIntegraciones {
  const iaCfg = getIaConfig();

  return {
    ocr: {
      configurado: (process.env.OCR_PROVIDER ?? 'stub') !== 'stub',
      proveedor: process.env.OCR_PROVIDER ?? 'stub',
    },
    ia: {
      configurado: iaCfg.mode !== 'disabled' && iaCfg.apiKey.length > 0,
      modo: iaCfg.mode,
    },
    resend: {
      configurado: Boolean(process.env.RESEND_API_KEY),
    },
    blob: {
      configurado: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    },
  };
}
