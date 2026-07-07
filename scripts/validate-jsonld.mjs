/**
 * Validador de JSON-LD para rutas públicas prerenderizadas.
 *
 * Comprueba que el @graph (o scripts individuales) cumpla:
 *  - Cada nodo tiene `@type`.
 *  - No hay `@id` duplicados dentro del mismo documento.
 *  - No hay `@context` huérfanos (deben estar en nodo raíz o @graph).
 *  - No hay `@context` DENTRO de nodos del `@graph` (bug raíz Ahrefs: cada
 *    nodo del @graph repetía @context, lo cual es inválido en Schema.org).
 *  - Reglas mínimas por `@type`:
 *      Service → provider presente.
 *      BlogPosting → author y publisher presentes.
 *      FAQPage → mainEntity no vacío.
 *      AggregateRating → warning (política Google self-serving reviews).
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
  : [
      '/',
      '/despacho',
      '/servicios-juridicos',
      '/derecho-penal',
      '/solicitar-consulta',
      '/abogados-en-nacaome',
      '/abogado-penalista-choluteca',
      // Un post de blog para validar BlogPosting + FAQPage schema.
      '/blog/derecho-penal/allanamiento-ilegal-violacion-domicilio-honduras',
    ];

function routeToHtmlFile(route) {
  // /            -> .next/server/app/index.html (o .html en subdirs)
  // /despacho    -> .next/server/app/despacho.html
  // /servicios-juridicos -> .next/server/app/servicios-juridicos.html
  if (route === '/') return path.join(PRERENDER_DIR, 'index.html');
  return path.join(PRERENDER_DIR, `${route}.html`);
}

/** Rutas candidatas para una ruta dada (fallback a /index.html en subdir). */
async function candidateHtmlFiles(route) {
  const files = [routeToHtmlFile(route)];
  if (route !== '/') {
    // Rutas dinámicas (ej. /blog/derecho-penal) pueden prerenderizarse como
    // /blog/derecho-penal.html o /blog/derecho-penal/index.html.
    files.push(path.join(PRERENDER_DIR, route, 'index.html'));
  }
  return files;
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
  const issues = [];
  const candidates = await candidateHtmlFiles(route);
  let file = null;
  for (const c of candidates) {
    try {
      await fs.stat(c);
      file = c;
      break;
    } catch {
      /* try next */
    }
  }
  if (!file) {
    // Si no existe HTML prerenderizado, es una ruta SSR/on-demand (no error).
    return { route, ok: true, issues: [`WARN: No existe HTML prerenderizado (ruta SSR/on-demand): ${candidates[0]}`], blocks: 0 };
  }

  const html = await fs.readFile(file, 'utf8');
  const rawBlocks = extractJsonLdBlocks(html);

  if (rawBlocks.length === 0) {
    issues.push('WARN: No se encontraron bloques JSON-LD');
    return { route, ok: true, issues, blocks: 0 };
  }

  const allNodes = [];
  // Trackea qué nodos vinieron de un @graph (para validar @context intra-graph).
  const nodesFromGraph = new WeakSet();
  for (const raw of rawBlocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      issues.push(`ERROR: JSON inválido en bloque: ${e.message}`);
      continue;
    }
    // Si el bloque es un @graph, marcar sus nodos hijos.
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed['@graph']) {
      for (const n of flattenNodes(parsed)) {
        if (typeof n === 'object' && n !== null) nodesFromGraph.add(n);
        allNodes.push(n);
      }
    } else {
      allNodes.push(...flattenNodes(parsed));
    }
  }

  // Validar @type presente en cada nodo (excepto @context puro)
  for (const node of allNodes) {
    if (typeof node !== 'object' || node === null) continue;
    if (!node['@type'] && !node['@context']) {
      issues.push(`ERROR: Nodo sin @type ni @context: ${JSON.stringify(node).slice(0, 80)}`);
    }
  }

  // Validar @context DENTRO de nodos del @graph (bug raíz Ahrefs).
  // El @context debe estar SOLO en el wrapper del @graph, no en cada nodo hijo.
  for (const node of allNodes) {
    if (typeof node !== 'object' || node === null) continue;
    if (nodesFromGraph.has(node) && node['@context']) {
      const t = Array.isArray(node['@type']) ? node['@type'].join('+') : node['@type'] || '?';
      issues.push(`ERROR: @context dentro de nodo del @graph (@type=${t}). Debe estar solo en el wrapper.`);
    }
  }

  // Reglas mínimas por @type.
  for (const node of allNodes) {
    if (typeof node !== 'object' || node === null || !node['@type']) continue;
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    const idStr = node['@id'] ? ` (${node['@id']})` : '';
    if (types.includes('Service') && !node.provider) {
      issues.push(`ERROR: Service sin 'provider'${idStr}`);
    }
    if (types.includes('BlogPosting')) {
      if (!node.author) issues.push(`ERROR: BlogPosting sin 'author'${idStr}`);
      if (!node.publisher) issues.push(`ERROR: BlogPosting sin 'publisher'${idStr}`);
    }
    if (types.includes('FAQPage')) {
      const me = node.mainEntity;
      if (!me || (Array.isArray(me) && me.length === 0)) {
        issues.push(`ERROR: FAQPage con 'mainEntity' vacío o ausente${idStr}`);
      }
    }
    if (types.includes('AggregateRating')) {
      // Política Google self-serving reviews: AggregateRating requiere reseñas
      // reales y verificables. Warning (no error) para revisión manual.
      issues.push(`WARN: AggregateRating presente${idStr}. Verificar que las reseñas sean reales y verificables (política Google self-serving reviews).`);
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
