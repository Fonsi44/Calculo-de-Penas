import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { db } from '@/lib/db';
import { expedienteAsignaciones } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { enviarSolicitudDocumental } from '@/lib/sgie/recordatorios-cliente';

/** POST /api/sgie/expedientes/:id/readiness/pedir-info — pedir info adicional al cliente */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const auth = requireAbogado(req); validateCsrf(req); const { id } = await params;
    const rl = await rateLimit(`sgie:readiness:${auth.userId}`, { max: 15, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    if (auth.rol !== 'admin') { const [a] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones).where(and(eq(expedienteAsignaciones.expedienteId, id), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))); if (!a) return Response.json({ error: 'Sin acceso' }, { status: 403 }); }
    await enviarSolicitudDocumental(id, auth.userId);
    await logSgie({ usuarioId: auth.userId, accion: 'case_additional_info_requested', recurso: 'expediente', recursoId: id, request: req });
    return Response.json({ ok: true });
  } catch (e) { return authFailureResponse(e); }
}
