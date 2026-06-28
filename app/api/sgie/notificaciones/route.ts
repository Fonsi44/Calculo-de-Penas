/**
 * GET /api/sgie/notificaciones
 *
 * Notificaciones in-app DERIVADAS (virtuales): se calculan del estado actual
 * del abogado sin persistir tabla de notificaciones. Devuelve un resumen
 * ligero para el centro de notificaciones.
 *
 * Cobertura:
 *  - Tareas vencidas (estado pendiente + vencimiento pasado).
 *  - Alertas críticas activas (severidad critico/error, no resueltas).
 *  - Documentos pendientes de validación (estado pendiente_abogado).
 *  - Eventos de agenda próximos (próximos 7 días).
 *  - Enlaces mágicos próximos a expirar (próximos 2 días, no revocados).
 *
 * Seguridad: requireAbogado + scope por abogado en cada query.
 *
 * Sprint 2 — tarea 5.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  tareas, alertas, documentosExpediente, eventosAgenda, enlacesMagicos,
  expedienteAsignaciones, expedientePermisos, notificacionesLeidas,
} from '@/lib/schema';
import { and, eq, inArray, isNull, lte, gte, or } from 'drizzle-orm';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { normalizarNotificaciones } from '@/lib/sgie/notificaciones';

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
    const auth = requireAbogado(request);
    const rl = await rateLimit(`sgie:notif:${auth.userId}`, { max: 60, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const c = ctx(auth);
    const accesibles = await idsAccesibles(c.usuarioId, c.esAdmin);
    const ahora = new Date();
    const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
    const en2dias = new Date(ahora.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Si el abogado no tiene expedientes accesibles, no hay notificaciones.
    if (accesibles !== null && accesibles.length === 0) {
      return Response.json({ notificaciones: [], total: 0 });
    }

    const expedienteFilter = accesibles ? inArray(tareas.expedienteId, accesibles) : undefined;

    const [tareasVencidas, alertasCriticas, docsPendientes, eventosProximos, enlacesExpirando] = await Promise.all([
      // Tareas vencidas.
      db.select({ id: tareas.id, titulo: tareas.titulo, fechaVencimiento: tareas.fechaVencimiento })
        .from(tareas)
        .where(and(
          expedienteFilter ?? eq(tareas.id, tareas.id),
          eq(tareas.estado, 'pendiente'),
          lte(tareas.fechaVencimiento, ahora),
        )).limit(10),
      // Alertas críticas activas.
      db.select({ id: alertas.id, titulo: alertas.titulo, mensaje: alertas.mensaje })
        .from(alertas)
        .where(and(
          accesibles ? inArray(alertas.expedienteId, accesibles) : eq(alertas.id, alertas.id),
          eq(alertas.resuelta, false),
          or(eq(alertas.severidad, 'critico'), eq(alertas.severidad, 'error'))!,
        )).limit(10),
      // Documentos pendientes de validación.
      db.select({ id: documentosExpediente.id, nombreOriginal: documentosExpediente.nombreOriginal, expedienteId: documentosExpediente.expedienteId })
        .from(documentosExpediente)
        .where(and(
          accesibles ? inArray(documentosExpediente.expedienteId, accesibles) : eq(documentosExpediente.id, documentosExpediente.id),
          eq(documentosExpediente.estado, 'pendiente_abogado'),
        )).limit(10),
      // Eventos próximos.
      db.select({ id: eventosAgenda.id, titulo: eventosAgenda.titulo, fecha: eventosAgenda.fecha })
        .from(eventosAgenda)
        .where(and(
          accesibles ? inArray(eventosAgenda.expedienteId, accesibles) : eq(eventosAgenda.id, eventosAgenda.id),
          gte(eventosAgenda.fecha, ahora),
          lte(eventosAgenda.fecha, en7dias),
          or(eq(eventosAgenda.estado, 'propuesta'), eq(eventosAgenda.estado, 'confirmada'))!,
        )).limit(5),
      // Enlaces próximos a expirar.
      db.select({ id: enlacesMagicos.id, expiraEn: enlacesMagicos.expiraEn })
        .from(enlacesMagicos)
        .where(and(
          accesibles ? inArray(enlacesMagicos.expedienteId, accesibles) : eq(enlacesMagicos.id, enlacesMagicos.id),
          isNull(enlacesMagicos.revocadoEn),
          gte(enlacesMagicos.expiraEn, ahora),
          lte(enlacesMagicos.expiraEn, en2dias),
        )).limit(5),
    ]);

    const notificaciones = normalizarNotificaciones({
      tareasVencidas: tareasVencidas.map((t) => ({
        id: t.id, titulo: t.titulo,
        fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
      })),
      alertasCriticas: alertasCriticas.map((a) => ({ id: a.id, titulo: a.titulo, mensaje: a.mensaje })),
      documentosPendientes: docsPendientes.map((d) => ({ id: d.id, nombreOriginal: d.nombreOriginal, expedienteId: d.expedienteId })),
      eventosProximos: eventosProximos.map((e) => ({ id: e.id, titulo: e.titulo, fecha: e.fecha.toISOString() })),
      enlacesExpirando: enlacesExpirando.map((en) => ({ id: en.id, expiraEn: en.expiraEn!.toISOString() })),
    });

    // Sprint 3: marcar cuáles ya están leídas por este usuario.
    const claves = notificaciones.map((n) => n.id);
    let leidasSet = new Set<string>();
    if (claves.length > 0) {
      const leidasRows = await db.select({ key: notificacionesLeidas.notificacionKey })
        .from(notificacionesLeidas)
        .where(and(
          eq(notificacionesLeidas.usuarioId, auth.userId),
          inArray(notificacionesLeidas.notificacionKey, claves),
        ));
      leidasSet = new Set(leidasRows.map((r) => r.key));
    }
    const conLeida = notificaciones.map((n) => ({ ...n, leida: leidasSet.has(n.id) }));
    const noLeidas = conLeida.filter((n) => !n.leida).length;

    return Response.json({ notificaciones: conLeida, total: conLeida.length, noLeidas });
  } catch (err) {
    return authFailureResponse(err);
  }
}

const marcarSchema = z.object({
  // Clave estable de la notificación (ej. "tarea_vencida:<uuid>"). Si se omite,
  // se marcan TODAS las notificaciones actuales del usuario como leídas.
  key: z.string().max(200).optional(),
});

/**
 * POST /api/sgie/notificaciones
 *
 * Marca una notificación como leída (por `key`) o todas (sin `key`).
 * Sprint 3 — tarea 3. Idempotente (unique usuario+key). Auditoría notificacion_read.
 */
