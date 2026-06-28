/**
 * GET /api/sgie/tipos-procedimiento
 *
 * Lista los tipos de procedimiento asignables a un expediente nuevo.
 * Por defecto sólo devuelve los `estado='activo'` (los únicos asignables).
 * El admin puede pasar `?incluirTodos=true` para ver todos los estados.
 *
 * Seguridad: `requireAbogado`. Sin mutaciones. Sin datos sensibles por abogado
 * (es un catálogo compartido, no hay scope por expediente aquí).
 *
 * Sprint 0 — habilita el selector de procedimiento en el alta de expedientes.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { listarProcedimientos } from '@/lib/sgie/procedimientos-db';

const querySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  incluirTodos: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

function contextoDesdeAuth(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const { tiposProcedimiento, total } = await listarProcedimientos(contextoDesdeAuth(auth), {
      q: query.q,
      limit: query.limit,
      incluirTodos: query.incluirTodos,
    });

    return Response.json({ tiposProcedimiento, total });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
