/**
 * GET /api/sgie/buscar?q=...
 *
 * Búsqueda global con scope por abogado (clientes, expedientes, documentos,
 * tareas). Devuelve payload pequeño y homogéneo para el buscador ⌘K.
 *
 * Seguridad: `requireAbogado` + scope aplicado en buscar-db.ts.
 * Rate limit ajustado a búsquedas (más permisivo que mutaciones).
 *
 * Sprint 1 — tarea 4.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { buscar, normalizarTermino } from '@/lib/sgie/buscar-db';

const querySchema = z.object({
  q: z.string().min(1).max(200),
  porTipo: z.coerce.number().int().min(1).max(20).default(5),
});

function ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const rl = await rateLimit(`sgie:buscar:${auth.userId}`, { max: 60, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    // Si el término no es buscable, devolver vacío sin tocar la DB.
    if (!normalizarTermino(query.q)) {
      return Response.json({ resultados: [], total: 0 });
    }

    const { resultados, total } = await buscar(ctx(auth), {
      q: query.q,
      porTipo: query.porTipo,
    });

    return Response.json({ resultados, total });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
