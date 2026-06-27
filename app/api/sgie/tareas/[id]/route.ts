import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { tareas, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    const { id } = await params;

    const [tarea] = await db.select().from(tareas).where(eq(tareas.id, id));
    if (!tarea) return Response.json({ error: 'No encontrada' }, { status: 404 });

    if (auth.rol !== 'admin') {
      if (!tarea.expedienteId) return Response.json({ error: 'Sin acceso' }, { status: 403 });
      const [asig] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, tarea.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }

    const body = await request.json();
    await db.update(tareas).set({ estado: body.estado || 'completada', completadaEn: new Date() }).where(eq(tareas.id, id));
    return Response.json({ ok: true });
  } catch (err) { return authFailureResponse(err); }
}
