import { db } from '@/lib/db';
import { casos, calculos } from '@/lib/schema';
import { eq, desc, count } from 'drizzle-orm';
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);

    const rows = await db.select({
      id: casos.id,
      titulo: casos.titulo,
      cliente: casos.cliente,
      estado: casos.estado,
      creadoEn: casos.creadoEn,
      totalCalculos: count(calculos.id),
    }).from(casos)
      .leftJoin(calculos, eq(calculos.casoId, casos.id))
      .where(eq(casos.usuarioId, user.userId))
      .groupBy(casos.id)
      .orderBy(desc(casos.creadoEn));

    return Response.json(rows);
  } catch (e) {
    return authFailureResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    validateCsrf(request);

    const body = await request.json();
    const [row] = await db.insert(casos).values({
      usuarioId: user.userId,
      titulo: body.titulo || 'Sin título',
      cliente: body.cliente || null,
      estado: 'borrador',
    }).returning();

    await audit({
      usuarioId: user.userId,
      accion: 'caso_created',
      recurso: 'caso',
      recursoId: row.id,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
    });

    return Response.json(row, { status: 201 });
  } catch (e) {
    return authFailureResponse(e);
  }
}
