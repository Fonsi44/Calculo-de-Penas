import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { accessService } from '@/lib/access-service';
import { httpErrorResponse, correlationIdFrom } from '@/lib/http-errors';
import { listarReglas, crearRegla } from '@/lib/sgie/communication-rules-service';
import { validateCsrf } from '@/lib/csrf';

const getQuerySchema = z.object({
  estado: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const postSchema = z.object({
  nombre: z.string().min(1).max(200),
  plantillaSlug: z.string().min(1).max(100),
  disparador: z.string().optional(),
  condiciones: z.record(z.string(), z.unknown()).optional(),
  destinatario: z.string().optional(),
  retrasoMinutos: z.number().int().min(0).optional(),
  horarioInicio: z.string().optional(),
  horarioFin: z.string().optional(),
  cadenciaHoras: z.number().int().min(0).optional(),
  maximoEnvio: z.number().int().min(0).optional(),
  sensibilidad: z.string().optional(),
  requiereAprobacion: z.boolean().optional(),
  idioma: z.string().optional(),
  estado: z.enum(['borrador', 'activa', 'desactivada']).optional(),
});

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    const correlationId = correlationIdFrom(request);
    const { searchParams } = new URL(request.url);
    const query = getQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    await accessService.assertCapability(auth.userId, 'audit.read');

    const { items, total } = await listarReglas({
      estado: query.estado,
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
    validateCsrf(request);
    const correlationId = correlationIdFrom(request);
    const body = await request.json();
    const parsed = postSchema.parse(body);

    await accessService.assertCapability(auth.userId, 'users.manage');

    const rule = await crearRegla(
      {
        nombre: parsed.nombre,
        plantillaSlug: parsed.plantillaSlug,
        disparador: parsed.disparador,
        condiciones: parsed.condiciones,
        destinatario: parsed.destinatario,
        retrasoMinutos: parsed.retrasoMinutos,
        horarioInicio: parsed.horarioInicio,
        horarioFin: parsed.horarioFin,
        cadenciaHoras: parsed.cadenciaHoras,
        maximoEnvio: parsed.maximoEnvio,
        sensibilidad: parsed.sensibilidad,
        requiereAprobacion: parsed.requiereAprobacion,
        idioma: parsed.idioma,
        estado: parsed.estado,
      },
      { usuarioId: auth.userId },
    );

    return Response.json({ rule, correlationId }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues, correlationId: correlationIdFrom() }, { status: 400 });
    }
    if (err instanceof Response) return err;
    if (err instanceof Error && 'status' in err) return authFailureResponse(err);
    return httpErrorResponse(err, request);
  }
}
