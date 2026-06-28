/**
 * GET /api/sgie/productividad/tiempo-por-estado
 *
 * Calcula el tiempo medio por estado de expedientes a partir del
 * `historial_expediente`. Scope por abogado (admin ve todo). Filtros por rango.
 *
 * Sprint 5 — tarea 4.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { historialExpediente, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { reconstruirIntervalos, calcularTiempoMedioPorEstado, identificarCuellosBotella } from '@/lib/sgie/tiempo-por-estado';

const querySchema = z.object({
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  umbralCuelloDias: z.coerce.number().int().min(1).max(90).default(7),
});

function _ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

async function idsAccesibles(usuarioId: string, esAdmin: boolean): Promise<string[] | null> {
  if (esAdmin) return null;
  const [asig, perm] = await Promise.all([
    db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
      .where(and(eq(expedienteAsignaciones.abogadoId, usuarioId), isNull(expedienteAsignaciones.revocadaEn))),
    db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
      .where(and(eq(expedientePermisos.abogadoId, usuarioId), isNull(expedientePermisos.revocadoEn))),
  ]);
  return Array.from(new Set([...asig.map((r) => r.id), ...perm.map((r) => r.id)]));
}

export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    const rl = await rateLimit(`sgie:tiempo:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const accesibles = await idsAccesibles(auth.userId, auth.rol === 'admin');

    if (accesibles !== null && accesibles.length === 0) {
      return Response.json({ tiempoPorEstado: [], cuellosBotella: [], datosInsuficientes: true });
    }

    // Recopilar historial de expedientes accesibles en el rango.
    const conds = [];
    if (accesibles) conds.push(inArray(historialExpediente.expedienteId, accesibles));
    if (query.fechaDesde) conds.push(gte(historialExpediente.creadoEn, new Date(query.fechaDesde)));
    if (query.fechaHasta) conds.push(lte(historialExpediente.creadoEn, new Date(query.fechaHasta)));

    const rawEventos = await db.select({
      expedienteId: historialExpediente.expedienteId,
      estadoAnterior: historialExpediente.estadoAnterior,
      estadoNuevo: historialExpediente.estadoNuevo,
      creadoEn: historialExpediente.creadoEn,
    }).from(historialExpediente).where(conds.length > 0 ? and(...conds) : undefined);

    const eventos = rawEventos
      .filter((e) => e.estadoNuevo !== null && e.creadoEn !== null)
      .map((e) => ({ expedienteId: e.expedienteId, estadoAnterior: e.estadoAnterior, estadoNuevo: e.estadoNuevo as string, creadoEn: e.creadoEn as Date }));
    if (eventos.length === 0) {
      return Response.json({ tiempoPorEstado: [], cuellosBotella: [], datosInsuficientes: true });
    }

    // Agrupar por expediente y reconstruir intervalos.
    const porExpediente = new Map<string, typeof eventos>();
    for (const ev of eventos) {
      if (!porExpediente.has(ev.expedienteId)) porExpediente.set(ev.expedienteId, []);
      porExpediente.get(ev.expedienteId)!.push(ev);
    }

    let todosIntervalos: ReturnType<typeof reconstruirIntervalos> = [];
    for (const evs of porExpediente.values()) {
      todosIntervalos = todosIntervalos.concat(reconstruirIntervalos(evs));
    }

    const tiempoPorEstado = calcularTiempoMedioPorEstado(todosIntervalos);
    const cuellosBotella = identificarCuellosBotella(tiempoPorEstado, query.umbralCuelloDias);

    return Response.json({
      tiempoPorEstado,
      cuellosBotella,
      datosInsuficientes: tiempoPorEstado.length === 0,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
