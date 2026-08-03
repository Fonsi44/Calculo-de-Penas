/**
 * On-Demand Revalidation endpoint.
 *
 * Permite forzar la regeneración ISR de páginas del blog (y otras rutas
 * públicas) sin esperar al ciclo de `revalidate = 3600` (1 hora).
 *
 * Caso de uso principal (Fase 3D/3E): tras aplicar un recálculo de
 * `ai_review_status` o una corrección de body en DB Neon, el HTML público
 * puede tardar hasta 1h en reflejar el cambio. Este endpoint permite
 * invalidar la caché de la ruta concreta de inmediato.
 *
 * AUTORIZACIÓN (Fase 3E):
 *   - Header `Authorization: Bearer <CRON_SECRET>`, comparado con
 *     `crypto.timingSafeEqual` (anti timing-attack). Mismo secreto que los
 *     cron de SGIE. Si CRON_SECRET no está configurado, 401.
 *   - Rate limit por IP (30/min) defensivo: aunque el secret es la barrera
 *     principal, el rate limit mitiga abusos si el secret se filtra o si un
 *     cliente legítimo entra en bucle accidental.
 *
 * ALLOWLIST DE PATHS (Fase 3E):
 *   `type: 'path'` solo acepta rutas bajo prefijos públicos explícitos. Esto
 *   impide revalidar (y forzar regeneración de) rutas arbitrarias o privadas
 *   (/intranet/*, /api/*, /admin/*, etc.) aunque el caller conozca el secret.
 *   `type: 'slug'` es intrínsecamente seguro: resuelve el path vía DB.
 *
 * LOGGING SIN SECRETOS (Fase 3E):
 *   Los logs estructurados registran paths revalidados, errores y duración,
 *   pero NUNCA el valor de CRON_SECRET ni el header Authorization completo.
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
import { getPublishedPostRouteBySlug } from '@/lib/blog-db';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';

const bodySchema = z.object({
  type: z.enum(['path', 'slug']),
  value: z.union([z.string().min(1).max(500), z.array(z.string().min(1).max(500)).max(50)]),
});

/**
 * Prefijos públicos permitidos para `type: 'path'`. Una ruta solo se revalida
 * si comienza exactamente con uno de ellos. Rutas privadas (/intranet, /api,
 * /admin, /calculadora, /casos, /cp, /delitos, /preview) quedan excluidas por
 * construcción: no aparecen aquí y, aunque se pasen, se rechazan con 400.
 */
const ALLOWED_PATH_PREFIXES = [
  '/blog',
  '/preguntas-frecuentes',
  '/abogados-en-',
  // Landings de abogados penalistas por ciudad (Lote 1 Penal, p.ej.
  // /abogado-penalista-choluteca, /abogado-penalista-sur-honduras).
  '/abogado-penalista-',
  '/servicios-juridicos',
  '/derecho-',
  '/solicitar-consulta',
  '/como-llegar',
  '/despacho',
  '/hondurenos-en-espana',
  '/',
];

function isAllowedPath(p: string): boolean {
  // Normalizar: debe empezar por '/', sin query string ni fragmento.
  if (!p.startsWith('/')) return false;
  const clean = p.split('?')[0].split('#')[0];
  // Coincidencia exacta o prefijo con barra (igual que PRIVATE_ROUTES del SW).
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => clean === prefix || clean.startsWith(prefix + '/') || (prefix === '/' && clean.startsWith('/')),
  );
}

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

  // Rate limit defensivo por IP (30/min). El secret es la barrera principal;
  // esto mitiga bucles accidentales o abuso si el secret se compromete.
  const ip = getClientIp(request);
  const rl = await rateLimit(`revalidate:${ip}`, {
    max: 30,
    windowMs: 60_000,
    keyPrefix: 'revalidate',
  });
  if (!rl.ok) return rateLimitResponse(rl);

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
  const rechazados: string[] = [];

  for (const v of values) {
    try {
      if (parsed.type === 'slug') {
        // Resolver la ruta canónica del post: /blog/<categoria>/<slug>.
        // Intrínsecamente seguro: el path se construye desde la DB, no desde
        // entrada del usuario.
        const post = await getPublishedPostRouteBySlug(v);
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
        // type === 'path': aplicar allowlist antes de revalidar.
        if (!isAllowedPath(v)) {
          rechazados.push(v);
          continue;
        }
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

  // Log estructurado sin secretos: solo paths, conteos y duración relativa.
  console.log(
    JSON.stringify({
      msg: '[revalidate] ok',
      type: parsed.type,
      count: revalidated.length,
      errores: errores.length,
      rechazados: rechazados.length,
      // No se loguean los paths completos si la lista es grande; solo el
      // primer elemento a modo de muestra diagnóstica.
      sample: revalidated[0] ?? null,
    }),
  );

  return Response.json({
    ok: true,
    revalidated,
    errores,
    rechazados,
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
