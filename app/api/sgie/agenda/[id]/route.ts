/**
 * PATCH /api/sgie/agenda/:id
 *
 * Actualiza un evento de agenda: título, descripción, fecha (reprogramar),
 * estado (confirmar/cancelar/completar) o expediente asociado. Requiere scope.
 *
 * Sprint 3 — tarea 1. Auditoría evento_updated (no hay eventos dedicados para
 * confirmar/cancelar/reprogramar en el enum; metadata explícita del cambio).
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { eventosAgenda, expedienteAsignaciones } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const updateSchema = z.object({
  titulo: z.string().min(1).max(300).optional(),
  descripcion: z.string().max(2000).optional(),
  fecha: z.string().datetime().optional(),
  estado: z.enum(['propuesta', 'confirmada', 'descartada', 'completada']).optional(),
  expedienteId: z.union([z.string().uuid(), z.null()]).optional(),
  // Sprint 5 — motivo categorizado al reprogramar.
  motivoCategoria: z.enum(['conflicto_agenda', 'solicitud_cliente', 'requerimiento_juzgado', 'falta_documentacion', 'otro']).optional(),
  motivoDetalle: z.string().max(500).optional(),
});

/**
 * Verifica el scope del abogado sobre un evento. El admin siempre tiene acceso.
 * Un abogado tiene acceso si el evento pertenece a un expediente accesible.
 * Los eventos sin expediente sólo los ve el admin (no hay scope alternativo).
 */
async function tieneAccesoEvento(eventoId: string, usuarioId: string, esAdmin: boolean): Promise<boolean> {
  if (esAdmin) return true;
  const [evento] = await db.select({ expedienteId: eventosAgenda.expedienteId })
    .from(eventosAgenda).where(eq(eventosAgenda.id, eventoId));
  if (!evento) return false;
  if (!evento.expedienteId) return false;
  const [asig] = await db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
    .where(and(eq(expedienteAsignaciones.expedienteId, evento.expedienteId), eq(expedienteAsignaciones.abogadoId, usuarioId), isNull(expedienteAsignaciones.revocadaEn)));
  return Boolean(asig);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:agenda:update:${auth.userId}`, { max: 40, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await params;
    const esAdmin = auth.rol === 'admin';
    const tieneAcceso = await tieneAccesoEvento(id, auth.userId, esAdmin);
    if (!tieneAcceso) return Response.json({ error: 'Sin acceso al evento' }, { status: 403 });

    const parsed = updateSchema.parse(await request.json());

    // Sprint 5 — si motivoCategoria=otro, exigir motivoDetalle.
    if (parsed.motivoCategoria === 'otro' && !parsed.motivoDetalle?.trim()) {
      return Response.json({ error: 'Debe indicar el detalle del motivo.' }, { status: 400 });
    }

    // Validar acceso al expediente si se reasocia.
    if (parsed.expedienteId && !esAdmin) {
      const [asig] = await db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, parsed.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) return Response.json({ error: 'Sin acceso al expediente' }, { status: 403 });
    }

    const set: Record<string, unknown> = {};
    if (parsed.titulo !== undefined) set.titulo = parsed.titulo.trim();
    if (parsed.descripcion !== undefined) set.descripcion = parsed.descripcion.trim() || null;
    if (parsed.fecha !== undefined) set.fecha = new Date(parsed.fecha);
    if (parsed.expedienteId !== undefined) set.expedienteId = parsed.expedienteId;
    if (parsed.estado !== undefined) {
      set.estado = parsed.estado;
      // Confirmar registra quién y cuándo.
      if (parsed.estado === 'confirmada') {
        set.confirmadaPor = auth.userId;
        set.confirmadaEn = new Date();
      }
    }

    if (Object.keys(set).length === 0) return Response.json({ ok: true });

    await db.update(eventosAgenda).set(set).where(eq(eventosAgenda.id, id));

    await logSgie({
      usuarioId: auth.userId,
      accion: 'evento_updated',
      recurso: 'evento_agenda',
      recursoId: id,
      metadata: {
        cambios: Object.keys(parsed),
        estadoNuevo: parsed.estado ?? null,
        reprogramado: parsed.fecha !== undefined,
        // Sprint 5 — motivo categorizado.
        motivoCategoria: parsed.motivoCategoria ?? null,
        motivoDetalle: parsed.motivoDetalle ?? null,
      },
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
