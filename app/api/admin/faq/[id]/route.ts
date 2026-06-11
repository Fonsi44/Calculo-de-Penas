import { db } from '@/lib/db';
import { faqEntries } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { sanitizeHtml } from '@/lib/sanitize';

const updateSchema = z.object({
  category: z.string().min(1).max(200).optional(),
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    if (Object.keys(parsed).length === 0) return Response.json({ error: 'Sin campos para actualizar' }, { status: 400 });

    const values: Record<string, unknown> = { actualizadoEn: new Date() };
    if (parsed.category !== undefined) values.category = parsed.category;
    if (parsed.question !== undefined) values.question = sanitizeHtml(parsed.question);
    if (parsed.answer !== undefined) values.answer = sanitizeHtml(parsed.answer);
    if (parsed.sortOrder !== undefined) values.sortOrder = parsed.sortOrder;
    if (parsed.published !== undefined) values.published = parsed.published;

    const [updated] = await db.update(faqEntries).set(values).where(eq(faqEntries.id, id)).returning();
    if (!updated) return Response.json({ error: 'FAQ no encontrada' }, { status: 404 });

    await logAudit({ usuarioId: auth.userId, accion: 'faq_updated', recurso: 'faq', recursoId: id, metadata: { category: updated.category }, request });
    try { revalidatePath('/preguntas-frecuentes'); } catch {}

    return Response.json({ faq: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAdmin(request);
    const { id } = await params;
    const [existing] = await db.select({ id: faqEntries.id, category: faqEntries.category }).from(faqEntries).where(eq(faqEntries.id, id));
    if (!existing) return Response.json({ error: 'FAQ no encontrada' }, { status: 404 });

    await db.delete(faqEntries).where(eq(faqEntries.id, id));
    await logAudit({ usuarioId: auth.userId, accion: 'faq_deleted', recurso: 'faq', recursoId: id, metadata: { category: existing.category }, request });
    try { revalidatePath('/preguntas-frecuentes'); } catch {}

    return Response.json({ deleted: true });
  } catch (err) { return authFailureResponse(err); }
}
