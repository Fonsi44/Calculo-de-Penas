import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { correosEnviados } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  try {
    requireAbogado(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const rows = await db.select().from(correosEnviados)
      .orderBy(desc(correosEnviados.creadoEn))
      .limit(query.limit).offset((query.page - 1) * query.limit);

    return Response.json({ correos: rows, total: rows.length, page: query.page, limit: query.limit });
  } catch (err) { return authFailureResponse(err); }
}
