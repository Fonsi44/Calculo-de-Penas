/**
 * GET /api/sgie/buscar?q=... — Búsqueda textual con FTS + pg_trgm (Fase 4B-5).
 * Fallback a ILIKE cuando la flag FTS está apagada.
 */
import { requireAbogado } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { buscar, normalizarTermino } from '@/lib/sgie/buscar-db';
import { searchFts } from '@/lib/sgie/search-db';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { accessService } from '@/lib/access-service';

const querySchema = z.object({
  q: z.string().min(1).max(200),
  resourceType: z.enum(['expediente','documento','cliente','tarea','evento','comunicacion']).optional(),
  expedienteId: z.string().uuid().optional(),
  cursor: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const rl = await rateLimit(`sgie:buscar:${auth.userId}`, { max: 60, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    if (!normalizarTermino(query.q)) {
      return Response.json({ results: [], total: 0, hasMore: false });
    }

    // Check FTS flag; fallback to ILIKE if off
    const ftsOn = await isFlagEnabled('sgie.retrieval.fts', {}).catch(() => false);
    if (ftsOn) {
      await accessService.assertSgieAccess(auth.userId, 'search.use');
      const result = await searchFts({
        actorUserId: auth.userId,
        query: query.q,
        resourceTypes: query.resourceType ? [query.resourceType] : undefined,
        expedienteId: query.expedienteId,
        cursor: query.cursor,
        limit: query.limit,
      });
      return Response.json(result);
    }

    // Fallback ILIKE
    const { resultados, total } = await buscar(
      { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' },
      { q: query.q, porTipo: 5 },
    );
    return Response.json({ results: resultados, total, hasMore: false });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 422 });
    }
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message?: string };
      return Response.json({ error: e.message || 'Forbidden' }, { status: e.status });
    }
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
