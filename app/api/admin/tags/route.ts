import { db } from '@/lib/db';
import { tags, type AuditoriaAccion } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { asc, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const createSchema = z.object({
  slug: z.string().min(1).max(200),
  nombre: z.string().min(1).max(200),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const query = db.select().from(tags).orderBy(asc(tags.nombre));
    const rows = q ? await query.where(ilike(tags.nombre, `%${q}%`)) : await query;
    return Response.json({ tags: rows });
  } catch (err) { return authFailureResponse(err); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`tags:create:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const [tag] = await db.insert(tags).values(parsed).returning();
    await logAudit({ usuarioId: auth.userId, accion: 'tag_created' as AuditoriaAccion, recurso: 'tag', recursoId: tag.id, metadata: { slug: tag.slug }, request });
    return Response.json({ tag }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
