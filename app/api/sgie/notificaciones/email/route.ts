/**
 * POST /api/sgie/notificaciones/email
 *
 * Dispara el envío de notificaciones email críticas pendientes para los
 * expedientes accesibles por el abogado (o todos si admin). Idempotente.
 *
 * Sprint 5 — tarea 6. Útil para un job cron o para ejecución manual.
 *
 * Seguridad: requireAbogado + scope. CSRF. Rate limit (1/min para evitar abuso).
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { alertas, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { enviarNotificacionEmailCritica, obtenerEmailResponsable } from '@/lib/sgie/notificaciones-email';

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

export async function POST(request: Request) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:notif:email:${auth.userId}`, { max: 1, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const accesibles = await idsAccesibles(auth.userId, auth.rol === 'admin');
    if (accesibles !== null && accesibles.length === 0) {
      return Response.json({ enviados: 0, resultados: [] });
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const resultados: { tipo: string; expedienteId: string; enviado: boolean; motivo: string }[] = [];

    // 1. Alertas críticas activas.
    const alertasCriticas = await db.select({
      id: alertas.id, expedienteId: alertas.expedienteId, titulo: alertas.titulo, mensaje: alertas.mensaje,
    }).from(alertas).where(and(
      accesibles ? inArray(alertas.expedienteId, accesibles) : eq(alertas.id, alertas.id),
      eq(alertas.resuelta, false),
      eq(alertas.severidad, 'critico'),
    )).limit(20);

    for (const a of alertasCriticas) {
      if (!a.expedienteId) continue;
      const resp = await obtenerEmailResponsable(a.expedienteId);
      if (!resp) continue;
      const r = await enviarNotificacionEmailCritica({
        tipo: 'alerta_critica', expedienteId: a.expedienteId, numeroInterno: '—',
        destinatario: resp.email, destinatarioId: resp.id,
        titulo: `Alerta crítica: ${a.titulo}`, mensaje: a.mensaje ?? 'Sin detalle', ventana: hoy,
      });
      resultados.push({ tipo: 'alerta_critica', expedienteId: a.expedienteId, enviado: r.enviado, motivo: r.motivo });
    }

    await logSgie({
      usuarioId: auth.userId, accion: 'expediente_updated', recurso: 'notificacion_email',
      metadata: { evento: 'notificaciones_email_disparadas', total: resultados.length } as Record<string, unknown>,
      request,
    });

    const enviados = resultados.filter((r) => r.enviado).length;
    return Response.json({ enviados, total: resultados.length, resultados });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos' }, { status: 400 });
    return authFailureResponse(err);
  }
}
