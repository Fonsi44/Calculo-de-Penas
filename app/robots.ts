import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * robots.txt dinámico.
 *
 * Si site.noindex === true, bloqueamos TODO para que ningún motor
 * (Google, Bing, IA, scrapers) indexe ni rastree el sitio durante
 * desarrollo. Cuando se haga el lanzamiento, se cambia
 * NEXT_PUBLIC_NOINDEX a "false" y este archivo pasa a permitir el
 * rastreo completo con declaración de sitemap.
 *
 * Política para bots de IA (Jun 2026):
 *   - Google-Extended, Applebot-Extended y FacebookBot/Crawler: PERMITIDOS
 *     para rastreo general del sitio público, para facilitar descubrimiento
 *     por asistentes de IA y motores de búsqueda generativa.
 *   - El resto de crawlers de IA/scrapers agresivos (GPTBot, Claude, etc.)
 *     permanecen bloqueados por protección de contenido.
 *   - Rutas privadas (/intranet/, /api/) bloqueadas para todos.
 *
 * Decisión documentada: permite IA selectiva para visibilidad en ecosistemas
 * emergentes (Google SGE, Apple Intelligence, Meta AI) sin exponer
 * contenido jurídico a scrapers no regulados.
 *
 * ⚠️ DECISIÓN DE NEGOCIO PENDIENTE (GEO/LLM SEO): si el objetivo es máxima
 * visibilidad en buscadores generativos (ChatGPT, Perplexity, Claude), se
 * puede desbloquear GPTBot y PerplexityBot eliminando sus reglas `disallow`.
 * Trade-off: el contenido quedará disponible para entrenamiento de modelos.
 * Esto debe aprobarlo el despacho (decisión outward-facing). Mientras tanto,
 * la política actual protege el contenido y prioriza indexación clásica.
 * Ver docs/seo-off-page.md para el contexto estratégico completo.
 *
 * SEO técnico (Jun 2026): allow EXPLÍCITO de `/_next/` y assets estáticos.
 * Los assets de Next.js (JS, CSS, chunks, imágenes optimizadas vía
 * `/_next/image` y fuentes autohospedadas por `next/font` bajo
 * `/_next/static/media/`) viven bajo `/_next/`. Googlebot los necesita para
 * ejecutar el JavaScript del framework y renderizar el contenido real (no el
 * esqueleto SSR sin estilos). Bloquear `/_next/` produce "Disallowed internal
 * resources" en auditorías SEO y degrada el rendering service de Google.
 *
 * Corrección GSC (Jun 2026): Google Search Console reportaba "No se puede
 * cargar el recurso: bloqueado por robots.txt" para 29/29 recursos de la home
 * (JS en `/_next/static/chunks/`, CSS, fuentes `.woff2` en `/_next/static/media/`
 * e imágenes en `/_next/image?url=...`). El `robots.txt` de producción NO tenía
 * un `Disallow: /_next` explícito, pero el informe era establo de una versión
 * anterior (fase `noindex=true`, que emite `Disallow: /` para `*`) que Google
 * había cacheado en su último render. La corrección añade `Allow` explícitos
 * para `/_next/`, `/_next/static/`, `/_next/image`, `/images/`, `/fonts/` y por
 * tipo de archivo (`*.js`, `*.css`, `*.woff2`, `*.png`, ...). Esto:
 *   1. Elimina cualquier ambigüedad para el parser/tester de robots.txt de GSC
 *      (cada recurso individual queda marcado como permitido).
 *   2. Al cambiar el contenido de `robots.txt`, fuerza a Google a re-fetchearlo
 *      y re-renderizar la página (resuelve el estado establo).
 *   3. Cumple la recomendación de Google Search Central y de Next.js de
 *      permitir `/_next/` expresamente.
 * Las rutas privadas (`/intranet/`, `/api/`) siguen bloqueadas: la regla
 * `Disallow` más específica prevalece sobre los `Allow` genéricos por tipo.
 * No hay assets `.js`/`.css`/`.woff2` servidos en rutas privadas literales (en
 * App Router todos viven bajo `/_next/`), así que los `Allow` por tipo no
 * filtran contenido privado.
 */
export default function robots(): MetadataRoute.Robots {
  if (site.noindex) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
        { userAgent: 'GPTBot', disallow: '/' },
        { userAgent: 'ChatGPT-User', disallow: '/' },
        { userAgent: 'PerplexityBot', disallow: '/' },
        { userAgent: 'Perplexity-User', disallow: '/' },
        { userAgent: 'anthropic-ai', disallow: '/' },
        { userAgent: 'ClaudeBot', disallow: '/' },
        { userAgent: 'Claude-Web', disallow: '/' },
        { userAgent: 'CCBot', disallow: '/' },
        { userAgent: 'Bytespider', disallow: '/' },
        { userAgent: 'Amazonbot', disallow: '/' },
        { userAgent: 'Diffbot', disallow: '/' },
        { userAgent: 'ImagesiftBot', disallow: '/' },
        { userAgent: 'Omgilibot', disallow: '/' },
      ],
    };
  }

  // Modo producción: rastreo permitido. Solo se bloquean rutas PRIVADAS.
  // `/_next/` (JS/CSS/chunks/`_next/image`/fuentes), `/images/`, `/fonts/` y
  // los assets por tipo se permiten EXPLÍCITAMENTE: Googlebot los necesita para
  // renderizar la RSC/SPA y mostrar el contenido real (no el esqueleto SSR sin
  // estilos). Las rutas privadas (`/intranet/`, `/api/`) siguen bloqueadas.
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          // Assets críticos de Next.js (JS, CSS, chunks, `_next/image`,
          // fuentes autohospedadas por next/font bajo `_next/static/media/`).
          '/_next/',
          '/_next/static/',
          '/_next/image',
          // Imágenes públicas servidas desde /public/images/.
          '/images/',
          // Fuentes públicas (/public/fonts/); las de next/font viven bajo
          // /_next/static/media/ y ya quedan cubiertas por /_next/.
          '/fonts/',
          // Permisos explícitos por tipo de archivo para que el tester de
          // robots.txt de GSC marque cada recurso individual como permitido.
          '/*.js$',
          '/*.mjs$',
          '/*.css$',
          '/*.woff$',
          '/*.woff2$',
          '/*.ttf$',
          '/*.png$',
          '/*.jpg$',
          '/*.jpeg$',
          '/*.webp$',
          '/*.avif$',
          '/*.svg$',
          '/*.ico$',
        ],
        disallow: ['/intranet/', '/api/', '/404', '/500', '/_not-found', '/login'],
      },
      // Bots de IA/scrapers bloqueados
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'PerplexityBot', disallow: '/' },
      { userAgent: 'Perplexity-User', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'ClaudeBot', disallow: '/' },
      { userAgent: 'Claude-Web', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'Amazonbot', disallow: '/' },
      { userAgent: 'Diffbot', disallow: '/' },
      { userAgent: 'ImagesiftBot', disallow: '/' },
      { userAgent: 'Omgilibot', disallow: '/' },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
