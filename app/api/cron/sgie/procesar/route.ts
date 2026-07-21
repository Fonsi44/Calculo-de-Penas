import {
  reclamarJobs,
  completarJob,
  fallarJob,
  recuperarLocksAbandonados,
  registrarIntento,
  obtenerMetricas,
} from '@/lib/sgie/jobs-db';
import { despacharEventos, recuperarEventosBloqueados, obtenerMetricasOutbox } from '@/lib/sgie/outbox';
import { procesarDocumento } from '@/lib/sgie/motor-documental';
import { procesarDocumentoConIa, isIaEnabled } from '@/lib/sgie/ia-documental';
import { procesarRecordatoriosPendientes } from '@/lib/sgie/motor-recordatorios';
import { reconcileStaleEnvelopes } from '@/lib/sgie/signature-service';
import { randomUUID } from 'crypto';

const LOTE = 5;
const WORKER_ID = 'cron-sgie';

function correlationId(): string {
  return `cron-${randomUUID().slice(0, 8)}`;
}

function autorizado(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.trim().length === 0) return false;
  const auth = request.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret.trim()}`;
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!process.env.CRON_SECRET) {
    return Response.json({ error: 'CRON_SECRET no está configurado en el servidor' }, { status: 500 });
  }

  const cid = correlationId();
  const t0 = Date.now();

  try {
    const locksRecuperados = await recuperarLocksAbandonados(15);

    const jobs = await reclamarJobs(`${WORKER_ID}-${cid}`, LOTE);
    let procesados = 0;
    let fallidos = 0;
    const resultados: Array<{ jobId: string; tipo: string; estadoFinal: string; error?: string }> = [];

    for (const job of jobs) {
      try {
        await registrarIntento(job.id, (job.intentos ?? 0) + 1, undefined, undefined, cid);

        const documentoId = job.refId;
        if (!documentoId) {
          await fallarJob(job.id, 'Job sin refId', 'MISSING_REF_ID', cid);
          fallidos++;
          resultados.push({ jobId: job.id, tipo: job.tipo, estadoFinal: 'error', error: 'Sin refId' });
          continue;
        }

        if (job.tipo === 'extraccion_texto' || job.tipo === 'clasificacion') {
          const resultado = await procesarDocumento(documentoId);
          if (resultado.error) {
            await fallarJob(job.id, resultado.error, 'PROCESSING_ERROR', cid);
            fallidos++;
          } else {
            await completarJob(job.id, cid);
            procesados++;
          }
          resultados.push({
            jobId: job.id,
            tipo: job.tipo,
            estadoFinal: resultado.estadoFinal,
            error: resultado.error,
          });
        } else if (job.tipo === 'ia_extraccion') {
          if (!isIaEnabled()) {
            await fallarJob(job.id, 'IA no configurada', 'IA_NOT_CONFIGURED', cid);
            fallidos++;
            resultados.push({ jobId: job.id, tipo: job.tipo, estadoFinal: 'error', error: 'IA no configurada' });
            continue;
          }
          const meta = (job.payload as Record<string, unknown> | null) ?? {};
          const textoExtraido = typeof meta.textoExtraido === 'string' ? meta.textoExtraido : '';
          const tipoHeuristico = typeof meta.tipoHeuristico === 'string' ? meta.tipoHeuristico : undefined;
          const confianzaHeuristica = typeof meta.confianzaHeuristica === 'number' ? meta.confianzaHeuristica : undefined;
          const iaResult = await procesarDocumentoConIa(
            documentoId,
            textoExtraido,
            tipoHeuristico && confianzaHeuristica !== undefined
              ? { tipoDocumento: tipoHeuristico, confianza: confianzaHeuristica }
              : undefined,
          );
          if (!iaResult.exito && iaResult.error) {
            await fallarJob(job.id, iaResult.error, 'IA_ERROR', cid);
            fallidos++;
          } else {
            await completarJob(job.id, cid);
            procesados++;
          }
          resultados.push({ jobId: job.id, tipo: job.tipo, estadoFinal: iaResult.estadoFinal, error: iaResult.error });
        } else if (job.tipo === 'correo_envio' || job.tipo === 'recordatorio') {
          await completarJob(job.id, cid);
          procesados++;
          resultados.push({ jobId: job.id, tipo: job.tipo, estadoFinal: 'completado' });
        } else {
          await completarJob(job.id, cid);
          procesados++;
          resultados.push({ jobId: job.id, tipo: job.tipo, estadoFinal: 'completado' });
        }
      } catch (err) {
        await fallarJob(job.id, (err as Error).message, 'UNEXPECTED_ERROR', cid);
        fallidos++;
        resultados.push({ jobId: job.id, tipo: job.tipo, estadoFinal: 'error', error: (err as Error).message });
      }
    }

    const eventosBloqueados = await recuperarEventosBloqueados();
    const { despachados } = await despacharEventos(LOTE);

    let recordatorios = null;
    try {
      recordatorios = await procesarRecordatoriosPendientes();
    } catch (err) {
      recordatorios = {
        revisados: 0,
        recordatoriosEnviados: 0,
        avisosBloqueo: 0,
        bloqueados: 0,
        errores: [`motor recordatorios: ${(err as Error).message}`],
      };
    }

    const metricasJobs = await obtenerMetricas();
    const metricasOutbox = await obtenerMetricasOutbox();

    // P2-09: reconciliar envelopes de firma estancados
    const signatureReconciled = await reconcileStaleEnvelopes();

    return Response.json({
      ok: true,
      correlationId: cid,
      duracionMs: Date.now() - t0,
      jobs: {
        procesados,
        fallidos,
        locksRecuperados,
        resultados,
        metricas: metricasJobs,
      },
      outbox: {
        despachados,
        eventosBloqueadosRecuperados: eventosBloqueados,
        metricas: metricasOutbox,
      },
      recordatorios,
      signature: signatureReconciled,
    });
  } catch (err) {
    return Response.json({
      ok: false,
      error: (err as Error).message,
      correlationId: cid,
      duracionMs: Date.now() - t0,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
