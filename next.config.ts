import type { NextConfig } from 'next';
// Bundle analyzer: activo solo cuando ANALYZE=true. Genera reportes en
// `.next/analyze/` para inspeccionar chunks JS/CSS por ruta. Import dinámico
// (sin `require`) para no arrastrar la dep a cold start y pasar ESLint.
const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@next/bundle-analyzer')({ enabled: true })
    : (cfg: NextConfig) => cfg;

const isProd = process.env.NODE_ENV === 'production';
// Indexable por defecto en producción. Solo anti-indexar si
// NEXT_PUBLIC_NOINDEX=true explícito (staging, previews).
const noindexActive = process.env.NEXT_PUBLIC_NOINDEX === 'true';

// CSP en producción: restringe orígenes de imagen a una lista explícita y
// añade `upgrade-insecure-requests` (redundante con HSTS pero refuerza SSA).
// En desarrollo se mantiene permisiva (sin upgrade) para no romper tests e2e.
const cspProd = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://www.pinedayasociadoshn.com https://lh3.googleusercontent.com https://*.googleusercontent.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://*.tile.openstreetmap.org https://*.openstreetmap.org https://challenges.cloudflare.com",
  "frame-src 'self' https://www.openstreetmap.org https://www.google.com https://challenges.cloudflare.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const cspDev = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://*.tile.openstreetmap.org https://*.openstreetmap.org https://challenges.cloudflare.com",
  "frame-src 'self' https://www.openstreetmap.org https://www.google.com https://challenges.cloudflare.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

// TODO(P2): migrar CSP a nonce-based. Requiere generar un nonce en `proxy.ts`
// (o middleware), inyectarlo en inline scripts (theme detection en
// app/layout.tsx) y eliminar 'unsafe-inline' de script-src. Documentado en
// docs/audits/ tras esta iteración; fuera de scope por riesgo de regresión.
const csp = isProd ? cspProd : cspDev;

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Aislamiento cross-origin: refuerzo contra Spectre, side-channel y
  // ataques de framing/resource embedding sin romper OpenStreetMap embed.
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Content-Security-Policy', value: csp },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

