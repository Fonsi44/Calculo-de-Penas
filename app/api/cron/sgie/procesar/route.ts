/**
 * GET/POST /api/cron/sgie/procesar
 *
 * Endpoint para cron/worker. Procesa jobs SGIE pendientes (extracción de
 * texto, clasificación) por lotes pequeños. Protegido por CRON_SECRET.
 *
 * Uso:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/sgie/procesar
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/sgie/procesar
 */
import { procesarJobsPendientes } from '@/lib/sgie/motor-documental';

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
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
