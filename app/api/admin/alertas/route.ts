import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { accessService } from '@/lib/access-service';
import { httpErrorResponse, correlationIdFrom } from '@/lib/http-errors';
import { listarAlertas, cambiarEstadoAlerta } from '@/lib/sgie/alertas-sla-service';

const getQuerySchema = z.object({
  severidad: z.enum(['info', 'advertencia', 'error', 'critico']).optional(),
  estado: z.enum(['abierta', 'en_progreso', 'pospuesta', 'resuelta', 'descartada_con_motivo']).optional(),
  expedienteId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const postSchema = z.object({
  alertaId: z.string().uuid(),
  nuevoEstado: z.enum(['abierta', 'en_progreso', 'pospuesta', 'resuelta', 'descartada_con_motivo']),
  motivo: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    const correlationId = correlationIdFrom(request);
    const { searchParams } = new URL(request.url);
    const query = getQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    await accessService.assertCapability(auth.userId, 'audit.read');

    const { items, total } = await listarAlertas({
      severidad: query.severidad,
      estado: query.estado,
      expedienteId: query.expedienteId,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return Response.json({
      items,
      total,
      page: query.page,
      limit: query.limit,
      correlationId,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues, correlationId: correlationIdFrom() }, { status: 400 });
    }
    if (err instanceof Response) return err;
    if (err instanceof Error && 'status' in err) return authFailureResponse(err);
    return httpErrorResponse(err, request);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    const correlationId = correlationIdFrom(request);
    const body = await request.json();
    const parsed = postSchema.parse(body);

    await accessService.assertCapability(auth.userId, 'cases.update');

    await cambiarEstadoAlerta(parsed.alertaId, parsed.nuevoEstado, parsed.motivo, {
      usuarioId: auth.userId,
    });

    return Response.json({ ok: true, correlationId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues, correlationId: correlationIdFrom() }, { status: 400 });
    }
    if (err instanceof Response) return err;
    if (err instanceof Error && 'status' in err) return authFailureResponse(err);
    return httpErrorResponse(err, request);
  }
}
