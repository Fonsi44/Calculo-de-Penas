import { db } from '@/lib/db';
import { auditoriaEventos } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq, desc, ilike } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  accion: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    let dbQuery = db.select().from(auditoriaEventos).orderBy(desc(auditoriaEventos.creadoEn));

    if (query.accion) {
      dbQuery = dbQuery.where(ilike(auditoriaEventos.accion, `%${query.accion}%`)) as typeof dbQuery;
    }

    const eventos = await dbQuery.limit(query.limit).offset((query.page - 1) * query.limit);
    return Response.json({ eventos });
  } catch (err) { return authFailureResponse(err); }
}
