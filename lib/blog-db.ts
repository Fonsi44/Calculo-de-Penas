import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Comprueba si la DB es alcanzable EN ESTE MOMENTO (runtime).
 *
 * Se evalúa como función en cada llamada — no como constante de módulo —
 * para evitar que Next.js fije el valor durante el build (prerender ISR)
 * y diverja del runtime serverless, que es la causa raíz del error
 * "DATABASE_URL environment variable is required at runtime" que veía el
 * usuario en el blog público. Comprobando en cada invocación garantizamos
 * que el guard refleja el entorno real de ejecución.
 *
 * Excluye placeholders explícitos (ej. `.env.example`) para no intentar
 * conectar contra una URL inválida en local/CI.
 */
function isDbReachable(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url && !url.includes('placeholder') && !url.includes('localhost:5432/placeholder'),
  );
}

/**
 * Capa de acceso a `blog_posts`.
 *
 * Todas las funciones son resilientes: si la DB no está configurada o la
 * consulta falla en runtime (conexión, timeout, env ausente), degradan a un
 * valor neutro (`[]` / `null`) en lugar de lanzar. Así el blog público
 * renderiza su estado vacío ("Próximamente publicaremos…") o un 404 limpio,
 * nunca el error 500 "Error inesperado". El error se loguea en servidor
 * para trazabilidad, sin filtrarse al usuario.
 */
export async function getPublishedPosts(opts?: { limit?: number; category?: string; featured?: boolean }) {
  if (!isDbReachable()) return [];
  try {
    const conditions = [eq(blogPosts.published, true)];
    if (opts?.category) conditions.push(eq(blogPosts.category, opts.category));
    if (opts?.featured) conditions.push(eq(blogPosts.featured, true));

    const query = db.select().from(blogPosts)
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt));

    if (opts?.limit) query.limit(opts.limit);

    return await query;
  } catch (err) {
    console.error('[blog-db] getPublishedPosts falló; degradando a lista vacía.', err);
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  if (!isDbReachable()) return null;
  try {
    const [post] = await db.select().from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));
    return post ?? null;
  } catch (err) {
    console.error('[blog-db] getPostBySlug falló; degradando a null.', err);
    return null;
  }
}

export async function getBlogCategories() {
  if (!isDbReachable()) return [];
  try {
    const rows = await db.selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(blogPosts.category);
    return rows.map(r => r.category);
  } catch (err) {
    console.error('[blog-db] getBlogCategories falló; degradando a lista vacía.', err);
    return [];
  }
}

export async function getRelatedPosts(slug: string, category: string, limit = 3) {
  if (!isDbReachable()) return [];
  try {
    return await db.select().from(blogPosts)
      .where(and(
        eq(blogPosts.published, true),
        eq(blogPosts.category, category),
        sql`${blogPosts.slug} != ${slug}`,
      ))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
  } catch (err) {
    console.error('[blog-db] getRelatedPosts falló; degradando a lista vacía.', err);
    return [];
  }
}
