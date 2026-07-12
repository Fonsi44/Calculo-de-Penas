import { db } from '@/lib/db';
import { casos, calculos } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const [caso] = await db.select().from(casos).where(eq(casos.id, id));
    if (!caso) return Response.json({ error: 'Caso no encontrado' }, { status: 404 });
    if (caso.usuarioId !== user.userId) {
      return Response.json({ error: 'Sin permiso sobre este caso' }, { status: 403 });
    }

    const calculosList = await db.select().from(calculos)
      .where(eq(calculos.casoId, id))
      .orderBy(desc(calculos.creadoEn));

    return Response.json({ ...caso, calculos: calculosList });
  } catch (e) {
    return authFailureResponse(e);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    validateCsrf(request);
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select({ id: casos.id, usuarioId: casos.usuarioId })
      .from(casos).where(eq(casos.id, id));
    if (!existing) return Response.json({ error: 'Caso no encontrado' }, { status: 404 });
    if (existing.usuarioId !== user.userId) {
      return Response.json({ error: 'Sin permiso sobre este caso' }, { status: 403 });
    }

    const update: Record<string, unknown> = { actualizadoEn: new Date() };
    if (body.titulo !== undefined) update.titulo = body.titulo;
    if (body.cliente !== undefined) update.cliente = body.cliente;
    if (body.estado !== undefined) update.estado = body.estado;

    const [row] = await db.update(casos)
      .set(update)
      .where(eq(casos.id, id))
      .returning();

    await audit({
      usuarioId: user.userId,
      accion: 'caso_updated',
      recurso: 'caso',
      recursoId: id,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
    });

    return Response.json(row, { status: 200 });
  } catch (e) {
    return authFailureResponse(e);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    validateCsrf(request);
    const { id } = await params;

    const [existing] = await db.select({ id: casos.id, usuarioId: casos.usuarioId })
      .from(casos).where(eq(casos.id, id));
    if (!existing) return Response.json({ error: 'Caso no encontrado' }, { status: 404 });
    if (existing.usuarioId !== user.userId) {
      return Response.json({ error: 'Sin permiso sobre este caso' }, { status: 403 });
    }

    await db.delete(calculos).where(eq(calculos.casoId, id));
    await db.delete(casos).where(eq(casos.id, id));

    await audit({
      usuarioId: user.userId,
      accion: 'caso_deleted',
      recurso: 'caso',
      recursoId: id,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
    });

    return Response.json({ message: 'Caso eliminado' });
  } catch (e) {
    return authFailureResponse(e);
  }
}
