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
 * Bots de IA y scrapers quedan permanentemente bloqueados por
 * decisión de protección de contenido jurídico原创.
 */
export default function robots(): MetadataRoute.Robots {
  if (site.noindex) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
        // Bloqueo explícito a bots de IA y scrapers comunes
        { userAgent: 'GPTBot', disallow: '/' },
        { userAgent: 'ChatGPT-User', disallow: '/' },
        { userAgent: 'Google-Extended', disallow: '/' },
        { userAgent: 'PerplexityBot', disallow: '/' },
        { userAgent: 'Perplexity-User', disallow: '/' },
        { userAgent: 'anthropic-ai', disallow: '/' },
        { userAgent: 'ClaudeBot', disallow: '/' },
        { userAgent: 'Claude-Web', disallow: '/' },
        { userAgent: 'CCBot', disallow: '/' },
        { userAgent: 'Bytespider', disallow: '/' },
        { userAgent: 'Amazonbot', disallow: '/' },
        { userAgent: 'Applebot-Extended', disallow: '/' },
        { userAgent: 'FacebookBot', disallow: '/' },
        { userAgent: 'Meta-ExternalAgent', disallow: '/' },
        { userAgent: 'Diffbot', disallow: '/' },
        { userAgent: 'ImagesiftBot', disallow: '/' },
        { userAgent: 'Omgilibot', disallow: '/' },
        { userAgent: 'OAI-SearchBot', disallow: '/' },
      ],
    };
  }

  // Modo producción: rastreo permitido, intranet y APIs bloqueadas
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/intranet/', '/api/', '/_next/', '/404', '/500'],
      },
      // IA y scrapers siguen bloqueados por protección de contenido原创
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
      { userAgent: 'PerplexityBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'ClaudeBot', disallow: '/' },
      { userAgent: 'Claude-Web', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'Amazonbot', disallow: '/' },
      { userAgent: 'Applebot-Extended', disallow: '/' },
      { userAgent: 'FacebookBot', disallow: '/' },
      { userAgent: 'Meta-ExternalAgent', disallow: '/' },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
