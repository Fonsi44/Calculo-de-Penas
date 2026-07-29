export const PUBLIC_CRAWLER_DISALLOW_PATHS = [
  '/intranet/',
  '/admin/',
  '/api/',
  '/calculadora/',
  '/casos/',
  '/cp/',
  '/delitos/',
  '/atajos/',
  '/preview/',
  '/404',
  '/500',
  '/_not-found',
] as const;

export const PUBLIC_ALLOWED_ASSET_PATHS = [
  '/',
  '/_next/',
  '/_next/static/',
  '/_next/image',
  '/images/',
  '/fonts/',
  '/*.js$',
  '/*.css$',
  '/*.woff2$',
  '/*.png$',
  '/*.webp$',
  '/*.svg$',
] as const;

export const ALLOWED_CRAWLER_USER_AGENTS = [
  'Googlebot',
  'Googlebot-Image',
  'Bingbot',
  'DuckDuckBot',
  'Applebot',
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'PerplexityBot',
  'ClaudeBot',
  'Claude-User',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'YouBot',
  'Diffbot',
] as const;

export const FULLY_BLOCKED_USER_AGENTS = [
  'Bytespider',
  'CCBot',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'Amazonbot',
  'ImagesiftBot',
  'omgili',
  'omgilibot',
] as const;
