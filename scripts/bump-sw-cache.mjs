/**
 * Inyecta el BUILD_ID de Next.js en la versión de caché del service worker.
 *
 * PROBLEMA QUE RESUELVE:
 *   `public/sw.js` define `CACHE = 'pineda-pwa-__BUILD_ID__'`. Si la versión
 *   de caché es fija entre deploys, el `activate` del SW nunca purga la caché
 *   anterior y los chunks `/_next/*` de builds previos siguen sirviéndose
 *   (stale-while-revalidate) incluso cuando el HTML nuevo referencia chunks
 *   que ya no existen en el servidor → 404 "page has broken JavaScript".
 *
 * CÓMO:
 *   Lee `.next/BUILD_ID` (generado por `next build`) y reemplaza el placeholder
 *   `__BUILD_ID__` en `public/sw.js`. Cada build obtiene una versión de caché
 *   distinta, forzando `install → skipWaiting → activate` y la purga de cachés
 *   viejas en los clientes.
 *
 * SEGURIDAD:
 *   - Escribe siempre (idempotente): si el placeholder ya no existe porque el
 *     valor ya se inyectó, restaura el placeholder antes de reescribir.
 *   - No commitear el resultado: `public/sw.js` se mantiene con el placeholder
 *     en git; el valor real solo vive en el artefacto de build desplegado.
 *
 * USO:
 *   node scripts/bump-sw-cache.mjs          # reescribe public/sw.js
 *   node scripts/bump-sw-cache.mjs --check  # solo verifica, no escribe
 *
 * Se integra en `postbuild` (package.json).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const SW_PATH = resolve(root, 'public/sw.js');
const BUILD_ID_PATH = resolve(root, '.next/BUILD_ID');
const PLACEHOLDER = '__BUILD_ID__';

const checkOnly = process.argv.includes('--check');

if (!existsSync(BUILD_ID_PATH)) {
  console.error('[bump-sw-cache] .next/BUILD_ID no encontrado. ¿Se ejecutó `next build`?');
  process.exit(1);
}

const buildId = readFileSync(BUILD_ID_PATH, 'utf8').trim();
if (!buildId) {
  console.error('[bump-sw-cache] BUILD_ID vacío.');
  process.exit(1);
}

let sw = readFileSync(SW_PATH, 'utf8');
// Restaurar la línea del CACHE si un bump previo dejó el BUILD_ID real en el
// archivo (build local sin commit intermedio). La regex coincide con cualquier
// valor de BUILD_ID inyectado y lo revierte al placeholder.
sw = sw.replace(
  /const CACHE = 'pineda-pwa-[A-Za-z0-9_]+' \+ \('__BUILD_ID__' === '__BUILD_ID__'/,
  `const CACHE = 'pineda-pwa-' + ('__BUILD_ID__' === '__BUILD_ID__'`,
);

if (!sw.includes(PLACEHOLDER)) {
  console.error('[bump-sw-cache] Placeholder __BUILD_ID__ no encontrado en public/sw.js.');
  process.exit(1);
}

if (checkOnly) {
  console.log(`[bump-sw-cache] BUILD_ID=${buildId} (check-only, sin escritura)`);
  process.exit(0);
}

// Reemplazar SOLO el placeholder de la línea `const CACHE = ...`. El comentario
// y la comparación de fallback (`'__BUILD_ID__' === '__BUILD_ID__'`) conservan
// el placeholder literal para que el fallback siga funcional y el repo mantenga
// un valor estable. Se reemplaza exclusivamente la ocurrencia tras
// `'pineda-pwa-'` para no tocar el resto del archivo.
const cacheLine = `const CACHE = 'pineda-pwa-' + ('__BUILD_ID__' === '__BUILD_ID__'`;
const cacheLineReal = `const CACHE = 'pineda-pwa-${buildId}' + ('__BUILD_ID__' === '__BUILD_ID__'`;
if (!sw.includes(cacheLine)) {
  console.error('[bump-sw-cache] Línea `const CACHE = ...` con placeholder no encontrada.');
  console.error('[bump-sw-cache] ¿Se modificó public/sw.js manualmente?');
  process.exit(1);
}
const out = sw.replace(cacheLine, cacheLineReal);
writeFileSync(SW_PATH, out, 'utf8');
console.log(`[bump-sw-cache] CACHE versionado a 'pineda-pwa-${buildId}' en public/sw.js`);