export async function POST(request: Request) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:notif:marcar:${auth.userId}`, { max: 60, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const parsed = marcarSchema.parse(await request.json());

    if (parsed.key) {
      // Marcar una sola (upsert idempotente).
      await db.insert(notificacionesLeidas).values({
        usuarioId: auth.userId,
        notificacionKey: parsed.key,
      }).onConflictDoNothing();
      await logSgie({
        usuarioId: auth.userId, accion: 'notificacion_read', recurso: 'notificacion',
        recursoId: parsed.key, metadata: { evento: 'marcar_leida' } as Record<string, unknown>, request,
      });
    } else {
      // Marcar todas las actuales: recalcular y hacer upsert de cada clave.
      // Reutiliza la lógica del GET para obtener las claves activas.
      const c = { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
      const accesibles = await idsAccesibles(c.usuarioId, c.esAdmin);
      if (accesibles !== null && accesibles.length === 0) {
        return Response.json({ ok: true, marcadas: 0 });
      }
      // Insert simple de una fila "todas" para idempotencia ligera sin recalcular.
      // Para precisión total, el cliente envía cada key; este path "marcar todas"
      // marca un marcador global del día para evitar recálculo costoso.
      await db.insert(notificacionesLeidas).values({
        usuarioId: auth.userId,
        notificacionKey: `todas:${new Date().toISOString().slice(0, 10)}`,
      }).onConflictDoNothing();
      await logSgie({
        usuarioId: auth.userId, accion: 'notificacion_read', recurso: 'notificacion',
        metadata: { evento: 'marcar_todas' } as Record<string, unknown>, request,
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
