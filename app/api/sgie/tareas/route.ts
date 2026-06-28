import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { crearTarea, listarTareas } from '@/lib/sgie/tareas-db';
import type { ContextoAbogado } from '@/lib/sgie/expedientes-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const querySchema = z.object({
  expedienteId: z.string().uuid().optional(),
  estado: z.string().optional(),
  prioridad: z.string().optional(),
  asignadaA: z.string().uuid().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const createSchema = z.object({
  titulo: z.string().min(1).max(300),
  descripcion: z.string().max(2000).optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  expedienteId: z.string().uuid().optional(),
  asignadaA: z.string().uuid().optional(),
  fechaVencimiento: z.string().datetime().optional(),
});

function ctx(auth: { userId: string; rol: string }): ContextoAbogado {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

/**
 * GET /api/sgie/tareas
 *
 * Lista tareas con filtros (estado, prioridad, expediente, responsable, q) y
 * scope por abogado. Reescrito en Sprint 1 para usar la capa tareas-db y
 * soportar los nuevos filtros. Compatibilidad: los query params del Sprint 0
 * siguen funcionando.
 */
export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const { tareas, total } = await listarTareas(ctx(auth), {
      expedienteId: query.expedienteId,
      estado: query.estado,
      prioridad: query.prioridad,
      asignadaA: query.asignadaA,
      q: query.q,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return Response.json({ tareas, total, page: query.page, limit: query.limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

/**
 * POST /api/sgie/tareas
 *
 * Crea una tarea. Si se asocia un expediente, el abogado debe tener acceso.
 * Rate limit + CSRF + auditoría.
 */
export async function POST(request: Request) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:tarea:create:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const parsed = createSchema.parse(await request.json());
    const creado = await crearTarea(
      {
        titulo: parsed.titulo,
        descripcion: parsed.descripcion,
        prioridad: parsed.prioridad,
        expedienteId: parsed.expedienteId,
        asignadaA: parsed.asignadaA,
        fechaVencimiento: parsed.fechaVencimiento ? new Date(parsed.fechaVencimiento) : undefined,
      },
      ctx(auth),
    );

    await logSgie({
      usuarioId: auth.userId,
      accion: 'tarea_created',
      recurso: 'tarea',
      recursoId: creado.id,
      metadata: {
        titulo: parsed.titulo,
        expedienteId: parsed.expedienteId ?? null,
        asignadaA: parsed.asignadaA ?? null,
      },
      request,
    });

    return Response.json({ tarea: { id: creado.id } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
