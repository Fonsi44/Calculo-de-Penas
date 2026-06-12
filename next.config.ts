import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
// Indexable por defecto en producción. Solo anti-indexar si
// NEXT_PUBLIC_NOINDEX=true explícito (staging, previews).
const noindexActive = process.env.NEXT_PUBLIC_NOINDEX === 'true';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://*.tile.openstreetmap.org https://*.openstreetmap.org",
  "frame-src 'self' https://www.openstreetmap.org",
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
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
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
   * Optimización de imágenes activada vía /_next/image.
   *   - Convierte automáticamente a WebP/AVIF cuando el navegador lo soporta.
   *   - Genera srcset responsivo para cada deviceSize/imageSize configurado.
   *   - Los componentes ServiceCard y BlogCard ya usan `fill` con contenedores
   *     de aspecto fijo (aspect-[4/3], aspect-[21/9], etc.), lo que garantiza
   *     dimensiones conocidas para el optimizador.
   *   - deviceSizes estándar: móvil (640w), tablet (1080w), desktop (1920w).
   */
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
  },
  // El redirect www → apex lo gestiona Vercel a nivel de dominio
  // (Settings → Domains → Redirect). Aquí solo mantenemos los legacy redirects.
  // IMPORTANTE: NO redirigir /login → /intranet/login (causaba bucles).
  async redirects() {
    return [
      { source: '/inicio', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/areas-de-practica', destination: '/servicios-juridicos', permanent: true },
      { source: '/areas-de-practica/:path*', destination: '/servicios-juridicos/:path*', permanent: true },
      { source: '/derecho-penal-hondureno', destination: '/derecho-penal', permanent: true },
      { source: '/proceso-penal', destination: '/hondurenos-en-espana', permanent: true },
      { source: '/contacto', destination: '/solicitar-consulta', permanent: true },
      { source: '/privacidad', destination: '/politica-privacidad', permanent: true },
      // === CONSOLIDACIÓN DE BLOG: redirecciones 301 post-auditoría (Jun 2026) ===
      // Fusiones por canibalización: 2 posts → 1
      { source: '/blog/derecho-de-familia/pension-alimenticia-calcular-reclamar-honduras', destination: '/blog/derecho-de-familia/pension-alimenticia-honduras-como-solicitarla', permanent: true },
      { source: '/blog/derecho-de-familia/guarda-custodia-menores-tipos-honduras', destination: '/blog/derecho-de-familia/custodia-hijos-honduras-juez', permanent: true },
      { source: '/blog/derecho-laboral/despido-laboral-honduras-derechos', destination: '/blog/derecho-laboral/despido-injustificado-honduras-derechos-trabajador', permanent: true },
      { source: '/blog/derecho-laboral/calcular-prestaciones-laborales-honduras', destination: '/blog/derecho-laboral/calcular-liquidacion-laboral-honduras', permanent: true },
      { source: '/blog/derecho-mercantil/contratos-mercantiles-proteger-negocio', destination: '/blog/derecho-mercantil/contratos-mercantiles-esenciales-empresas-honduras', permanent: true },
      { source: '/blog/derecho-civil/herencias-honduras-fallece-familiar', destination: '/blog/derecho-civil/testamentos-sucesiones-herencia-honduras', permanent: true },
      // Posts genéricos redirigidos a páginas de categoría/servicio
      { source: '/blog/hondurenos-en-espana/hondurenos-en-espana-guia-legal-completa', destination: '/hondurenos-en-espana', permanent: true },
      { source: '/blog/derecho-notarial/tramites-notariales-frecuentes-honduras', destination: '/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita', permanent: true },
      // Canibalización cruzada: derechos del detenido → guía práctica de detención
      { source: '/blog/derechos-ciudadanos/derechos-del-detenido-guia-constitucional-honduras', destination: '/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras', permanent: true },
    ];
  },
  // Rewrites: exponen las paginas intranet bajo el namespace /intranet/*
  // para que el sidebar y los enlaces canónicos apunten a /intranet/calculadora,
  // /intranet/casos, etc., sin mover los archivos page.tsx existentes.
  // El proxy ya permite /intranet/* a usuarios autenticados.
  async rewrites() {
    return [
      { source: '/intranet/calculadora', destination: '/calculadora' },
      { source: '/intranet/casos', destination: '/casos' },
      { source: '/intranet/casos/:id', destination: '/casos/:id' },
      { source: '/intranet/cp', destination: '/cp' },
      { source: '/intranet/cp/:id', destination: '/cp/:id' },
      { source: '/intranet/delitos', destination: '/delitos' },
      { source: '/intranet/atajos', destination: '/atajos' },
      // IndexNow key: sirve KEY.txt desde la raíz via /api/indexnow-key
      { source: '/:key.txt', destination: '/api/indexnow-key' },
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
      {
        // Cache estático: imágenes, fuentes, JS/CSS build de Next.js
        source: '/:path(.+\\.(?:png|jpg|jpeg|svg|webp|avif|ico|woff2?|ttf|js|css))',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
