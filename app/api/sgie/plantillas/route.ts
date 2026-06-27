import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import {
  listarPlantillas,
  crearPlantilla,
} from '@/lib/sgie/correos-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const querySchema = z.object({
  estado: z.enum(['borrador', 'activa', 'desactivada']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Slug solo permite minúsculas, números y guiones bajos'),
  nombre: z.string().min(1).max(200),
  asunto: z.string().min(1).max(300),
  cuerpoHtml: z.string().min(1),
  variablesPermitidas: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  try {
    requireAbogado(request);
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
      return Response.json({ error: 'Solo administradores pueden crear plantillas' }, { status: 403 });
    }
    validateCsrf(request);
    const rl = await rateLimit(`sgie:plantilla:create:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const parsed = createSchema.parse(await request.json());
    const plantilla = await crearPlantilla({ ...parsed, creadoPor: auth.userId });
    await logSgie({
      usuarioId: auth.userId,
      accion: 'plantilla_created',
      recurso: 'plantilla',
      recursoId: plantilla.id,
      metadata: { slug: parsed.slug },
      request,
    });
    return Response.json({ plantilla }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
