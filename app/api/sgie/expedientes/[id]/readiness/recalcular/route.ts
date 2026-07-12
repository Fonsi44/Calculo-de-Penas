import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { db } from '@/lib/db';
import { expedienteAsignaciones } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { evaluarPreparacionExpediente } from '@/lib/sgie/readiness';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

/** POST /api/sgie/expedientes/:id/readiness/recalcular */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const auth = await requireAbogado(req); validateCsrf(req); const { id } = await params;
    const rl = await rateLimit(`sgie:readiness:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    if (auth.rol !== 'admin') { const [a] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones).where(and(eq(expedienteAsignaciones.expedienteId, id), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))); if (!a) return Response.json({ error: 'Sin acceso' }, { status: 403 }); }
    const result = await evaluarPreparacionExpediente(id);
    await logSgie({ usuarioId: auth.userId, accion: 'readiness_evaluation_completed', recurso: 'expediente', recursoId: id, metadata: { runId: result?.runId }, request: req });
    return Response.json({ ok: true, result: result ? { runId: result.runId, estadoFinal: result.estadoFinal, score: result.score } : null });
  } catch (e) { return authFailureResponse(e); }
}
