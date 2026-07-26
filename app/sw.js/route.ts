/**
 * Route handler que sirve el service worker en /sw.js con el BUILD_ID inyectado.
 *
 * Fase 3E — solución definitiva al determinismo del SW.
 *
 * PROBLEMA RESUELTO:
 *   El flujo anterior generaba `public/sw.js` (o `public/sw.generated.js`)
 *   en `postbuild` inyectando el BUILD_ID. En Vercel, los archivos de
 *   `/public` se copian al CDN DURANTE el build, ANTES de `postbuild`, así que
 *   el artefacto generado nunca llegaba al CDN. Y reescribir `public/sw.js`
 *   directamente dejaba el árbol de Git sucio tras cada build.
 *
 * SOLUCIÓN:
 *   Esta route handler lee `public/sw.template.js` (plantilla versionada con
 *   placeholder `__BUILD_ID__`) en runtime, reemplaza el placeholder por un
 *   identificador único por deploy, y sirve el resultado con los headers
 *   correctos (Content-Type, Cache-Control inmutable corto, no-cache para que
 *   el navegador siempre pida la versión fresca del SW).
 *
 *   Ventajas:
 *     - `public/sw.template.js` (plantilla) NUNCA se modifica → árbol limpio.
 *     - No depende de `postbuild` ni de archivos generados → funciona en
 *       cualquier output mode de Vercel (default, standalone, export).
 *     - Cache ID único por deploy → fuerza install→activate y purga de cachés.
 *
 * IDENTIFICADOR POR DEPLOY:
 *   Usa `process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID` (único por deploy en
 *   Vercel). Si no está (dev local, otro host), usa `process.env.NODE_ENV` o
 *   el BUILD_ID de `.next/BUILD_ID` si está disponible. Fallback final: 'dev'.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Cache en memoria del template leído (evita I/O en cada request).
let templateCache: string | null = null;

function getTemplate(): string {
  if (templateCache !== null) return templateCache;
  const templatePath = resolve(process.cwd(), 'public/sw.template.js');
  templateCache = readFileSync(templatePath, 'utf8');
  return templateCache;
}

/**
 * Identificador único por deploy para el cache ID del SW.
 * Prioridad: VERCEL_DEPLOYMENT_ID > NODE_ENV > 'dev'.
 */
function getBuildId(): string {
  const vercelId = process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID;
  if (vercelId && vercelId.trim().length > 0) return vercelId.trim();
  // En dev/preview sin deployment ID, usar NODE_ENV como discriminador.
  // No es único por build, pero suficiente para no congelar el SW.
  if (process.env.NODE_ENV === 'production') {
    // En producción sin VERCEL_DEPLOYMENT_ID (raro), intentar BUILD_ID.
    try {
      const buildId = readFileSync(resolve(process.cwd(), '.next/BUILD_ID'), 'utf8').trim();
      if (buildId) return buildId;
    } catch {
      /* sin BUILD_ID, usar fallback genérico */
    }
    return 'prod-' + (process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 10) ?? 'unknown');
  }
  return 'dev';
}

export const dynamic = 'force-dynamic';

export function GET() {
  const buildId = getBuildId();
  const template = getTemplate();
  // Reemplazo del placeholder en runtime.
  const body = template.split('__BUILD_ID__').join(buildId);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      // El SW debe revalidarse siempre: un SW cacheado impide actualizar las
      // páginas. max-age=0 + must-revalidate fuerza al navegador a pedir la
      // versión fresca en cada navegación (estándar de SW).
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
