import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { tareas, expedientes, clientes } from '@/lib/schema';
import { and, eq, isNull, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const ahora = new Date();

    const tareasPendientes = await db
      .select({
        id: tareas.id,
        titulo: tareas.titulo,
        expedienteId: tareas.expedienteId,
        prioridad: tareas.prioridad,
        vence: tareas.fechaVencimiento,
        estado: tareas.estado,
        tipo: tareas.automatica,
        clienteNombre: clientes.nombre,
        numeroInterno: expedientes.numeroInterno,
      })
      .from(tareas)
      .leftJoin(expedientes, eq(tareas.expedienteId, expedientes.id))
      .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
      .where(and(eq(tareas.asignadaA, auth.userId), eq(tareas.estado, 'pendiente'), isNull(tareas.completadaEn)))
      .orderBy(desc(tareas.prioridad), desc(tareas.fechaVencimiento))
      .limit(50);

    const decision = tareasPendientes.filter((t) => t.tipo === false).slice(0, 5).map((t) => ({
      id: t.id,
      titulo: t.titulo,
      expedienteId: t.expedienteId ?? '',
      numeroInterno: t.numeroInterno ?? '',
      tipo: 'revision',
      estado: 'pendiente',
      prioridad: t.prioridad,
      vence: t.vence?.toISOString() ?? null,
      clienteNombre: t.clienteNombre,
      href: `/intranet/sgie/expedientes/${t.expedienteId}`,
    }));

    const terceros = tareasPendientes.filter((t) => t.tipo === true).slice(0, 5).map((t) => ({
      id: t.id,
      titulo: t.titulo,
      expedienteId: t.expedienteId ?? '',
      numeroInterno: t.numeroInterno ?? '',
      tipo: 'documentos',
      estado: 'pendiente',
      prioridad: t.prioridad,
      vence: t.vence?.toISOString() ?? null,
      clienteNombre: t.clienteNombre,
      href: `/intranet/sgie/expedientes/${t.expedienteId}`,
    }));

    const dentroDe48h = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);
    const riesgo = tareasPendientes
      .filter((t) => t.vence && t.vence <= dentroDe48h && t.prioridad === 'urgente')
      .slice(0, 5).map((t) => ({
        id: t.id,
        titulo: t.titulo,
        expedienteId: t.expedienteId ?? '',
        numeroInterno: t.numeroInterno ?? '',
        tipo: 'plazo',
        estado: 'critico',
        prioridad: 'urgente',
        vence: t.vence?.toISOString() ?? null,
        clienteNombre: t.clienteNombre,
        href: `/intranet/sgie/expedientes/${t.expedienteId}`,
      }));

    return Response.json({ decision, terceros, riesgo });
  } catch (err) {
    return authFailureResponse(err);
  }
}
