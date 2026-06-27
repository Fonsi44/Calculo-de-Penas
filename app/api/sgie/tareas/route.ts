import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { tareas, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, isNull, inArray, desc, count } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  expedienteId: z.string().uuid().optional(),
  estado: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    const esAdmin = auth.rol === 'admin';
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    let accesibles: string[] | null = null;
    if (!esAdmin) {
      const [asig, perm] = await Promise.all([
        db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
          .where(and(eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))),
        db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
          .where(and(eq(expedientePermisos.abogadoId, auth.userId), isNull(expedientePermisos.revocadoEn))),
      ]);
      const ids = new Set([...asig.map(r => r.id), ...perm.map(r => r.id)]);
      accesibles = Array.from(ids);
      if (accesibles.length === 0) return Response.json({ tareas: [], total: 0, page: 1, limit: query.limit });
    }

    const conditions = [];
    if (accesibles) conditions.push(inArray(tareas.expedienteId, accesibles));
    if (query.expedienteId) conditions.push(eq(tareas.expedienteId, query.expedienteId));
    if (query.estado) conditions.push(eq(tareas.estado, query.estado as typeof tareas.$inferSelect.estado));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [c]] = await Promise.all([
      db.select().from(tareas).where(where).orderBy(desc(tareas.creadaEn)).limit(query.limit).offset((query.page - 1) * query.limit),
      db.select({ total: count() }).from(tareas).where(where),
    ]);

    return Response.json({ tareas: rows, total: c?.total ?? 0, page: query.page, limit: query.limit });
  } catch (err) { return authFailureResponse(err); }
}
