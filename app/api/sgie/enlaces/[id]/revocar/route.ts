import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { revocarEnlace } from '@/lib/sgie/enlaces-magicos';
import { db } from '@/lib/db';
import { enlacesMagicos } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

/**
 * POST /api/sgie/enlaces/:id/revocar
 * Revoca un enlace mágico. El abogado debe tener scope sobre el expediente.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:enlace:revocar:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const motivo = typeof body.motivo === 'string' ? body.motivo : undefined;

    // Verificar que el enlace existe y pertenece a un expediente accesible.
    const [enlace] = await db
      .select({ expedienteId: enlacesMagicos.expedienteId })
      .from(enlacesMagicos)
      .where(eq(enlacesMagicos.id, id));
    if (!enlace) {
      return Response.json({ error: 'Enlace no encontrado' }, { status: 404 });
    }

    const { verificarAccesoExpediente } = await import('@/lib/sgie/expedientes-db');
    const c = { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
    const tieneAcceso = await verificarAccesoExpediente(enlace.expedienteId, c);
    if (!tieneAcceso) {
      return Response.json({ error: 'Enlace no encontrado' }, { status: 404 });
    }

    await revocarEnlace(id, auth.userId, motivo);

    await logSgie({
      usuarioId: auth.userId,
      accion: 'enlace_revoked',
      recurso: 'enlace_magico',
      recursoId: id,
      metadata: { motivo: motivo ?? null },
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return authFailureResponse(err);
  }
}
