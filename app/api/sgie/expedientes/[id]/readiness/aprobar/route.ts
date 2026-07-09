import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { db } from '@/lib/db';
import { expedienteAsignaciones, expedientes } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { cambiarEstadoExpediente, type ContextoAbogado } from '@/lib/sgie/expedientes-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

/** POST /api/sgie/expedientes/:id/readiness/aprobar — abogado aprueba revisión documental */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const auth = requireAbogado(req); validateCsrf(req); const { id } = await params;
    const rl = await rateLimit(`sgie:readiness:${auth.userId}`, { max: 15, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    if (auth.rol !== 'admin') { const [a] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones).where(and(eq(expedienteAsignaciones.expedienteId, id), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))); if (!a) return Response.json({ error: 'Sin acceso' }, { status: 403 }); }
    const ctx: ContextoAbogado = { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
    const r = await cambiarEstadoExpediente(id, 'pendiente_validacion_abogado', ctx);
    if (r === null) return Response.json({ error: 'No encontrado' }, { status: 404 });
    await logSgie({ usuarioId: auth.userId, accion: 'case_documental_review_approved', recurso: 'expediente', recursoId: id, metadata: { estadoAnterior: r.estadoAnterior }, request: req });
    return Response.json({ ok: true });
  } catch (e) { return authFailureResponse(e); }
}
