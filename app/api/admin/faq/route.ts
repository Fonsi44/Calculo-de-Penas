import { db } from '@/lib/db';
import { faqEntries } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

const createSchema = z.object({
  category: z.string().min(1).max(200),
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const where = category ? eq(faqEntries.category, category) : undefined;
    const rows = await db.select().from(faqEntries).where(where).orderBy(asc(faqEntries.sortOrder), asc(faqEntries.creadoEn));

    const grouped: Record<string, typeof rows> = {};
    for (const row of rows) { if (!grouped[row.category]) grouped[row.category] = []; grouped[row.category].push(row); }

    return Response.json({ faqs: rows, grouped });
  } catch (err) { return authFailureResponse(err); }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const [entry] = await db.insert(faqEntries).values({
      category: parsed.category, question: parsed.question, answer: parsed.answer,
      sortOrder: parsed.sortOrder, published: parsed.published,
    }).returning();

    await logAudit({ usuarioId: auth.userId, accion: 'faq_created', recurso: 'faq', recursoId: entry.id, metadata: { category: entry.category }, request });
    revalidatePath('/preguntas-frecuentes');

    return Response.json({ faq: entry }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
