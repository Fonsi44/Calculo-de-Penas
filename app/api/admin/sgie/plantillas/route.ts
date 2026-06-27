import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import {
  listarPlantillas,
  interpolarPlantilla,
  obtenerPlantillaPorSlug,
} from '@/lib/sgie/correos-db';

const previewSchema = z.object({
  plantillaSlug: z.string().min(1).max(100),
  variables: z.record(z.string(), z.string()).default({}),
});

const querySchema = z.object({
  estado: z.enum(['borrador', 'activa', 'desactivada']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    if (auth.rol !== 'admin') {
      return Response.json({ error: 'Solo administradores' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const { plantillas, total } = await listarPlantillas({
      estado: query.estado,
      q: query.q,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
    return Response.json({ plantillas, total, page: query.page, limit: query.limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAbogado(request);
    if (auth.rol !== 'admin') {
      return Response.json({ error: 'Solo administradores' }, { status: 403 });
    }
    const rl = await rateLimit(`sgie:admin:plantilla:preview:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const parsed = previewSchema.parse(await request.json());
    const plantilla = await obtenerPlantillaPorSlug(parsed.plantillaSlug);
    if (!plantilla) {
      return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }
    const { asunto, cuerpoHtml } = interpolarPlantilla(plantilla, parsed.variables as Record<string, string>);
    return Response.json({ asunto, cuerpoHtml, slug: plantilla.slug });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
