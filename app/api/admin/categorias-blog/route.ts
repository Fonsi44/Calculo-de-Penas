import { db } from '@/lib/db';
import { categoriasBlog } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const schema = z.object({
  slug: z.string().min(1).max(200),
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(500).optional(),
  color: z.string().max(50).optional(),
  icono: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const rows = await db.select().from(categoriasBlog).orderBy(asc(categoriasBlog.sortOrder));
    return Response.json({ categorias: rows });
  } catch (err) { return authFailureResponse(err); }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`cat-blog:create:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = await request.json();
    const parsed = schema.parse(body);
    const [cat] = await db.insert(categoriasBlog).values(parsed).returning();
    await logAudit({ usuarioId: auth.userId, accion: 'categoria_blog_created' as any, recurso: 'categoria_blog', recursoId: cat.id, metadata: { slug: cat.slug }, request });
    return Response.json({ categoria: cat }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
