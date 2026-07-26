/**
 * Genera el service worker FINAL con el BUILD_ID inyectado, sin tocar la
 * plantilla versionada.
 *
 * PROBLEMA QUE RESUELVE (Fase 3E — causa raíz definitiva):
 *   El flujo anterior (`bump-sw-cache.mjs`) reescribía `public/sw.js`
 *   directamente para inyectar el BUILD_ID en la línea `const CACHE = ...`.
 *   Como `public/sw.js` es un archivo versionado, cada `npm run build` dejaba
 *   el árbol de Git sucio (` M public/sw.js`), exigiendo un `git restore`
 *   manual. Eso rompía el determinismo del build y obligaba a restaurar el
 *   archivo a mano.
 *
 * SOLUCIÓN ESTRUCTURAL (Fase 3E):
 *   - `public/sw.js` es ahora una PLANTILLA versionada con el placeholder
 *     `'__BUILD_ID__'`. Nunca se modifica en build.
 *   - Este script lee la plantilla, reemplaza el placeholder por el BUILD_ID
 *     real y escribe el resultado en `public/sw.generated.js` (artefacto
 *     regenerable, listado en `.gitignore`).
 *   - `next.config.ts` mapea `/sw.js` → `/sw.generated.js` vía `rewrites()`
 *     en producción, de modo que el navegador sigue pidiendo `/sw.js` pero
 *     recibe el artefacto con el cache ID actualizado.
 *
 *   Dos ejecuciones consecutivas de `npm run build` dejan `git status --short`
 *   vacío sin necesidad de `git restore`. La fuente versionada permanece
 *   intacta y el artefacto servido lleva un cache ID distinto por deploy,
 *   forzando `install → skipWaiting → activate` y la purga de cachés viejas.
 *
 * FALLBACK:
 *   Si no existe `.next/BUILD_ID` (p. ej. dev sin build previo), se usa el
 *   valor `'dev'`, igual que el fallback original del SW. El SW nunca queda
 *   con un cache ID congelado.
 *
 * USO:
 *   node scripts/build-sw.mjs          # genera public/sw.generated.js
 *   node scripts/build-sw.mjs --check  # solo verifica, no escribe
 *
 * Se integra en `postbuild` (package.json), reemplazando a bump-sw-cache.mjs.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const TEMPLATE_PATH = resolve(root, 'public/sw.js');
const OUTPUT_PATH = resolve(root, 'public/sw.generated.js');
const BUILD_ID_PATH = resolve(root, '.next/BUILD_ID');
const PLACEHOLDER = '__BUILD_ID__';

const checkOnly = process.argv.includes('--check');

if (!existsSync(TEMPLATE_PATH)) {
  console.error('[build-sw] No existe la plantilla public/sw.js.');
  process.exit(1);
}

// BUILD_ID: opcional. Si falta (dev sin build), se usa 'dev'.
let buildId = 'dev';
if (existsSync(BUILD_ID_PATH)) {
  const raw = readFileSync(BUILD_ID_PATH, 'utf8').trim();
  if (raw) buildId = raw;
}

const template = readFileSync(TEMPLATE_PATH, 'utf8');

if (!template.includes(PLACEHOLDER)) {
  console.error(
    '[build-sw] La plantilla public/sw.js no contiene el placeholder __BUILD_ID__.',
  );
  console.error('[build-sw] ¿Se modificó manualmente? El placeholder es canónico.');
  process.exit(1);
}

// Reemplazo simple y seguro: el placeholder aparece en la línea `const CACHE`.
// Se sustituyen TODAS las ocurrencias (en la comparación de fallback y en el
// valor devuelto) para que el SW generado sea consistente.
const generated = template.split(PLACEHOLDER).join(buildId);

if (checkOnly) {
  console.log(`[build-sw] BUILD_ID=${buildId} (check-only, sin escritura)`);
  process.exit(0);
}

writeFileSync(OUTPUT_PATH, generated, 'utf8');
console.log(
  `[build-sw] Generado public/sw.generated.js con CACHE='pineda-pwa-${buildId}' ` +
    `(plantilla public/sw.js intacta).`,
);
