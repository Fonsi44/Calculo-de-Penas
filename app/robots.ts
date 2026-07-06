import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';



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

      // === Bots GEO adicionales: Google AI, Apple AI, You.com, Diffbot ===
      // Google-Extended: controla si el contenido se usa en Gemini y Search AI.
      // Applebot-Extended: controla ingesta en Apple Intelligence.
      // YouBot: motor de búsqueda AI-native con alta visibilidad en respuestas.
      // Diffbot: alimenta Knowledge Graph de múltiples LLMs.
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'YouBot',
        allow: '/',
        disallow: blockSearchBots,
      },
      {
        userAgent: 'Diffbot',
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
      // allow: '/' en vez de allowAll: allowAll solo permitía extensiones de
      // archivo (/*.js$, /*.css$…) pero no la raíz HTML, lo que impedía que
      // bots no listados accedieran a páginas. Con '/' se bloquea solo
      // blockPrivate y se permite el resto del sitio público.
      {
        userAgent: '*',
        allow: ['/', '/_next/', '/_next/static/', '/_next/image', '/images/', '/fonts/', '/*.js$', '/*.css$', '/*.woff2$', '/*.png$', '/*.webp$', '/*.svg$'],
        disallow: blockPrivate,
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
