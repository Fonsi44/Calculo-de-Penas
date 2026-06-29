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

const blockPrivate = [
  '/intranet/',
  '/api/',
  '/404',
  '/500',
  '/_not-found',
  '/calculadora/',
  '/casos/',
  '/cp/',
  '/delitos/',
  '/atajos/',
  '/admin/',
];

// Rutas privadas adicionales que los buscadores principales también deben evitar.
// El proxy ya las protege (401/redirect), pero el Disallow ahorra crawl budget.
const blockSearchBots = [
  '/intranet/',
  '/calculadora/',
  '/casos/',
  '/cp/',
  '/delitos/',
  '/atajos/',
  '/admin/',
];

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
        disallow: blockSearchBots,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'DuckDuckBot',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: blockSearchBots,
      },

      // === Asistentes IA / búsqueda generativa (valor GEO) ===
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'Claude-User',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: blockSearchBots,
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
