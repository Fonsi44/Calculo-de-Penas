import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { listarUsuariosGestion } from '@/lib/sgie/usuarios-db';

const querySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  // SGIE — filtro por estado de acceso (activos/bloqueados/inactivos/todos).
  estado: z.enum(['activos', 'bloqueados', 'inactivos', 'todos']).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    // SGIE — listado con datos de gobernanza (último acceso, bloqueo, vínculo
    // corporativo) y conteo de expedientes asignados por abogado. A diferencia
    // de la versión anterior, devuelve todos los usuarios con su estado para
    // que el admin pueda gestionar bloqueados/inactivos (§6.2).
    const estado = query.estado && query.estado !== 'todos' ? query.estado : undefined;
    const { usuarios: rows, total } = await listarUsuariosGestion({
      q: query.q,
      estado,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return Response.json({ usuarios: rows, total, page: query.page, limit: query.limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    return Response.json({
      error: 'El alta directa está deshabilitada. Use /api/admin/invitaciones.',
      code: 'INVITATION_REQUIRED',
    }, { status: 405, headers: { Allow: 'GET' } });
  } catch (err) {
    return authFailureResponse(err);
  }
}
