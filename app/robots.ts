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
 * contenido jurídico原创 a scrapers no regulados.
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

  // Modo producción: rastreo permitido, recursos críticos explícitamente accesibles,
  // solo se bloquean rutas privadas (intranet, API, errores).
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/_next/static/', '/_next/image', '/images/'],
        disallow: ['/intranet/', '/api/', '/404', '/500', '/_not-found'],
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
  };
}