// X-Robots-Tag por ruta (no global). Una regla catch-all con
// `X-Robots-Tag: index, follow` sobreescribiría la señal `noindex, follow` que
// envían las páginas legales y los filtros del blog (?tag=, ?month=, ?page=)
// vía meta robots, generando una contradicción SEO (Ahrefs Fase 1, Jul 2026).
// Las páginas indexables no necesitan X-Robots-Tag: la metadata por-página y el
// sitemap son la autoridad. Solo se emite X-Robots-Tag explícito para:
//   - staging global (noindexActive), o
//   - rutas explícitamente noindex (legales, intranet, API).
const noindexAllHeader = {
  key: 'X-Robots-Tag',
  value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
};
const noindexFollowHeader = {
  key: 'X-Robots-Tag',
  value: 'noindex, follow',
};
// Rutas legales públicas con meta robots `noindex, follow` (6). Deben recibir
// el mismo X-Robots-Tag para no contradecir su metadata.
const LEGAL_NOINDEX_PATHS = [
  '/terminos',
  '/aviso-legal',
  '/politica-privacidad',
  '/politica-cookies',
  '/politica-editorial',
  '/disclaimer',
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * Timeout de generación de páginas estáticas (Fase 3B).
   *
   * El default de Next.js (60s) es insuficiente para las 349 páginas del blog
   * con ISR que consultan Neon en build time: la latencia de cold-start de Neon
   * hace que páginas complejas excedan el límite y revienten el build tras 3
   * reintentos. 300s tolera esa latencia sin reventar memoria.
   *
   * Justificación técnica documentada en docs/audits/fase3b-lote1-validacion.md.
   * No afecta al runtime (solo al build de páginas estáticas).
   */
  staticPageGenerationTimeout: 300,
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
    // AVIF (30-50% más ligero que WebP) primero; fallback a WebP.
    // Ambos soportados por los navegadores del browserslist (not safari < 15).
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    // Caché del optimizador: 24h (default 60s). Las imágenes optimizadas son
    // invariantes para un mismo src + size + format, así que conviene caché
    // largo en CDN. Aumenta el hit-rate de /_next/image y reduce TTFB.
    minimumCacheTTL: 86_400,
  },
  experimental: {
    // Tree-shaking de importaciones nombradas en librerías grandes.
    // lucide-react se importa masivamente; tiptap/recharts solo en admin pero
    // esto garantiza que el bundle público no arrastre iconos sin usar.
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@tiptap/react',
      '@tiptap/core',
      '@tiptap/starter-kit',
    ],
  },
  // Nota: `X-Frame-Options` se fuerza a DENY por seguridad en la mayor parte del sitio.
  // Para el proxy del editor visual necesitamos permitir framing same-origin,
  // por eso añadimos una excepción específica en `headers()` más abajo.
  // El redirect www → apex lo gestiona Vercel a nivel de dominio
  // (Settings → Domains → Redirect). Aquí solo mantenemos los legacy redirects.
  // IMPORTANTE: NO redirigir /login → /intranet/login (causaba bucles).
  async redirects() {
    return [
      // === CORRECCIÓN HTTPS/www (24 Jun 2026) ===
      // GSC reportaba impresiones para http://pinedayasociadoshn.com/ (HTTP no seguro).
      // Vercel ya redirige a nivel de dominio, pero algunos rastreadores pueden
      // encontrar la versión HTTP. Estos redirects refuerzan la canonicalización.
      { source: '/', has: [{ type: 'host', value: 'pinedayasociadoshn.com' }], destination: 'https://www.pinedayasociadoshn.com/', permanent: true },
      { source: '/:path*', has: [{ type: 'host', value: 'pinedayasociadoshn.com' }], destination: 'https://www.pinedayasociadoshn.com/:path*', permanent: true },
      // === FIX 404: Backlinks externos sin prefijo /blog/ (Audit 25/06) ===
      // GSC URL Inspection reportó referringUrls a estas URLs huérfanas.
      // El post existe en /blog/hondurenos-en-espana/poder-desde-espana-...
      // pero Google/Bing llegaron sin el prefijo /blog/. Consolidamos con
      // 301 hacia el post canónico para conservar link equity.
      { source: '/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras', destination: '/blog/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras', permanent: true },
      { source: '/blog/poder-desde-espana-para-tramites-honduras', destination: '/blog/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras', permanent: true },
      { source: '/blog/reclamar-deuda-legalmente-honduras', destination: '/blog/derecho-civil/reclamar-deuda-legalmente-honduras', permanent: true },
      // /derecho-penal/proceso-penal-completo/paso-1 backlink externo huérfano:
      // la landing legal /derecho-penal/proceso-penal-completo SÍ existe
      // (canonical-paths.json). Redirigimos el subpath 404 hacia la landing.
      { source: '/derecho-penal/proceso-penal-completo/paso-1', destination: '/derecho-penal/proceso-penal-completo', permanent: true },
      { source: '/inicio', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/areas-de-practica', destination: '/servicios-juridicos', permanent: true },
      { source: '/areas-de-practica/:path*', destination: '/servicios-juridicos/:path*', permanent: true },
      { source: '/derecho-penal-hondureno', destination: '/derecho-penal', permanent: true },
      // /proceso-penal es una versión antigua y obsoleta. La página canónica
      // actual es /derecho-penal; el 301 conserva link equity hacia ella.
      { source: '/proceso-penal', destination: '/derecho-penal', permanent: true },
      { source: '/faq', destination: '/preguntas-frecuentes', statusCode: 301 },
      { source: '/contacto', destination: '/solicitar-consulta', permanent: true },
      { source: '/privacidad', destination: '/politica-privacidad', permanent: true },
      // === FIX 404 Ahrefs Fase 1 (Jul 2026): redirects de red de seguridad ===
      // Estos 5 destinos se reportaron como 404 en Ahrefs. La causa primaria
      // (enlaces /articulos/* en el body de un post de la DB) se corrige vía
      // fix-internal-redirects.ts (reescritura en origen). Estos 301 actúan
      // como red de seguridad para backlinks externos o rastros históricos.
      // Destinos canónicos verificados (posts 200 existentes):
      { source: '/articulos/declaracion-isr-personas-naturales', destination: '/blog/tributario/impuesto-renta-personas-fisicas-honduras', permanent: true },
      { source: '/articulos/facturacion-electronica-honduras', destination: '/blog/tributario/facturacion-electronica-requisitos-sar', permanent: true },
      { source: '/articulos/isv-en-honduras', destination: '/blog/tributario/isv-impuesto-venta-tasas-obligaciones-honduras', permanent: true },
      // Landings/servicios huérfanos reportados por Ahrefs:
      { source: '/contacto-tegucigalpa', destination: '/solicitar-consulta', permanent: true },
      { source: '/servicios/gestoria-ambiental-corporativa', destination: '/servicios-juridicos/ambiental-regulatorio', permanent: true },
      // NOTA: los slugs con doble prefijo reportados por Ahrefs
      // (/blog/tributario/blog/derecho-laboral/..., /blog/tributario/blog/tributario/...,
      // /blog/<cat>/solicitar-consulta, /blog/tributario/abogados-en-choluteca)
      // NO se redirigen: son artefactos de rastreo sin referencia real en código
      // ni DB (verificados). Redirigirlos inventaría un destino que no existe.
      // El script seo:ahrefs los detecta si reaparecen en datos vigentes.
      // === CONSOLIDACIÓN DE BLOG: redirecciones 301 post-auditoría (Jun 2026) ===
      // Fusiones por canibalización: 2 posts → 1
      { source: '/blog/derecho-de-familia/pension-alimenticia-calcular-reclamar-honduras', destination: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa', permanent: true },
      { source: '/blog/derecho-de-familia/guarda-custodia-menores-tipos-honduras', destination: '/blog/derecho-de-familia/custodia-hijos-honduras-juez', permanent: true },
      { source: '/blog/derecho-laboral/despido-laboral-honduras-derechos', destination: '/blog/derecho-laboral/despido-laboral-honduras-guia-completa', permanent: true },
      { source: '/blog/derecho-laboral/calcular-prestaciones-laborales-honduras', destination: '/blog/derecho-laboral/calcular-liquidacion-laboral-honduras', permanent: true },
      { source: '/blog/derecho-mercantil/contratos-mercantiles-proteger-negocio', destination: '/blog/derecho-mercantil/contratos-mercantiles-esenciales-empresas-honduras', permanent: true },
      // Redirect de categoría con nombre extendido (slug canónico es /blog/derecho-mercantil)
      { source: '/blog/derecho-mercantil-empresarial', destination: '/blog/derecho-mercantil', permanent: true },
      // Servicios: slugs de áreas que apuntan a hubs dedicados (404 → redirect)
      { source: '/servicios-juridicos/derecho-penal', destination: '/derecho-penal', permanent: true },
      { source: '/blog/derecho-civil/herencias-honduras-fallece-familiar', destination: '/blog/derecho-civil/testamentos-sucesiones-herencia-honduras', permanent: true },
      // Posts genéricos redirigidos a páginas de categoría/servicio
      { source: '/blog/hondurenos-en-espana/hondurenos-en-espana-guia-legal-completa', destination: '/hondurenos-en-espana', permanent: true },
      { source: '/blog/derecho-notarial/tramites-notariales-frecuentes-honduras', destination: '/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita', permanent: true },
      // Canibalización cruzada: derechos del detenido → guía práctica de detención
      { source: '/blog/derechos-ciudadanos/derechos-del-detenido-guia-constitucional-honduras', destination: '/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras', permanent: true },
      // === FASE 1: Cluster DIVORCIO (4→1) ===
      { source: '/blog/derecho-de-familia/divorcio-honduras-pasos-requisitos', destination: '/blog/derecho-de-familia/divorcio-honduras-guia-completa', permanent: true },
      { source: '/blog/derecho-de-familia/divorcio-tipos-requisitos-tiempos-honduras', destination: '/blog/derecho-de-familia/divorcio-honduras-guia-completa', permanent: true },
      { source: '/blog/derecho-de-familia/divorcio-express-mutuo-acuerdo-honduras', destination: '/blog/derecho-de-familia/divorcio-honduras-guia-completa', permanent: true },
      { source: '/blog/derecho-de-familia/problemas-legales-familiares-honduras', destination: '/blog/derecho-de-familia/divorcio-honduras-guia-completa', permanent: true },
      // === FASE 1: Cluster PENSIÓN (2→1 + redirect al nuevo pilar) ===
      { source: '/blog/derecho-de-familia/pension-alimenticia-honduras-como-solicitarla', destination: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa', permanent: true },
      // === FASE 1: Cluster ELEGIR ABOGADO (4→1) ===
      { source: '/blog/practica-legal/como-elegir-buen-abogado-guia-practica-honduras', destination: '/blog/practica-legal/como-elegir-abogado-honduras', permanent: true },
      { source: '/blog/practica-legal/elegir-bufete-abogados-nacaome', destination: '/blog/practica-legal/como-elegir-abogado-honduras', permanent: true },
      { source: '/blog/practica-legal/elegir-bufete-multidisciplinario-ventajas-honduras', destination: '/blog/practica-legal/como-elegir-abogado-honduras', permanent: true },
      // === FASE 1: Cluster DESPIDO LABORAL (3→1) ===
      { source: '/blog/derecho-laboral/despido-injustificado-honduras-derechos-trabajador', destination: '/blog/derecho-laboral/despido-laboral-honduras-guia-completa', permanent: true },
      { source: '/blog/derecho-laboral/empleador-no-paga-salario-honduras', destination: '/blog/derecho-laboral/despido-laboral-honduras-guia-completa', permanent: true },
      // === FASE 2: Posts plantilla reescritos (slugs cambiados) ===
      { source: '/blog/derecho-administrativo/recurso-de-amparo-para-que-sirve-honduras', destination: '/blog/derecho-administrativo/recurso-de-amparo-honduras-guia-completa', permanent: true },
      { source: '/blog/derecho-bancario/ejecucion-hipotecaria-que-hacer-honduras', destination: '/blog/derecho-bancario/ejecucion-hipotecaria-honduras-que-hacer', permanent: true },
      { source: '/blog/noticias-legales/actualizacion-legislativa-mensual-honduras', destination: '/blog/noticias-legales/reformas-legales-recientes-honduras', permanent: true },
      { source: '/blog/derecho-bancario/derechos-consumidor-financiero-cnbs-honduras', destination: '/blog/derecho-bancario/derechos-consumidor-financiero-honduras-cnbs', permanent: true },
      // Posts débil/fusionados con contenido mejorado
      { source: '/blog/derecho-mercantil/constitucion-empresas-honduras-pasos-legales', destination: '/blog/derecho-mercantil/tipos-sociedad-mercantil-honduras', permanent: true },
      { source: '/blog/derecho-de-familia/violencia-intrafamiliar-denuncia-proteccion-honduras', destination: '/blog/derecho-penal/violencia-domestica-ruta-legal-honduras', permanent: true },
      // === FASE 2: Posts plantilla adicionales ===
      { source: '/blog/conciliacion-arbitraje/arbitraje-cuando-conviene-como-funciona-honduras', destination: '/blog/conciliacion-arbitraje/arbitraje-honduras-guia-completa', permanent: true },
      // === FASE 3: Redirects de posts plantilla residuales ===
      { source: '/blog/derecho-ambiental/evaluacion-impacto-ambiental-paso-a-paso-honduras', destination: '/blog/derecho-ambiental/evaluacion-impacto-ambiental-honduras', permanent: true },
      { source: '/blog/derecho-mercantil/elegir-tipo-sociedad-empresa-honduras', destination: '/blog/derecho-mercantil/tipos-sociedad-mercantil-honduras', permanent: true },
      // Fusion: despido-empleados-publicos-procedencia-defensa → despido-empleados-publicos
      { source: '/blog/derecho-administrativo/despido-empleados-publicos-procedencia-defensa-honduras', destination: '/blog/derecho-administrativo/despido-empleados-publicos-honduras', permanent: true },
      // === FASE 4: Redirects posts canibalizados restantes (Jun 2026) ===
      { source: '/blog/derecho-bancario/central-riesgos-consultar-impugnar-honduras', destination: '/blog/derecho-bancario/central-riesgos-honduras-consultar-impugnar', permanent: true },
      { source: '/blog/derecho-civil/contratos-civiles-honduras-errores-comunes', destination: '/blog/derecho-civil/errores-contratos-civiles-honduras', permanent: true },
      // === FIX 404: Páginas huérfanas que devolvían 404 (Jun 2026) ===
      // Posts "abogado-{area}-choluteca" existen como blog posts con /blog/ prefijo
      { source: '/abogado-laboral-choluteca', destination: '/blog/derecho-laboral/abogado-laboral-choluteca', permanent: true },
      { source: '/abogado-civil-choluteca', destination: '/blog/derecho-civil/abogado-civil-choluteca', permanent: true },
      { source: '/abogado-familia-choluteca', destination: '/blog/derecho-de-familia/abogado-familia-choluteca', permanent: true },
      // Post de derecho-penal servido bajo subruta estática (sin /blog/)
      { source: '/proceso-penal-completo', destination: '/derecho-penal/proceso-penal-completo', permanent: true },
      // Error de categoría: post en derecho-civil pero URL apuntaba a derecho-mercantil
      { source: '/blog/derecho-mercantil/errores-contratos-civiles-honduras', destination: '/blog/derecho-civil/errores-contratos-civiles-honduras', permanent: true },
      // === SLUG SHORTENING: URLs largas acortadas (Jun 2026) ===
      // Elimina "honduras"/"guia"/"legal"/"obligaciones"/"requisitos"/"aspectos" redundantes
      // Reduce URL path de 86→61 chars máximo
      { source: '/blog/extranjeria-migracion/visas-inversion-inversionista-rentista-pensionado-honduras', destination: '/blog/extranjeria-migracion/visas-inversion-rentista-pensionado', permanent: true },
      { source: '/blog/derecho-administrativo/contratacion-publica-licitaciones-empresas-honduras', destination: '/blog/derecho-administrativo/contratacion-publica-licitaciones', permanent: true },
      { source: '/blog/practica-legal/lavado-activos-obligaciones-cumplimiento-empresas-honduras', destination: '/blog/practica-legal/lavado-activos-obligaciones', permanent: true },
      { source: '/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras', destination: '/blog/proceso-penal/sobreseimiento-definitivo-provisional', permanent: true },
      { source: '/blog/conciliacion-arbitraje/centro-conciliacion-arbitraje-ccic-guia-honduras', destination: '/blog/conciliacion-arbitraje/centro-conciliacion-arbitraje-ccic', permanent: true },
      { source: '/blog/tributario/facturacion-electronica-obligaciones-requisitos-sar-honduras', destination: '/blog/tributario/facturacion-electronica-requisitos-sar', permanent: true },
      { source: '/blog/regulacion-sanitaria/habilitacion-clinicas-hospitales-privados-honduras', destination: '/blog/regulacion-sanitaria/habilitacion-clinicas-hospitales', permanent: true },
      { source: '/blog/hondurenos-en-espana/herencias-transfronterizas-bienes-honduras-espana', destination: '/blog/hondurenos-en-espana/herencias-transfronterizas-bienes', permanent: true },
      { source: '/blog/hondurenos-en-espana/hondurenos-espana-documentos-legales-extranjero', destination: '/blog/hondurenos-en-espana/hondurenos-espana-documentos', permanent: true },
      { source: '/blog/derecho-bancario/creditos-reestructuracion-deudas-bancarias-honduras', destination: '/blog/derecho-bancario/creditos-reestructuracion-deudas', permanent: true },
      { source: '/blog/extranjeria-migracion/refugio-asilo-quien-puede-solicitarlo-honduras', destination: '/blog/extranjeria-migracion/refugio-asilo-solicitarlo', permanent: true },
      { source: '/blog/conciliacion-arbitraje/mediacion-vs-juicio-que-conviene-mas-honduras', destination: '/blog/conciliacion-arbitraje/mediacion-vs-juicio-cual-elegir', permanent: true },
      { source: '/blog/propiedad-intelectual/proteccion-marcas-competencia-desleal-honduras', destination: '/blog/propiedad-intelectual/proteccion-marcas-competencia-desleal', permanent: true },
      { source: '/blog/derecho-laboral/riesgos-profesionales-accidentes-laborales-honduras', destination: '/blog/derecho-laboral/riesgos-profesionales-accidentes', permanent: true },
      { source: '/blog/extranjeria-migracion/naturalizacion-obtener-nacionalidad-hondurena', destination: '/blog/extranjeria-migracion/naturalizacion-nacionalidad-hondurena', permanent: true },
      { source: '/blog/derecho-aduanero/importar-desde-china-guia-legal-aduanera-honduras', destination: '/blog/derecho-aduanero/importar-china-guia-aduanera', permanent: true },
      { source: '/blog/derecho-aduanero/importar-mercancias-guia-legal-aduanera-honduras', destination: '/blog/derecho-aduanero/importar-mercancias-guia-aduanera', permanent: true },
      { source: '/blog/derecho-mercantil/contratos-franquicia-aspectos-legales-honduras', destination: '/blog/derecho-mercantil/contratos-franquicia-aspectos', permanent: true },
      { source: '/blog/derecho-aduanero/codigo-aduanero-centroamericano-basico-honduras', destination: '/blog/derecho-aduanero/codigo-aduanero-centroamericano', permanent: true },
      { source: '/blog/hondurenos-en-espana/tributar-espana-bienes-honduras-guia-fiscal', destination: '/blog/hondurenos-en-espana/tributar-espana-bienes-guia', permanent: true },
      { source: '/blog/hondurenos-en-espana/asuntos-familiares-honduras-viviendo-espana', destination: '/blog/hondurenos-en-espana/asuntos-familiares-honduras-espana', permanent: true },
      { source: '/blog/practica-legal/proceso-consulta-legal-pineda-asociados-honduras', destination: '/blog/practica-legal/proceso-consulta-legal-pineda', permanent: true },
      // === KEYWORDS COMERCIALES: Valle → Nacaome (Nacaome es cabecera de Valle) ===
      { source: '/abogado-penalista-valle', destination: '/abogado-penalista-nacaome', permanent: true },
      { source: '/abogado-laboralista-valle', destination: '/abogado-laboralista-nacaome', permanent: true },
      { source: '/abogado-de-familia-valle', destination: '/abogado-de-familia-nacaome', permanent: true },
      { source: '/abogado-civil-valle', destination: '/abogado-civil-nacaome', permanent: true },
      { source: '/bufete-juridico-valle', destination: '/abogados-en-nacaome', permanent: true },
      { source: '/abogado-penalista-honduras', destination: '/abogado-penalista-nacaome', permanent: true },
      // === FIX 404: Landings locales huérfanas (Audit Jul 2026, Fase 2) ===
      // URLs de ciudades secundarias. Cuatro ya tienen landing propia (audit
      // P7 Jul 2026): Caridad, Alianza, Concepción de María, San Antonio de
      // Flores. Las restantes siguen redirigiendo al vecino más cercano.
      { source: '/abogados-en-aramcina', destination: '/abogados-en-nacaome', permanent: true },
      { source: '/abogados-en-apacilagua', destination: '/abogados-en-choluteca', permanent: true },
      { source: '/abogados-en-duyure', destination: '/abogados-en-san-marcos-de-colon', permanent: true },
      { source: '/abogados-en-morolica', destination: '/abogados-en-san-marcos-de-colon', permanent: true },
      // === KEYWORDS COMERCIALES: Choluteca ===
      // /abogado-penalista-choluteca es ahora landing comercial propia (audit
      // SEO Jul 2026, P3). Invertimos el redirect: el post editorial antiguo
      // consolida autoridad hacia la landing con CTA y NAP.
      { source: '/blog/derecho-penal/abogado-penalista-choluteca', destination: '/abogado-penalista-choluteca', permanent: true },
      { source: '/abogado-laboralista-choluteca', destination: '/blog/derecho-laboral/abogado-laboral-choluteca', permanent: true },
      { source: '/abogado-de-familia-choluteca', destination: '/blog/derecho-de-familia/abogado-familia-choluteca', permanent: true },
      { source: '/abogado-civil-choluteca', destination: '/blog/derecho-civil/abogado-civil-choluteca', permanent: true },
      // === P1 AUDIT SEO Jul 2026: variantes comerciales penales sin página propia ===
      // Variantes de búsqueda frecuentes que no tienen landing dedicada →
      // consolidan hacia el hub penal o la landing especializada más cercana.
      { source: '/abogado-penalista-san-lorenzo', destination: '/derecho-penal', permanent: true },
      { source: '/defensa-penal-choluteca', destination: '/abogado-penalista-choluteca', permanent: true },
      { source: '/defensa-penal-nacaome', destination: '/abogado-penalista-nacaome', permanent: true },
      { source: '/defensa-penal-sur-honduras', destination: '/derecho-penal', permanent: true },
      // === CONSOLIDACIÓN DE POSTS LOCALES POST-AUDITORÍA (Jul 2026) ===
      { source: '/blog/practica-legal/abogados-en-nacaome', destination: '/abogados-en-nacaome', permanent: true },
      { source: '/blog/practica-legal/abogados-en-choluteca', destination: '/abogados-en-choluteca', permanent: true },
      { source: '/blog/practica-legal/abogados-en-san-lorenzo', destination: '/abogados-en-san-lorenzo', permanent: true },
      { source: '/blog/practica-legal/abogados-en-pespire-choluteca', destination: '/abogados-en-pespire', permanent: true },
      { source: '/blog/practica-legal/abogados-en-marcovia-choluteca', destination: '/abogados-en-marcovia', permanent: true },
      { source: '/blog/practica-legal/abogados-en-san-marcos-de-colon-choluteca', destination: '/abogados-en-san-marcos-de-colon', permanent: true },
      { source: '/blog/practica-legal/abogados-en-amapala-valle', destination: '/abogados-en-amapala', permanent: true },
    ];
  },
  // IndexNow key: sirve KEY.txt desde la raíz via /api/indexnow-key.
  // Fase 3E: /sw.js se sirve vía route handler (app/sw.js/route.ts) que lee
  // public/sw.template.js e inyecta el BUILD_ID en runtime. No se necesita
  // rewrite: la route handler tiene prioridad sobre los archivos estáticos.
  async rewrites() {
    return [
      { source: '/:key.txt', destination: '/api/indexnow-key' },
    ];
  },
  async headers() {
    return [
      // Regla específica para el proxy del editor visual (permitir framing same-origin)
      {
        source: '/api/admin/visual-editor/proxy',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Content-Security-Policy', value: csp },
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      // Cabeceras para API en general
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      // Intranet: política más restrictiva (clickjacking DENY, noindex estricto)
      {
        source: '/intranet/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/intranet',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      // Next.js gestiona Cache-Control de /_next/* para assets hasheados.
      // Evitamos una regla manual aqui porque Next 16 emite warning y puede
      // interferir con el comportamiento de desarrollo/build.
      // Assets estables en /public (favicons, iconos PWA): cache moderado.
      // Archivos mutables (og-image, manifest, sw.js, llms.txt, robots, sitemap)
      // quedan fuera para permitir actualización inmediata.
      {
        source: '/:path(icon-\\d+\\.png|apple-touch-icon\\.png|favicon\\.ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
      // Rutas legales públicas: X-Robots-Tag `noindex, follow` coherente con su
      // meta robots. Evita la contradicción con un header global index,follow.
      // (Si noindexActive está activo, la regla catch-all ya emite noindex.)
      ...LEGAL_NOINDEX_PATHS.map((source) => ({
        source,
        headers: [noindexFollowHeader],
      })),
      // Regla por defecto para el resto de rutas
      {
        source: '/:path*',
        // En producción (noindexActive=false) no se emite X-Robots-Tag global:
        // cada página controla su indexación vía meta robots (metadata por-página)
        // y el sitemap solo lista URLs indexables. Así se evita contradecir las
        // páginas noindex dinámicas (?tag=, ?month=, ?page=) y los filtros.
        // En staging (noindexActive=true) se fuerza noindex en todo el sitio.
        headers: noindexActive ? [...securityHeaders, noindexAllHeader] : [...securityHeaders],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
