import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { db } from '@/lib/db';
import { expedienteAsignaciones } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { cambiarEstadoExpediente, type ContextoAbogado } from '@/lib/sgie/expedientes-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const bodySchema = z.object({ motivo: z.string().min(1).max(500).optional() });

/** POST /api/sgie/expedientes/:id/readiness/devolver — abogado devuelve por doc. incompleta */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const auth = requireAbogado(req); validateCsrf(req); const { id } = await params;
    const rl = await rateLimit(`sgie:readiness:${auth.userId}`, { max: 15, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = bodySchema.parse(await req.json().catch(() => ({})));
    if (auth.rol !== 'admin') { const [a] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones).where(and(eq(expedienteAsignaciones.expedienteId, id), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))); if (!a) return Response.json({ error: 'Sin acceso' }, { status: 403 }); }
    const ctx: ContextoAbogado = { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
    const r = await cambiarEstadoExpediente(id, 'devuelto_por_abogado', ctx);
    if (r === null) return Response.json({ error: 'No encontrado' }, { status: 404 });
    await logSgie({ usuarioId: auth.userId, accion: 'case_returned_by_lawyer', recurso: 'expediente', recursoId: id, metadata: { motivo: body.motivo ?? null, estadoAnterior: r.estadoAnterior }, request: req });
    return Response.json({ ok: true });
  } catch (e) { if (e instanceof z.ZodError) return Response.json({ error: 'Datos inválidos' }, { status: 400 }); return authFailureResponse(e); }
}
