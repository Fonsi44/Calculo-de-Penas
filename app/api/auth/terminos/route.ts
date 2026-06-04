import { db } from '@/lib/db';
import { aceptacionesLegales } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, authFailureResponse } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);

    const [row] = await db.select()
      .from(aceptacionesLegales)
      .where(eq(aceptacionesLegales.usuarioId, user.userId))
      .limit(1);

    return Response.json({
      aceptado: !!row,
      version: row?.version ?? null,
      aceptadoEn: row?.aceptadoEn ?? null,
      versionActual: '2026-06-04',
    });
  } catch (e) {
    return authFailureResponse(e);
  }
}
