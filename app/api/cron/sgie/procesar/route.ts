/**
 * GET/POST /api/cron/sgie/procesar
 *
 * Endpoint para cron/worker. Procesa jobs SGIE pendientes (extracción de
 * texto, clasificación) por lotes pequeños Y los recordatorios documentales
 * (Fase 2: primer/segundo recordatorio, aviso de bloqueo, bloqueo por cliente).
 * Protegido por CRON_SECRET.
 *
 * Uso:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/sgie/procesar
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/sgie/procesar
 *
 * Recomendado en Vercel Cron: una vez al día (ej. 0 7 * * *).
 */
import { procesarJobsPendientes } from '@/lib/sgie/motor-documental';
import { procesarRecordatoriosPendientes } from '@/lib/sgie/motor-recordatorios';

const LOTE_MAX = 5;

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

  try {
    const { procesados, fallidos, resultados } = await procesarJobsPendientes(LOTE_MAX);

    // Fase 2 — recordatorios documentales (idempotente; seguro ejecutar a diario).
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

    return Response.json({
      ok: true,
      procesados,
      fallidos,
      resultados: resultados.map((r) => ({
        documentoId: r.documentoId,
        estadoFinal: r.estadoFinal,
        cacheHit: r.cacheHit,
        error: r.error,
      })),
      recordatorios,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
