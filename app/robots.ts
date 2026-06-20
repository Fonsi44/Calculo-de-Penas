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
 * SEO técnico (Jun 2026): NO se bloquea `/_next/`. Los assets de Next.js
 * (CSS y JS de renderizado) viven bajo `/_next/static/` y Googlebot los
 * necesita para ejecutar el JavaScript del framework y renderizar el contenido
 * client-side. Bloquear `/_next/` produce "Disallowed internal resources" en
 * auditorías SEO (Googlebot recibe 403/Disallowed al intentar descargar el JS
 * crítico) y degrada el rendering service. Las guías oficiales de Google
 * Search Central y de Next.js recomiendan expresamente permitir `/_next/`.
 * Tampoco se bloquea `/icon-*.svg`, `/og-image.webp` ni fuentes: son recursos
 * públicos necesarios para el render fiel de la página.
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
  // `/_next/` y `/icon-*`, `/og-image.webp`, `/fonts`, `/manifest.json` se
  // permiten: Googlebot necesita los assets para renderizar la SPA/RSC y
  // mostrar el contenido real (no el esqueleto SSR sin estilos).
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
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
