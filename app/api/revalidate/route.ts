/**
 * On-Demand Revalidation endpoint.
 *
 * Permite forzar la regeneración ISR de páginas del blog (y otras rutas
 * públicas) sin esperar al ciclo de `revalidate = 3600` (1 hora).
 *
 * Caso de uso principal (Fase 3D): tras aplicar un recálculo de
 * `ai_review_status` o una corrección de body en DB Neon, el HTML público
 * puede tardar hasta 1h en reflejar el cambio. Este endpoint permite
 * invalidar la caché de la ruta concreta de inmediato.
 *
 * Autorización: header `Authorization: Bearer <CRON_SECRET>` (mismo patrón
 * que `app/api/cron/sgie/procesar/route.ts:23`, reforzado con
 * `crypto.timingSafeEqual` para evitar timing attacks).
 *
 * Body (JSON):
 *   { "type": "path", "value": "/blog/penal/mi-slug" }
 *   { "type": "path", "value": ["/blog/penal/slug-a", "/blog/penal/slug-b"] }
 *   { "type": "slug",  "value": "mi-slug" }   // resuelve /blog/<categoria>/<slug>
 *
 * No requiere runtime=edge: revalidatePath necesita el cache handler de Node.
 */
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'crypto';
import { getPostBySlug } from '@/lib/blog-db';

const bodySchema = z.object({
  type: z.enum(['path', 'slug']),
  value: z.union([z.string().min(1).max(500), z.array(z.string().min(1).max(500)).max(50)]),
});

function autorizado(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.trim().length === 0) return false;
  const auth = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret.trim()}`;
  if (auth.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!autorizado(request)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json(
        { error: 'Datos inválidos', details: err.issues },
        { status: 400 },
      );
    }
    return Response.json({ error: 'Body inválido' }, { status: 400 });
  }

  const values = Array.isArray(parsed.value) ? parsed.value : [parsed.value];
  const revalidated: string[] = [];
  const errores: Array<{ value: string; error: string }> = [];

  for (const v of values) {
    try {
      if (parsed.type === 'slug') {
        // Resolver la ruta canónica del post: /blog/<categoria>/<slug>.
        const post = await getPostBySlug(v);
        if (!post) {
          errores.push({ value: v, error: 'Post no encontrado (¿no publicado?)' });
          continue;
        }
        const categoria = post.category ?? 'penal';
        const paths = [
          `/blog/${categoria}/${v}`,
          `/blog/${categoria}`,
          `/blog`,
        ];
        for (const p of paths) {
          revalidatePath(p, 'page');
          revalidated.push(p);
        }
      } else {
        // type === 'path': revalidar la ruta literal.
        revalidatePath(v, 'page');
        revalidated.push(v);
      }
    } catch (err) {
      errores.push({
        value: v,
        error: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }

  return Response.json({
    ok: true,
    revalidated,
    errores,
    count: revalidated.length,
  });
}

// GET devuelve 405: este endpoint requiere POST con body JSON.
// (Vercel Cron envía POST con Authorization: Bearer <CRON_SECRET> por defecto.)
export async function GET() {
  return Response.json(
    { error: 'Método no permitido. Usa POST con body { type, value }.' },
    { status: 405 },
  );
}
