import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { alertas } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAbogado(request);
    const { id: expedienteId } = await params;

    const rows = await db.select().from(alertas)
      .where(eq(alertas.expedienteId, expedienteId))
      .orderBy(alertas.creadoEn);

    return Response.json({ alertas: rows });
  } catch (err) { return authFailureResponse(err); }
}
