import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq, sql } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);

    const [result] = await db.update(blogPosts)
      .set({ published: true, updatedAt: new Date() })
      .where(eq(blogPosts.published, false))
      .returning({ count: sql<number>`count(*)::int` });

    await logAudit({
      usuarioId: auth.userId,
      accion: 'blog_updated',
      recurso: 'blog',
      recursoId: 'bulk-publish',
      metadata: { action: 'publish_all', updated: result?.count ?? 0 },
      request,
    });

    try {
      revalidatePath('/blog');
      revalidatePath('/blog/[categoria]');
      revalidatePath('/blog/[categoria]/[slug]');
    } catch {}

    return Response.json({ published: result?.count ?? 0 });
  } catch (err) {
    return authFailureResponse(err);
  }
}
