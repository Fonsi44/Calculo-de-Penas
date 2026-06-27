import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { alertas, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, isNull, inArray, desc, count } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  expedienteId: z.string().uuid().optional(),
  resuelta: z.coerce.boolean().optional(),
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
      if (accesibles.length === 0) return Response.json({ alertas: [], total: 0, page: 1, limit: query.limit });
    }

    const conditions = [];
    if (accesibles) conditions.push(inArray(alertas.expedienteId, accesibles));
    if (query.expedienteId) conditions.push(eq(alertas.expedienteId, query.expedienteId));
    if (query.resuelta !== undefined) conditions.push(eq(alertas.resuelta, query.resuelta));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [c]] = await Promise.all([
      db.select().from(alertas).where(where).orderBy(desc(alertas.creadoEn)).limit(query.limit).offset((query.page - 1) * query.limit),
      db.select({ total: count() }).from(alertas).where(where),
    ]);

    return Response.json({ alertas: rows, total: c?.total ?? 0, page: query.page, limit: query.limit });
  } catch (err) { return authFailureResponse(err); }
}
