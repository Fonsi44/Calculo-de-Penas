import { db } from '@/lib/db';
import { areasJuridicas, type AuditoriaAccion } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const createSchema = z.object({
  slug: z.string().min(1).max(200),
  titulo: z.string().min(1).max(300),
  descripcionCorta: z.string().optional(),
  descripcionLarga: z.string().optional(),
  icono: z.string().max(100).optional(),
  imagen: z.string().max(500).optional(),
  categoria: z.enum(['servicio', 'penal', 'migrante']).default('servicio'),
  grupo: z.string().max(200).optional(),
  subservicios: z.array(z.object({ titulo: z.string(), descripcion: z.string() })).optional(),
  faqs: z.array(z.object({ pregunta: z.string(), respuesta: z.string() })).optional(),
  sortOrder: z.number().int().optional(),
  estado: z.enum(['borrador', 'publicado']).default('publicado'),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const where = categoria ? eq(areasJuridicas.categoria, categoria) : undefined;
    const rows = await db.select().from(areasJuridicas).where(where).orderBy(asc(areasJuridicas.sortOrder));
    return Response.json({ areas: rows });
  } catch (err) { return authFailureResponse(err); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`areas:create:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const [area] = await db.insert(areasJuridicas).values(parsed).returning();
    await logAudit({ usuarioId: auth.userId, accion: 'area_juridica_created' as AuditoriaAccion, recurso: 'area_juridica', recursoId: area.id, metadata: { slug: area.slug }, request });
    return Response.json({ area }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });
    const body = await request.json();
    const [area] = await db.update(areasJuridicas).set({ ...body, actualizadoEn: new Date() }).where(eq(areasJuridicas.id, id)).returning();
    if (!area) return Response.json({ error: 'Área no encontrada' }, { status: 404 });
    await logAudit({ usuarioId: auth.userId, accion: 'area_juridica_updated' as AuditoriaAccion, recurso: 'area_juridica', recursoId: id, request });
    return Response.json({ area });
  } catch (err) { return authFailureResponse(err); }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });
    const [area] = await db.delete(areasJuridicas).where(eq(areasJuridicas.id, id)).returning();
    if (!area) return Response.json({ error: 'Área no encontrada' }, { status: 404 });
    await logAudit({ usuarioId: auth.userId, accion: 'area_juridica_deleted' as AuditoriaAccion, recurso: 'area_juridica', recursoId: id, request });
    return Response.json({ deleted: true });
  } catch (err) { return authFailureResponse(err); }
}
