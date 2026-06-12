import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { gte, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);

    const now = new Date();

    // Encontrar todos los posts con fecha futura
    const futurePosts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        publishedAt: blogPosts.publishedAt,
        category: blogPosts.category,
      })
      .from(blogPosts)
      .where(gte(blogPosts.publishedAt, now));

    if (futurePosts.length === 0) {
      return Response.json({
        message: 'No hay posts con fechas futuras. Nada que corregir.',
        updated: 0,
      });
    }

    // Calcular cuántos días restar
    // Diferencia entre la fecha futura más reciente y ayer
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const latestFuture = new Date(
      Math.max(...futurePosts.map((p) => p.publishedAt.getTime())),
    );
    const msToSubtract = latestFuture.getTime() - yesterday.getTime();
    const daysToSubtract = Math.ceil(msToSubtract / (1000 * 60 * 60 * 24));

    const results: { slug: string; oldDate: string; newDate: string }[] = [];
    const categories = new Set<string>();

    for (const post of futurePosts) {
      const oldDate = new Date(post.publishedAt);
      const newDate = new Date(oldDate);
      newDate.setDate(newDate.getDate() - daysToSubtract);

      await db
        .update(blogPosts)
        .set({
          publishedAt: newDate,
          updatedAt: newDate,
        })
        .where(sql`${blogPosts.id} = ${post.id}`);

      results.push({
        slug: post.slug,
        oldDate: oldDate.toISOString().split('T')[0],
        newDate: newDate.toISOString().split('T')[0],
      });
      categories.add(post.category);
    }

    // Revalidar caché
    try {
      revalidatePath('/blog');
      for (const cat of categories) {
        revalidatePath(`/blog/${cat}`);
      }
      for (const r of results) {
        revalidatePath(`/blog/${r.slug}`);
      }
    } catch {}

    await logAudit({
      usuarioId: auth.userId,
      accion: 'blog_updated',
      recurso: 'blog',
      recursoId: 'bulk-fix-dates',
      metadata: {
        updatedCount: results.length,
        daysSubtracted: daysToSubtract,
        prevLatest: latestFuture.toISOString(),
        newLatest: results[0]?.newDate,
      },
      request,
    });

    return Response.json({
      message: `${results.length} posts actualizados (restados ${daysToSubtract} días)`,
      updated: results.length,
      daysSubtracted: daysToSubtract,
      prevLatest: latestFuture.toISOString().split('T')[0],
      newLatest: results[0]?.newDate,
      sample: results.slice(0, 3),
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
