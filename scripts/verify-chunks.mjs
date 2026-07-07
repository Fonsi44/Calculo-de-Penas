/**
 * Valida la consistencia de assets `/_next/static/*` tras `next build`.
 *
 * PROBLEMA QUE PREVIENE:
 *   Un deploy inconsistente (HTML de un build + assets de otro, o assets no
 *   desplegados) produce 404 en chunks JS referenciados desde el HTML,
 *   rompiendo la página ("page has broken JavaScript"). Este script verifica
 *   que TODO chunk referenciado en los manifiestos de build exista físicamente
 *   en `.next/static/chunks/` antes de desplegar.
 *
 * CÓMO:
 *   1. Lee `.next/build-manifest.json` y `.next/app-build-manifest.json` para
 *      enumerar los chunks que Next.js inyecta en el HTML de cada ruta.
 *   2. Comprueba que cada chunk exista en `.next/static/chunks/`.
 *   3. Reporta los faltantes y sale con código 1 si hay inconsistencias.
 *
 * USO:
 *   node scripts/verify-chunks.mjs     # valida (exit 1 si hay chunks 404)
 *
 * Se integra en `postbuild` tras `bump-sw-cache.mjs`.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const NEXT_DIR = resolve(root, '.next');
const CHUNKS_DIR = resolve(NEXT_DIR, 'static/chunks');

function readJson(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

function collectChunkRefs(obj, acc) {
  if (!obj) return acc;
  if (typeof obj === 'string') {
    // Acepta rutas tipo "static/chunks/abc.js" o "chunks/abc.js" o "abc.js"
    const m = obj.match(/(?:^|\/)static\/chunks\/(.+)$/);
    if (m) {
      acc.add(`chunks/${m[1]}`);
    } else {
      const m2 = obj.match(/(?:^|\/)(chunks\/[^/]+\.js)$/);
      if (m2) acc.add(m2[1]);
    }
    return acc;
  }
  if (Array.isArray(obj)) {
    for (const v of obj) collectChunkRefs(v, acc);
    return acc;
  }
  if (typeof obj === 'object') {
    for (const v of Object.values(obj)) collectChunkRefs(v, acc);
    return acc;
  }
  return acc;
}

if (!existsSync(NEXT_DIR)) {
  console.error('[verify-chunks] .next/ no encontrado. Ejecuta `next build` primero.');
  process.exit(1);
}

const buildManifest = readJson(resolve(NEXT_DIR, 'build-manifest.json')) ?? {};
const appBuildManifest = readJson(resolve(NEXT_DIR, 'app-build-manifest.json')) ?? {};

const refs = new Set();
collectChunkRefs(buildManifest, refs);
collectChunkRefs(appBuildManifest, refs);

if (refs.size === 0) {
  console.warn('[verify-chunks] No se encontraron referencias a chunks en los manifiestos.');
  process.exit(0);
}

// Mapear referencias relativas a rutas físicas bajo .next/static/
const missing = [];
const present = [];
for (const ref of refs) {
  // ref tiene forma "chunks/abc.js"; físicamente está en .next/static/chunks/abc.js
  const physical = join(NEXT_DIR, 'static', ref);
  if (existsSync(physical)) {
    present.push(ref);
  } else {
    missing.push(ref);
  }
}

console.log(`[verify-chunks] ${present.length} chunks OK, ${missing.length} faltantes.`);
if (missing.length > 0) {
  console.error('[verify-chunks] ✗ Chunks referenciados pero NO desplegados:');
  for (const m of missing) console.error(`    ${m}`);
  console.error('[verify-chunks] El build es inconsistente. Revisa el pipeline de deploy.');
  process.exit(1);
}
console.log('[verify-chunks] ✓ Todos los chunks referenciados existen en .next/static/chunks/.');
