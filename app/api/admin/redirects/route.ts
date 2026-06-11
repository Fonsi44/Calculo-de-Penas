import { db } from '@/lib/db';
import { redirects, type AuditoriaAccion } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const schema = z.object({
  origen: z.string().min(1).max(500),
  destino: z.string().min(1).max(500),
  tipo: z.number().int().default(301),
  activo: z.boolean().default(true),
});

export async function GET() {
  try {
    const rows = await db.select().from(redirects).orderBy(desc(redirects.creadoEn));
    return Response.json({ redirects: rows });
  } catch (err) { return authFailureResponse(err); }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`redirects:create:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = await request.json();
    const parsed = schema.parse(body);
    const [r] = await db.insert(redirects).values(parsed).returning();
    await logAudit({ usuarioId: auth.userId, accion: 'redirect_created' as AuditoriaAccion, recurso: 'redirect', recursoId: r.id, metadata: { origen: r.origen, destino: r.destino }, request });
    return Response.json({ redirect: r }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
