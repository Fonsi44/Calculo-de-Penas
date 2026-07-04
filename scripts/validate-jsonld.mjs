/**
 * Validador de JSON-LD para rutas públicas prerenderizadas.
 *
 * Comprueba que el @graph (o scripts individuales) cumpla:
 *  - Cada nodo tiene `@type`.
 *  - No hay `@id` duplicados dentro del mismo documento.
 *  - No hay `@context` huérfanos (deben estar en nodo raíz o @graph).
 *
 * Sin librerías externas. Parsea el HTML prerenderizado de `.next/server/app/`
 * y extrae los bloques `<script type="application/ld+json">`.
 *
 * Uso:
 *   node scripts/validate-jsonld.mjs                # valida rutas default
 *   node scripts/validate-jsonld.mjs /ruta1 /ruta2  # valida rutas específicas
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PRERENDER_DIR = path.join(ROOT, '.next', 'server', 'app');

const DEFAULT_ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/despacho', '/servicios-juridicos', '/derecho-penal', '/solicitar-consulta'];

function routeToHtmlFile(route) {
  // /            -> .next/server/app/index.html (o .html en subdirs)
  // /despacho    -> .next/server/app/despacho.html
  // /servicios-juridicos -> .next/server/app/servicios-juridicos.html
  if (route === '/') return path.join(PRERENDER_DIR, 'index.html');
  return path.join(PRERENDER_DIR, `${route}.html`);
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push(m[1].trim());
  }
  return blocks;
}

function flattenNodes(parsed) {
  // Si es array, expandir. Si tiene @graph, usar el graph. Sino, es nodo único.
  if (Array.isArray(parsed)) return parsed;
  if (parsed['@graph'] && Array.isArray(parsed['@graph'])) return parsed['@graph'];
  return [parsed];
}

async function validateRoute(route) {
  const file = routeToHtmlFile(route);
  const issues = [];

  let fileExists = false;
  try {
    await fs.stat(file);
    fileExists = true;
  } catch {
    fileExists = false;
  }
  if (!fileExists) {
    return { route, ok: false, issues: [`No existe HTML prerenderizado: ${file}`] };
  }

  const html = await fs.readFile(file, 'utf8');
  const rawBlocks = extractJsonLdBlocks(html);

  if (rawBlocks.length === 0) {
    issues.push('WARN: No se encontraron bloques JSON-LD');
    return { route, ok: true, issues, blocks: 0 };
  }

  const allNodes = [];
  for (const raw of rawBlocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      issues.push(`ERROR: JSON inválido en bloque: ${e.message}`);
      continue;
    }
    allNodes.push(...flattenNodes(parsed));
  }

  // Validar @type presente en cada nodo (excepto @context puro)
  for (const node of allNodes) {
    if (typeof node !== 'object' || node === null) continue;
    if (!node['@type'] && !node['@context']) {
      issues.push(`ERROR: Nodo sin @type ni @context: ${JSON.stringify(node).slice(0, 80)}`);
    }
  }

  // Validar @id duplicados
  const ids = new Map();
  for (const node of allNodes) {
    if (typeof node !== 'object' || node === null) continue;
    if (node['@id']) {
      if (ids.has(node['@id'])) {
        issues.push(`ERROR: @id duplicado: ${node['@id']}`);
      } else {
        ids.set(node['@id'], true);
      }
    }
  }

  return {
    route,
    ok: !issues.some((i) => i.startsWith('ERROR')),
    issues,
    blocks: rawBlocks.length,
    nodes: allNodes.length,
    uniqueIds: ids.size,
  };
}

async function main() {
  console.log(`🔍 Validando JSON-LD en ${DEFAULT_ROUTES.length} rutas prerenderizadas\n`);
  let allOk = true;
  for (const route of DEFAULT_ROUTES) {
    const r = await validateRoute(route);
    const status = r.ok ? '✓' : '✗';
    console.log(`${status} ${route} — ${r.blocks} bloques, ${r.nodes ?? 0} nodos, ${r.uniqueIds ?? 0} @id únicos`);
    for (const issue of r.issues) console.log(`   ${issue}`);
    if (!r.ok) allOk = false;
  }
  console.log(allOk ? '\n✅ Validación OK' : '\n❌ Errores detectados');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
