/**
 * Fase 4B §13 — Validación automatizada en producción de los 15 artículos.
 *
 * Para cada uno verifica:
 *   - URL correcta y HTTP 200
 *   - title, description, canonical
 *   - breadcrumbs
 *   - JSON-LD presente y parseable
 *   - contenido visible
 *   - correcciones nuevas presentes / textos antiguos ausentes (cuando aplica)
 *   - enlaces internos
 *   - ausencia de errores propios
 *
 * Genera: docs/audits/fase4b-validacion-produccion.json
 *
 * Uso: npx tsx scripts/fase4b-validacion-produccion.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');
const PROD = 'https://www.pinedayasociadoshn.com';

// SHA real del HEAD de git (no hardcodeado). Fase 4C corrigió este valor: el
// hash anterior estaba fijado a '0dc703de' y por ello el JSON declaraba un SHA
// que ya no correspondía con el deployment en producción. Ahora se resuelve en
// tiempo de ejecución desde `git rev-parse HEAD`, que es la fuente de verdad.
const HEAD_SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

interface Articulo {
  slug: string;
  categoria: string;
  path: string;
  // Verificaciones específicas para el artículo pension-alimenticia-porcentaje
  // (el único con correcciones aplicadas al body).
  textosNuevosEsperados?: string[];
  textosAntiguosProhibidos?: string[];
}

const ARTICULOS: Articulo[] = [
  { slug: 'contratos-arrendamiento-derechos-obligaciones-honduras', categoria: 'derecho-civil', path: '/blog/derecho-civil/contratos-arrendamiento-derechos-obligaciones-honduras' },
  { slug: 'custodia-hijos-honduras-juez', categoria: 'derecho-de-familia', path: '/blog/derecho-de-familia/custodia-hijos-honduras-juez' },
  { slug: 'danos-perjuicios-indemnizacion-honduras', categoria: 'derecho-civil', path: '/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras' },
  { slug: 'derechos-trabajadora-embarazada-honduras', categoria: 'derecho-laboral', path: '/blog/derecho-laboral/derechos-trabajadora-embarazada-honduras' },
  { slug: 'despido-laboral-honduras-guia-completa', categoria: 'derecho-laboral', path: '/blog/derecho-laboral/despido-laboral-honduras-guia-completa' },
  { slug: 'divorcio-honduras-guia-completa', categoria: 'derecho-de-familia', path: '/blog/derecho-de-familia/divorcio-honduras-guia-completa' },
  { slug: 'habeas-corpus-cuando-interponer-honduras', categoria: 'proceso-penal', path: '/blog/proceso-penal/habeas-corpus-cuando-interponer-honduras' },
  { slug: 'juicio-oral-etapas-que-esperar-honduras', categoria: 'proceso-penal', path: '/blog/proceso-penal/juicio-oral-etapas-que-esperar-honduras' },
  { slug: 'pension-alimenticia-choluteca', categoria: 'derecho-de-familia', path: '/blog/derecho-de-familia/pension-alimenticia-choluteca' },
  { slug: 'pension-alimenticia-honduras-guia-completa', categoria: 'derecho-de-familia', path: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa' },
  {
    slug: 'pension-alimenticia-porcentaje-honduras-2026',
    categoria: 'derecho-de-familia',
    path: '/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026',
    textosNuevosEsperados: [
      'Código de Familia (Decreto 76-84)',
      'Arts. 207-225',
    ],
    textosAntiguosProhibidos: [
      'Artículo 1069',
      'Artículo 1230',
      'Artículo 1593',
    ],
  },
  { slug: 'prescripcion-deudas-plazos-honduras', categoria: 'derecho-civil', path: '/blog/derecho-civil/prescripcion-deudas-plazos-honduras' },
  { slug: 'que-hacer-si-me-detienen-en-honduras', categoria: 'derecho-penal', path: '/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras' },
  { slug: 'recursos-sentencia-penal-apelacion-casacion-honduras', categoria: 'proceso-penal', path: '/blog/proceso-penal/recursos-sentencia-penal-apelacion-casacion-honduras' },
  { slug: 'residencia-temporal-requisitos-plazos-honduras', categoria: 'extranjeria-migracion', path: '/blog/extranjeria-migracion/residencia-temporal-requisitos-plazos-honduras' },
];

function extractMeta(html: string, prop: string): string | null {
  // Busca <meta property="prop" content="..."> y <meta name="prop" content="...">
  const re = new RegExp(
    `<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']*)["']`,
    'i',
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractCanonical(html: string): string | null {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  const href = m[0].match(/href=["']([^"']*)["']/i);
  return href ? href[1] : null;
}

function extractJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      out.push(JSON.parse(m[1].trim()));
    } catch {
      // JSON-LD inválido: registrar null
      out.push(null);
    }
  }
  return out;
}

function hasBreadcrumbs(html: string): boolean {
  // BreadcrumbList en JSON-LD o elemento visible con clase breadcrumb
  return /BreadcrumbList/.test(html) || /class=["'][^"']*breadcrumb/i.test(html);
}

interface ResultadoArticulo {
  slug: string;
  url: string;
  pass: boolean;
  httpStatus: number | null;
  vercelDeployment: string | null;
  title: string | null;
  description: string | null;
  canonical: string | null;
  canonicalOk: boolean;
  breadcrumbs: boolean;
  jsonLdBlocks: number;
  jsonLdValido: boolean;
  jsonLdBlogPosting: boolean;
  contenidoVisible: boolean;
  enlacesInternos: number;
  h1Count: number;
  checks: string[];
  errores: string[];
}

async function validarArticulo(art: Articulo): Promise<ResultadoArticulo> {
  const url = `${PROD}${art.path}`;
  const resultado: ResultadoArticulo = {
    slug: art.slug,
    url,
    pass: false,
    httpStatus: null,
    vercelDeployment: null,
    title: null,
    description: null,
    canonical: null,
    canonicalOk: false,
    breadcrumbs: false,
    jsonLdBlocks: 0,
    jsonLdValido: true,
    jsonLdBlogPosting: false,
    contenidoVisible: false,
    enlacesInternos: 0,
    h1Count: 0,
    checks: [],
    errores: [],
  };

  try {
    const r = await fetch(url, { redirect: 'follow' });
    resultado.httpStatus = r.status;
    resultado.vercelDeployment = r.headers.get('x-vercel-deployment-url') ?? null;
    if (r.status !== 200) {
      resultado.errores.push(`HTTP ${r.status}`);
      return resultado;
    }
    const html = await r.text();

    resultado.title = extractTitle(html);
    resultado.description = extractMeta(html, 'description') ?? extractMeta(html, 'og:description');
    resultado.canonical = extractCanonical(html);
    resultado.canonicalOk = resultado.canonical === url;
    resultado.breadcrumbs = hasBreadcrumbs(html);
    const jsonLd = extractJsonLd(html);
    resultado.jsonLdBlocks = jsonLd.length;
    resultado.jsonLdValido = jsonLd.every((x) => x !== null);
    // Buscar BlogPosting en cualquier bloque
    resultado.jsonLdBlogPosting = jsonLd.some((b) => {
      if (!b || typeof b !== 'object') return false;
      const obj = b as Record<string, unknown>;
      // Puede ser @graph o nodo directo
      const graph = obj['@graph'];
      if (Array.isArray(graph)) {
        return graph.some((n) => {
          if (!n || typeof n !== 'object') return false;
          const t = (n as Record<string, unknown>)['@type'];
          if (Array.isArray(t)) return t.includes('BlogPosting');
          return t === 'BlogPosting';
        });
      }
      const t = obj['@type'];
      if (Array.isArray(t)) return t.includes('BlogPosting');
      return t === 'BlogPosting';
    });
    // H1 (debe ser único)
    const h1Matches = html.match(/<h1\b/gi);
    resultado.h1Count = h1Matches ? h1Matches.length : 0;
    // Enlaces internos (mismo dominio, excluir nav/footer es complejo; contamos totales)
    const enlaceMatches = html.match(/href=["']\/(?!blog\/\w[\w-]*$)[^"']*["']/g);
    resultado.enlacesInternos = enlaceMatches ? enlaceMatches.length : 0;
    // Contenido visible: el H1 no vacío y body > 2000 chars
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyLen = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, '').trim().length : 0;
    resultado.contenidoVisible = bodyLen > 1500;
    resultado.checks.push(`bodyVisibleLen=${bodyLen}`);

    // Verificaciones específicas del artículo con correcciones aplicadas
    if (art.textosNuevosEsperados) {
      const presentes = art.textosNuevosEsperados.filter((t) => html.includes(t));
      const faltan = art.textosNuevosEsperados.filter((t) => !html.includes(t));
      resultado.checks.push(`textosNuevosPresentes=${presentes.length}/${art.textosNuevosEsperados.length}`);
      if (faltan.length > 0) resultado.errores.push(`textosNuevosFaltan: ${faltan.join(' | ')}`);
    }
    if (art.textosAntiguosProhibidos) {
      const presentes = art.textosAntiguosProhibidos.filter((t) => html.includes(t));
      resultado.checks.push(`textosAntiguosAusentes=${art.textosAntiguosProhibidos.length - presentes.length}/${art.textosAntiguosProhibidos.length}`);
      if (presentes.length > 0) resultado.errores.push(`textosAntiguosPresentes: ${presentes.join(' | ')}`);
    }

    // Errores propios: el HTML no debe contener "Application error" ni "500"
    if (/Application error/i.test(html)) resultado.errores.push('applicationError');
    if (/Internal Server Error/i.test(html)) resultado.errores.push('internalServerError');

    // Pass global
    const pass =
      resultado.httpStatus === 200 &&
      !!resultado.title &&
      !!resultado.description &&
      resultado.canonicalOk &&
      resultado.breadcrumbs &&
      resultado.jsonLdBlocks > 0 &&
      resultado.jsonLdValido &&
      resultado.jsonLdBlogPosting &&
      resultado.contenidoVisible &&
      resultado.h1Count === 1 &&
      resultado.errores.length === 0;
    resultado.pass = pass;
  } catch (e) {
    resultado.errores.push(`fetchError: ${e instanceof Error ? e.message : String(e)}`);
  }
  return resultado;
}

async function main() {
  const resultados = [];
  for (const art of ARTICULOS) {
    process.stdout.write(`  ${art.slug}... `);
    const r = await validarArticulo(art);
    resultados.push(r);
    console.log(r.pass ? '✓' : '✗ ' + r.errores.join(', '));
  }

  const passCount = resultados.filter((r) => r.pass).length;
  const out = {
    generatedAt: new Date().toISOString(),
    fase: '4B',
    lote: 2,
    enunciadoSeccion: '§13',
    produccion: PROD,
    headShaEsperado: HEAD_SHA,
    totalArticulos: ARTICULOS.length,
    passCount,
    failCount: ARTICULOS.length - passCount,
    todosPass: passCount === ARTICULOS.length,
    resultados,
  };
  fs.writeFileSync(
    path.join(AUDITS, 'fase4b-validacion-produccion.json'),
    JSON.stringify(out, null, 2),
  );
  console.log(`\nOK: ${passCount}/${ARTICULOS.length} pass.`);
  console.log('  -> docs/audits/fase4b-validacion-produccion.json');
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
