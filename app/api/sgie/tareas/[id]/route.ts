import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { actualizarTarea } from '@/lib/sgie/tareas-db';
import type { ContextoAbogado } from '@/lib/sgie/expedientes-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const updateSchema = z.object({
  titulo: z.string().min(1).max(300).optional(),
  descripcion: z.string().max(2000).optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  estado: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']).optional(),
  expedienteId: z.union([z.string().uuid(), z.null()]).optional(),
  asignadaA: z.union([z.string().uuid(), z.null()]).optional(),
  fechaVencimiento: z.union([z.string().datetime(), z.null()]).optional(),
});

function ctx(auth: { userId: string; rol: string }): ContextoAbogado {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

/**
 * PATCH /api/sgie/tareas/:id
 *
 * Actualiza una tarea (campos editables + estado). Requiere scope.
 * Sprint 1: antes sólo cambiaba `estado`; ahora soporta edición completa.
 * Compatibilidad: un body `{ estado }` sigue funcionando como antes.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:tarea:update:${auth.userId}`, { max: 60, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await params;
    const parsed = updateSchema.parse(await request.json());

    // Determinar acción de auditoría según el cambio.
    const esCompletar = parsed.estado === 'completada';
    const accion = esCompletar ? 'tarea_completed' : 'tarea_updated';

    await actualizarTarea(
      id,
      {
        titulo: parsed.titulo,
        descripcion: parsed.descripcion,
        prioridad: parsed.prioridad,
        estado: parsed.estado,
        expedienteId: parsed.expedienteId === undefined ? undefined : parsed.expedienteId,
        asignadaA: parsed.asignadaA === undefined ? undefined : parsed.asignadaA,
        fechaVencimiento:
          parsed.fechaVencimiento === undefined
            ? undefined
            : parsed.fechaVencimiento === null
              ? null
              : new Date(parsed.fechaVencimiento),
      },
      ctx(auth),
    );

    await logSgie({
      usuarioId: auth.userId,
      accion,
      recurso: 'tarea',
      recursoId: id,
      metadata: parsed as Record<string, unknown>,
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    // Errores de scope (Sin acceso a la tarea / expediente) → 403.
    if (err instanceof Error && err.message.startsWith('Sin acceso')) {
      return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }
    return authFailureResponse(err);
  }
}
