import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import {
  obtenerExpediente,
  cambiarEstadoExpediente,
  type ContextoAbogado,
} from '@/lib/sgie/expedientes-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const patchSchema = z.object({
  estado: z
    .enum([
      'creado',
      'pendiente_de_checklist',
      'pendiente_de_documentos',
      'enlace_enviado',
      'documentos_parcialmente_recibidos',
      'documentos_completos',
      'analisis_pendiente',
      'analisis_completado',
      'inconsistencias_detectadas',
      'pendiente_validacion_abogado',
      'validado',
      'pendiente_de_firma',
      'en_tramite',
      'en_seguimiento',
      'finalizado',
      'archivado',
    ])
    .optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  resumen: z.string().max(2000).optional(),
  area: z.string().max(200).optional(),
});

function contextoDesdeAuth(auth: { userId: string; rol: string }): ContextoAbogado {
  return {
    usuarioId: auth.userId,
    rol: auth.rol,
    esAdmin: auth.rol === 'admin',
  };
}

/**
 * GET /api/sgie/expedientes/:id
 *
 * Devuelve el detalle completo (datos, checklist, historial) si el abogado tiene
 * acceso (asignación/permiso) o si es admin. Devuelve 404 si no existe o no hay
 * acceso (no se filtra la existencia entre abogados).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    const { id } = await params;

    const detalle = await obtenerExpediente(id, contextoDesdeAuth(auth));
    if (!detalle) {
      return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    return Response.json({ expediente: detalle });
  } catch (err) {
    return authFailureResponse(err);
  }
}

/**
 * PATCH /api/sgie/expedientes/:id
 *
 * Actualiza estado, prioridad, resumen o área. Las transiciones de estado
 * críticas (validado y posteriores) requieren actor abogado/admin — el sistema
 * nunca las ejecuta. El scope se verifica antes de cualquier cambio.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:expediente:update:${auth.userId}`, {
      max: 60,
      windowMs: 60_000,
      keyPrefix: 'sgie',
    });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    if (Object.keys(parsed).length === 0) {
      return Response.json({ error: 'Sin campos para actualizar' }, { status: 400 });
    }

    const ctx = contextoDesdeAuth(auth);

    // Cambio de estado: verifica scope + transición permitida + actor.
    let estadoResult: { estadoAnterior: string; estadoNuevo: string } | null = null;
    if (parsed.estado) {
      estadoResult = await cambiarEstadoExpediente(id, parsed.estado, ctx);
      if (estadoResult === null) {
        return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
      }
      await logSgie({
        usuarioId: auth.userId,
        accion: 'expediente_estado_changed',
        recurso: 'expediente',
        recursoId: id,
        metadata: {
          estadoAnterior: estadoResult.estadoAnterior,
          estadoNuevo: estadoResult.estadoNuevo,
        },
        request,
      });
    }

    // Resto de campos no críticos (prioridad, resumen, área): actualización directa
    // con verificación de acceso previa vía obtenerExpediente.
    const noEstado = ['prioridad', 'resumen', 'area'].some((k) => k in parsed);
    if (noEstado) {
      const tieneAcceso = await obtenerExpediente(id, ctx);
      if (!tieneAcceso) {
        return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
      }
      // import dinámico para evitar duplicar imports arriba
      const { db } = await import('@/lib/db');
      const { expedientes } = await import('@/lib/schema');
      const { eq } = await import('drizzle-orm');
      const set: Record<string, unknown> = { actualizadoEn: new Date() };
      if (parsed.prioridad !== undefined) set.prioridad = parsed.prioridad;
      if (parsed.resumen !== undefined) set.resumen = parsed.resumen;
      if (parsed.area !== undefined) set.area = parsed.area;
      await db.update(expedientes).set(set).where(eq(expedientes.id, id));

      await logSgie({
        usuarioId: auth.userId,
        accion: 'expediente_updated',
        recurso: 'expediente',
        recursoId: id,
        metadata: { campos: Object.keys(set).filter((k) => k !== 'actualizadoEn') },
        request,
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    // Transición no permitida → 409 (conflicto de estado).
    if (err instanceof Error && err.message.startsWith('Transición no permitida')) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    return authFailureResponse(err);
  }
}
