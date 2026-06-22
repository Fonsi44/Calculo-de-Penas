import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

const allowAll = [
  '/',
  '/_next/',
  '/_next/static/',
  '/_next/image',
  '/images/',
  '/fonts/',
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
];

const blockPrivate = ['/intranet/', '/api/', '/404', '/500', '/_not-found'];

export default function robots(): MetadataRoute.Robots {
  if (site.noindex) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      // === Buscadores principales (índice + imágenes) ===
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'DuckDuckBot',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: '/intranet/',
      },

      // === Asistentes IA / búsqueda generativa (valor GEO) ===
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'Claude-User',
        allow: '/',
        disallow: '/intranet/',
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: '/intranet/',
      },

      // === Scrapers / bots de bajo valor o agresivos ===
      {
        userAgent: 'Bytespider',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'Meta-ExternalAgent',
        disallow: '/',
      },
      {
        userAgent: 'Meta-ExternalFetcher',
        disallow: '/',
      },
      {
        userAgent: 'Amazonbot',
        disallow: '/',
      },
      {
        userAgent: 'ImagesiftBot',
        disallow: '/',
      },
      {
        userAgent: 'omgili',
        disallow: '/',
      },
      {
        userAgent: 'omgilibot',
        disallow: '/',
      },

      // === Regla comodín (todo lo demás) ===
      {
        userAgent: '*',
        allow: allowAll,
        disallow: blockPrivate,
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
