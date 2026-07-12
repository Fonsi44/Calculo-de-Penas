import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import {
  obtenerPlantilla,
  actualizarPlantilla,
} from '@/lib/sgie/correos-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const updateSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  asunto: z.string().min(1).max(300).optional(),
  cuerpoHtml: z.string().min(1).optional(),
  variablesPermitidas: z.array(z.string()).optional(),
  estado: z.enum(['borrador', 'activa', 'desactivada']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAbogado(request);
    const { id } = await params;
    const plantilla = await obtenerPlantilla(id);
    if (!plantilla) {
      return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }
    return Response.json({ plantilla });
  } catch (err) {
    return authFailureResponse(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    if (auth.rol !== 'admin') {
      return Response.json({ error: 'Solo administradores pueden modificar plantillas' }, { status: 403 });
    }
    validateCsrf(request);
    const rl = await rateLimit(`sgie:plantilla:update:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const parsed = updateSchema.parse(await request.json());
    const plantilla = await actualizarPlantilla(id, parsed);
    if (!plantilla) {
      return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }
    await logSgie({
      usuarioId: auth.userId,
      accion: 'plantilla_updated',
      recurso: 'plantilla',
      recursoId: id,
      metadata: parsed,
      request,
    });
    return Response.json({ plantilla });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    if (auth.rol !== 'admin') {
      return Response.json({ error: 'Solo administradores pueden eliminar plantillas' }, { status: 403 });
    }
    validateCsrf(request);
    const { id } = await params;
    const plantilla = await actualizarPlantilla(id, { estado: 'desactivada' });
    if (!plantilla) {
      return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }
    await logSgie({
      usuarioId: auth.userId,
      accion: 'plantilla_deleted',
      recurso: 'plantilla',
      recursoId: id,
      request,
    });
    return Response.json({ plantilla });
  } catch (err) {
    return authFailureResponse(err);
  }
}
