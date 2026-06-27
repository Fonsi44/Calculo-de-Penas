import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { eventosAgenda, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, isNull, inArray, desc, count } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
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
      if (accesibles.length === 0) return Response.json({ eventos: [], total: 0, page: 1, limit: query.limit });
    }

    const where = accesibles ? inArray(eventosAgenda.expedienteId, accesibles) : undefined;

    const [rows, [c]] = await Promise.all([
      db.select().from(eventosAgenda).where(where).orderBy(desc(eventosAgenda.fecha)).limit(query.limit).offset((query.page - 1) * query.limit),
      db.select({ total: count() }).from(eventosAgenda).where(where),
    ]);

    return Response.json({ eventos: rows, total: c?.total ?? 0, page: query.page, limit: query.limit });
  } catch (err) { return authFailureResponse(err); }
}
