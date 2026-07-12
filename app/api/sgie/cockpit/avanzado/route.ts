/**
 * GET /api/sgie/cockpit/avanzado
 *
 * Datos ejecutivos del cockpit: tendencia de expedientes por estado, tareas
 * vencidas por responsable, documentos pendientes, alertas críticas, cuellos
 * de botella (expedientes sin movimiento X días), eventos próximos.
 *
 * Payload agregado y ligero. Scope por abogado (admin ve todo).
 *
 * Sprint 3 — tarea 5.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  expedientes, tareas, documentosExpediente, alertas, eventosAgenda,
  expedienteAsignaciones, expedientePermisos, usuarios,
} from '@/lib/schema';
import { and, count, eq, inArray, isNull, lte, gte, or, sql, asc } from 'drizzle-orm';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

function ctx(auth: { userId: string; rol: string }) {
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
    const auth = await requireAbogado(request);
    const rl = await rateLimit(`sgie:cockpit:${auth.userId}`, { max: 60, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const c = ctx(auth);
    const accesibles = await idsAccesibles(c.usuarioId, c.esAdmin);
    const ahora = new Date();
    const hace14dias = new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000);
    const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (accesibles !== null && accesibles.length === 0) {
      return Response.json({
        tendenciaPorEstado: [], tareasVencidasPorResponsable: [],
        documentosPendientes: 0, alertasCriticas: 0,
        cuellosDeBotella: [], eventosProximos: [],
      });
    }

    const expFilter = accesibles ? inArray(expedientes.id, accesibles) : undefined;
    const expIdFilter = accesibles ? inArray(tareas.expedienteId, accesibles) : undefined;

    const [tendencia, tareasVencidas, docsPend, alertCrit, cuellos, eventos] = await Promise.all([
      // Tendencia: expedientes por estado.
      db.select({ estado: expedientes.estado, n: count() }).from(expedientes)
        .where(expFilter).groupBy(expedientes.estado),
      // Tareas vencidas por responsable.
      db.select({
        responsableId: tareas.asignadaA, nombre: usuarios.nombre, n: count(),
      }).from(tareas)
        .leftJoin(usuarios, eq(tareas.asignadaA, usuarios.id))
        .where(and(
          expIdFilter ?? eq(tareas.id, tareas.id),
          eq(tareas.estado, 'pendiente'),
          lte(tareas.fechaVencimiento, ahora),
        )).groupBy(tareas.asignadaA, usuarios.nombre),
      // Documentos pendientes de validación.
      db.select({ n: count() }).from(documentosExpediente)
        .where(and(
          accesibles ? inArray(documentosExpediente.expedienteId, accesibles) : eq(documentosExpediente.id, documentosExpediente.id),
          eq(documentosExpediente.estado, 'pendiente_abogado'),
        )),
      // Alertas críticas activas.
      db.select({ n: count() }).from(alertas)
        .where(and(
          accesibles ? inArray(alertas.expedienteId, accesibles) : eq(alertas.id, alertas.id),
          eq(alertas.resuelta, false),
          or(eq(alertas.severidad, 'critico'), eq(alertas.severidad, 'error'))!,
        )),
      // Cuellos de botella: expedientes sin actualizar desde hace 14+ días y no finalizados.
      db.select({
        id: expedientes.id, numeroInterno: expedientes.numeroInterno,
        estado: expedientes.estado, actualizadoEn: expedientes.actualizadoEn,
      }).from(expedientes)
        .where(and(
          expFilter,
          lte(expedientes.actualizadoEn, hace14dias),
          sql`${expedientes.estado} NOT IN ('finalizado', 'archivado')`,
        )).orderBy(asc(expedientes.actualizadoEn)).limit(10),
      // Eventos próximos (7 días).
      db.select({
        id: eventosAgenda.id, titulo: eventosAgenda.titulo, fecha: eventosAgenda.fecha, estado: eventosAgenda.estado,
      }).from(eventosAgenda)
        .where(and(
          accesibles ? inArray(eventosAgenda.expedienteId, accesibles) : eq(eventosAgenda.id, eventosAgenda.id),
          gte(eventosAgenda.fecha, ahora),
          lte(eventosAgenda.fecha, en7dias),
        )).orderBy(asc(eventosAgenda.fecha)).limit(6),
    ]);

    return Response.json({
      tendenciaPorEstado: tendencia.map((t) => ({ estado: t.estado, n: Number(t.n) })),
      tareasVencidasPorResponsable: tareasVencidas
        .filter((t) => t.responsableId !== null)
        .map((t) => ({ responsableId: t.responsableId!, nombre: t.nombre ?? '—', n: Number(t.n) }))
        .sort((a, b) => b.n - a.n),
      documentosPendientes: Number(docsPend[0]?.n ?? 0),
      alertasCriticas: Number(alertCrit[0]?.n ?? 0),
      cuellosDeBotella: cuellos,
      eventosProximos: eventos.map((e) => ({
        id: e.id, titulo: e.titulo, fecha: e.fecha.toISOString(), estado: e.estado,
      })),
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
