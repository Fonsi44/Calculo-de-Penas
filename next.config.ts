import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
// Por defecto bloqueamos indexación hasta lanzamiento oficial.
// Para permitir indexación: NEXT_PUBLIC_NOINDEX=false (explícito).
const noindexActive = process.env.NEXT_PUBLIC_NOINDEX !== 'false';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://www.google-analytics.com https://*.clarity.ms https://*.analytics.google.com https://*.tile.openstreetmap.org https://*.openstreetmap.org",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Nota: NO incluimos `upgrade-insecure-requests` porque rompe los
  // tests e2e (el servidor HTTP local de Playwright no soporta HTTPS)
  // y es redundante en producción (HSTS ya fuerza HTTPS vía cabecera).
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Content-Security-Policy', value: csp },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

const robotsHeader = noindexActive
  ? { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' }
  : { key: 'X-Robots-Tag', value: 'index, follow, max-image-preview:large, max-snippet:-1' };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * Las imágenes se sirven tal cual desde /public/images/* sin pasar por
   * el optimizador /_next/image. Justificación:
   *   - El optimizer añade latencia significativa y devuelve 400 si la
   *     imagen no encaja en sus dimensiones permitidas.
   *   - Las fotos corporativas ya están descargadas en su tamaño final
   *     desde Pexels/Unsplash (100-500 KB cada una) y no requieren
   *     redimensionado en runtime.
   *   - El tamaño total del bundle de imágenes (~6.5 MB) es aceptable
   *     para una web de bufete con audiencias de Honduras/España.
   * Para volver a habilitar la optimización: cambiar a `false` y
   * configurar `images.remotePatterns` si se sirven URLs externas.
   */
  images: {
    unoptimized: true,
  },
  // El redirect www → apex lo gestiona Vercel a nivel de dominio
  // (Settings → Domains → Redirect). Aquí solo mantenemos los legacy redirects.
  // IMPORTANTE: NO redirigir /login → /intranet/login (causaba bucles).
  async redirects() {
    return [
      { source: '/inicio', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/areas-de-practica', destination: '/areas-juridicas', permanent: true },
      { source: '/areas-de-practica/:path*', destination: '/areas-juridicas/:path*', permanent: true },
      { source: '/derecho-penal-hondureno', destination: '/derecho-penal', permanent: true },
      { source: '/proceso-penal', destination: '/migrantes-hondurenos-en-espana', permanent: true },
      { source: '/privacidad', destination: '/politica-privacidad', permanent: true },
    ];
  },
  // Rewrites: exponen las paginas intranet bajo el namespace /intranet/*
  // para que el sidebar y los enlaces canónicos apunten a /intranet/calculadora,
  // /intranet/casos, etc., sin mover los archivos page.tsx existentes.
  // El middleware ya permite /intranet/* a usuarios autenticados.
  async rewrites() {
    return [
      { source: '/intranet/calculadora', destination: '/calculadora' },
      { source: '/intranet/casos', destination: '/casos' },
      { source: '/intranet/casos/:id', destination: '/casos/:id' },
      { source: '/intranet/cp', destination: '/cp' },
      { source: '/intranet/cp/:id', destination: '/cp/:id' },
      { source: '/intranet/delitos', destination: '/delitos' },
      { source: '/intranet/atajos', destination: '/atajos' },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders, robotsHeader],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/intranet/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
