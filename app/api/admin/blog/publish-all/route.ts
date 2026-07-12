import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { eq, sql, and } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

/**
 * Umbral mínimo de palabras para publicar (R13). Consistente con
 * /api/admin/blog y /api/admin/blog/[id].
 */
const MIN_WORDS_TO_PUBLISH = 800;

/**
 * Solo se publican en masa los borradores cuyo body alcance el peso editorial
 * mínimo. Los que no lo alcanzan se cuentan como `skipped` para que el admin
 * sepa cuántos quedaron pendientes de edición (H16).
 *
 * El filtro se hace con una regex sobre el body sin tags directamente en SQL
 * (PostgreSQL): cuenta secuencias de no-espacios tras eliminar tags HTML.
 * Es una aproximación suficientemente precisa para el umbral editorial.
 */
const WORD_COUNT_EXPR = sql<number>`array_length(string_to_array(regexp_replace(${blogPosts.body}, '<[^>]+>', ' ', 'g'), '\s+'), 1)`;

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);

    // Publicar solo los borradores con peso editorial suficiente.
    const [result] = await db.update(blogPosts)
      .set({ published: true, updatedAt: new Date() })
      .where(and(
        eq(blogPosts.published, false),
        sql`${WORD_COUNT_EXPR} >= ${MIN_WORDS_TO_PUBLISH}`,
      ))
      .returning({ count: sql<number>`count(*)::int` });

    // Contar cuántos se saltaron por no alcanzar el mínimo (informativo).
    const [skippedRow] = await db.select({ count: sql<number>`count(*)::int` })
      .from(blogPosts)
      .where(and(
        eq(blogPosts.published, false),
        sql`${WORD_COUNT_EXPR} < ${MIN_WORDS_TO_PUBLISH}`,
      ));

    const published = result?.count ?? 0;
    const skipped = skippedRow?.count ?? 0;

    await logAudit({
      usuarioId: auth.userId,
      accion: 'blog_updated',
      recurso: 'blog',
      recursoId: 'bulk-publish',
      metadata: { action: 'publish_all', published, skippedThin: skipped },
      request,
    });

    try {
      revalidatePath('/blog');
      revalidatePath('/blog/[categoria]');
      revalidatePath('/blog/[categoria]/[slug]');
    } catch {}

    return Response.json({
      published,
      skipped,
      ...(skipped > 0 ? { message: `${skipped} borrador(es) requieren ampliación editorial (mínimo ${MIN_WORDS_TO_PUBLISH} palabras, R13) antes de poder publicarse.` } : {}),
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
