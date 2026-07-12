import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { verificarAccesoExpediente, type ContextoAbogado } from '@/lib/sgie/expedientes-db';
import { enviarRecordatorio } from '@/lib/sgie/recordatorios-cliente';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const bodySchema = z.object({
  numero: z.union([z.literal(1), z.literal(2)]),
});

/**
 * POST /api/sgie/expedientes/:id/seguimiento/recordatorio
 * Body: { numero: 1 | 2 }
 *
 * Envía un recordatorio manual (primero o segundo) al cliente con el enlace
 * de carga activo. Idempotente por día+número. Acción del abogado.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:seguimiento:recordatorio:${auth.userId}`, {
      max: 20,
      windowMs: 60_000,
      keyPrefix: 'sgie',
    });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const parsed = bodySchema.parse(await request.json());

    const ctx: ContextoAbogado = {
      usuarioId: auth.userId,
      rol: auth.rol,
      esAdmin: auth.rol === 'admin',
    };
    const tieneAcceso = await verificarAccesoExpediente(id, ctx);
    if (!tieneAcceso) {
      return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const resultado = await enviarRecordatorio(id, parsed.numero, auth.userId);

    await logSgie({
      usuarioId: auth.userId,
      accion: 'reminder_sent',
      recurso: 'expediente',
      recursoId: id,
      metadata: {
        slug: parsed.numero === 1 ? 'primer_recordatorio' : 'segundo_recordatorio',
        numero: parsed.numero,
        enviado: resultado.enviado,
        motivo: resultado.motivo,
        enlaceId: resultado.enlaceId,
      },
      mensaje: `Recordatorio ${parsed.numero} enviado al cliente`,
      request,
    });

    return Response.json({ ok: true, resultado });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
