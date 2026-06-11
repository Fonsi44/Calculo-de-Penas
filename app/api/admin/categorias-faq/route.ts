import { db } from '@/lib/db';
import { categoriasFaq, type AuditoriaAccion } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { asc } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const schema = z.object({
  slug: z.string().min(1).max(200),
  titulo: z.string().min(1).max(200),
  descripcion: z.string().max(500).optional(),
  icono: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const rows = await db.select().from(categoriasFaq).orderBy(asc(categoriasFaq.sortOrder));
    return Response.json({ categorias: rows });
  } catch (err) { return authFailureResponse(err); }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`cat-faq:create:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = await request.json();
    const parsed = schema.parse(body);
    const [cat] = await db.insert(categoriasFaq).values(parsed).returning();
    await logAudit({ usuarioId: auth.userId, accion: 'categoria_faq_created' as AuditoriaAccion, recurso: 'categoria_faq', recursoId: cat.id, metadata: { slug: cat.slug }, request });
    return Response.json({ categoria: cat }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
