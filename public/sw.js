/*
 * Service worker mínimo — PWA de Pineda y Asociados.
 *
 * Objetivo: reforzar la instalabilidad (Lighthouse PWA) y permitir offline
 * básico de la web pública. SIN dependencias ni build (vanilla JS servido
 * desde /public/sw.js). Cache versionada: para renovar estrategias o
 * blocklist, basta con cambiar CACHE y subir.
 *
 * SEGURIDAD (R6, AGENTS.md): el fetch handler NUNCA intercepta ni cachea las
 * rutas privadas. Esas pasan siempre a red. Esta lista es la salvaguarda que
 * impide filtraciones de la intranet a través del service worker.
 */

// CACHE se versiona por build (postbuild inyecta el BUILD_ID de Next.js vía
// scripts/bump-sw-cache.mjs). Esto fuerza `install→activate` en cada deploy y
// purga los chunks `/_next/*` de builds anteriores: sin esto, el SW sirvió
// chunks obsoletos (stale-while-revalidate) cuyo HTML referenciaba assets que
// ya no existían en el servidor → 404 "page has broken JavaScript".
// El placeholder `__BUILD_ID__` se reemplaza en CI; si no (dev), se usa un
// valor por defecto para que el SW nunca quede con una versión congelada.
const CACHE = 'pineda-pwa-IRXhUoZh_7dDT81xigXOe' + ('__BUILD_ID__' === '__BUILD_ID__'
  ? 'dev'
  : '__BUILD_ID__');
const PRECACHE = ['/', '/manifest.json'];

// Rutas PRIVADAS (R6): el SW no debe tocarlas. Coincidencia exacta o prefijo
// con barra (p.ej. '/intranet' y '/intranet/...'). /preview es pública pero
// se accede por token: no debe cachearse (filtraría contenido del post).
const PRIVATE_ROUTES = [
  '/intranet',
  '/api',
  '/calculadora',
  '/casos',
  '/cp',
  '/delitos',
  '/atajos',
  '/admin',
  '/preview',
];

function isPrivate(pathname) {
  return PRIVATE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // No se usa addAll (falla entero si un recurso 404). Se añaden uno a
      // uno para no abortar la instalación por un recurso ausente.
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
          } catch {
            /* recurso no disponible ahora; no bloquea la instalación. */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET same-origin. POST (formularios, API) y peticiones cross-origin
  // pasan a red sin tocar el SW.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // R6: rutas privadas → siempre red, nunca cache.
  if (isPrivate(url.pathname)) return;

  // Navegación (carga de documento HTML): network-first con fallback a cache
  // y a la shell precacheada '/'. Contenido fresco para un sitio legal que
  // se actualiza (blog, contenido CMS).
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached || (await caches.match('/')) || Response.error();
        }
      })()
    );
    return;
  }

  // Estáticos (chunks Next, imágenes, fuentes, etc.): stale-while-revalidate.
  // Los assets de Next están hashed (inmutables), ideal para SWR: se sirve
  // cache al instante y se revalida en background.
  const isAsset =
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:js|css|woff2?|png|jpe?g|webp|svg|gif|ico|avif)$/i.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        // Revalidar en background (sin bloquear la respuesta). Si la red
        // responde 404 (chunk de build anterior ya no desplegado), se purga
        // la entrada cacheada para no seguir sirviendo un asset huérfano.
        fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              cache.put(req, res.clone());
            } else if (res && res.status === 404 && cached) {
              cache.delete(req).catch(() => {});
            }
          })
          .catch(() => {});
        if (cached) return cached;
        // Sin cache: ir a red (foreground) y cachear solo si es 200.
        try {
          const res = await fetch(req);
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          return Response.error();
        }
      })()
    );
    return;
  }

  // Resto de GET same-origin (p.ej. payloads RSC): network, con fallback a
  // cache si existe.
  event.respondWith(
    (async () => {
      try {
        return await fetch(req);
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        return Response.error();
      }
    })()
  );
});
