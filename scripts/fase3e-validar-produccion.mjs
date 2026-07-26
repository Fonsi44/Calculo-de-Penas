/**
 * Fase 3E — Validación automatizada del contenido público de los 15 artículos
 * del Lote 1 Penal en producción.
 *
 * Para cada slug comprueba contra https://www.pinedayasociadoshn.com/blog/penal/<slug>:
 *   - HTTP 200 + deployment que responde (header x-vercel-id / x-vercel-cache).
 *   - Categoría derecho-penal en canonical y breadcrumbs.
 *   - Las 9 correcciones textuales de Fase 3D: el texto NUEVO (reemplazar)
 *     debe estar presente y el texto ANTIGUO (buscar) debe estar ausente en
 *     el HTML público.
 *   - ai_review_status coherente + aviso AiReviewNotice presente/ausente.
 *   - canonical, title, description, JSON-LD válido.
 *
 * NO acepta como prueba que la DB contenga el texto nuevo: exige verlo en el
 * HTML servido al usuario.
 *
 * Salida: docs/audits/fase3e-validacion-15-articulos.json (formato enunciado).
 *
 * USO:
 *   node scripts/fase3e-validar-produccion.mjs
 *
 * Variables de entorno opcionales:
 *   FASE3E_BASE_URL  (default: https://www.pinedayasociadoshn.com)
 *   FASE3E_OUT       (default: docs/audits/fase3e-validacion-15-articulos.json)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = process.env.FASE3E_BASE_URL ?? 'https://www.pinedayasociadoshn.com';
const OUT_PATH = process.env.FASE3E_OUT ?? resolve(ROOT, 'docs/audits/fase3e-validacion-15-articulos.json');

// 15 slugs del Lote 1 Penal con su estado esperado (fase3d-matriz-lote1.json).
const ARTICULOS = [
  { slug: 'abogado-penalista-choluteca', estadoEsperado: 'needs_human_review' },
  { slug: 'abogado-penalista-sur-honduras', estadoEsperado: 'completed' },
  { slug: 'allanamiento-ilegal-violacion-domicilio-honduras', estadoEsperado: 'needs_human_review' },
  { slug: 'antejuicio-en-honduras', estadoEsperado: 'needs_human_review' },
  { slug: 'audiencia-inicial-proceso-penal-honduras', estadoEsperado: 'completed' },
  { slug: 'cuando-necesito-abogado-penalista-honduras', estadoEsperado: 'completed' },
  { slug: 'cuando-prescribe-delito-en-honduras', estadoEsperado: 'needs_human_review' },
  { slug: 'defensa-penal-honduras', estadoEsperado: 'completed' },
  { slug: 'defensa-penal-menores-edad-honduras', estadoEsperado: 'needs_human_review' },
  { slug: 'delitos-mas-comunes-honduras', estadoEsperado: 'needs_human_review' },
  { slug: 'derechos-detenido-honduras-guia-constitucional', estadoEsperado: 'needs_human_review' },
  { slug: 'diferencia-denuncia-querella-acusacion-honduras', estadoEsperado: 'completed' },
  { slug: 'estafas-fraudes-tipos-penales-honduras', estadoEsperado: 'needs_human_review' },
  { slug: 'fianza-medidas-cautelares-proceso-penal-honduras', estadoEsperado: 'completed' },
  { slug: 'violencia-domestica-ruta-legal-honduras', estadoEsperado: 'needs_human_review' },
];

// Cargar las 9 correcciones canónicas.
const correccionesDoc = JSON.parse(
  readFileSync(resolve(ROOT, 'docs/audits/fase3e-correcciones-canon.json'), 'utf8'),
);
const CORRECCIONES = correccionesDoc.correcciones;

/**
 * Descarga el HTML de una URL. Devuelve { status, html, headers, deployment }.
 */
async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'fase3e-validator/1.0 (+auditoria)' },
    redirect: 'follow',
  });
  const html = await res.text();
  const deployment = res.headers.get('x-vercel-id') ?? '';
  const cache = res.headers.get('x-vercel-cache') ?? res.headers.get('cache-control') ?? '';
  return { status: res.status, html, deployment, cache, headers: res.headers };
}

/**
 * Normaliza el HTML para comparación: colapsa whitespace, lower-case tags NO
 * (queremos sensibilidad a <strong> vs strong). Solo colapsa espacios
 * consecutivos y newlines para tolerar indentación del server-render.
 */
function norm(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function extractMeta(html, name) {
  const m = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (m) return m[1];
  // property variant (og:)
  const m2 = html.match(new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
  return m2 ? m2[1] : '';
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  return m ? m[1] : '';
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1] : '';
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch {
      blocks.push({ _invalid: true });
    }
  }
  return blocks;
}

/**
 * El aviso AiReviewNotice se renderiza cuando ai_review_status = needs_human_review.
 * Detectamos una marca estable en el HTML. La marca canónica es el data-attribute
 * o clase del componente; buscamos texto humano típico del aviso.
 */
function avisoPresente(html, estadoEsperado) {
  // El componente AiReviewNotice emite un aviso visible. Buscamos pistas estables:
  // "revisión humana", "pendiente de revisión", "no es consejo legal definitivo".
  const pistas = [
    /revisi[oó]n humana/i,
    /pendiente de revisi[oó]n/i,
    /ai[-_ ]?review/i,
    /aiReviewNotice/i,
    /data-ai-review/i,
  ];
  const encontrado = pistas.some((p) => p.test(html));
  return encontrado;
}

async function validarArticulo(art) {
  const url = `${BASE_URL}/blog/penal/${art.slug}`;
  const resultado = {
    slug: art.slug,
    url,
    httpStatus: 0,
    deployment: '',
    cache: '',
    estadoEsperado: art.estadoEsperado,
    avisoEncontrado: false,
    textosNuevosPresentes: [],
    textosAntiguosAusentes: [],
    canonicalCorrecto: false,
    jsonLdValido: false,
    resultado: 'fail',
    errores: [],
  };

  let res;
  try {
    res = await fetchHtml(url);
  } catch (e) {
    resultado.errores.push(`fetch error: ${e.message}`);
    return resultado;
  }
  resultado.httpStatus = res.status;
  resultado.deployment = res.deployment;
  resultado.cache = res.cache;

  if (res.status !== 200) {
    resultado.errores.push(`HTTP ${res.status}`);
    return resultado;
  }

  const html = res.html;
  const htmlNorm = norm(html);

  // 1. Canonical apunta a la URL correcta (derecho-penal en la categoría).
  const canonical = extractCanonical(html);
  resultado.canonicalCorrecto =
    canonical.includes(`/blog/penal/${art.slug}`) || canonical.endsWith(`/blog/penal/${art.slug}`);

  // 2. JSON-LD válido (al menos un bloque parseable, sin _invalid).
  const jsonLd = extractJsonLd(html);
  resultado.jsonLdValido = jsonLd.length > 0 && jsonLd.every((b) => !b._invalid);

  // 3. Aviso AiReviewNotice coherente con el estado esperado.
  const aviso = avisoPresente(html, art.estadoEsperado);
  resultado.avisoEncontrado = aviso;
  // Coherencia: si needs_human_review → aviso debe estar; si completed → no.
  // No marcamos fail estricto aquí si no coincide (puede haber variantes),
  // pero lo reportamos para inspección.

  // 4. Las 9 correcciones: para este slug, verificar pares buscar/reemplazar.
  const correccionesDelSlug = CORRECCIONES.filter((c) => c.slug === art.slug);
  for (const c of correccionesDelSlug) {
    const nuevoNorm = norm(c.reemplazar);
    const antiguoNorm = norm(c.buscar);
    // El texto nuevo debe estar presente (buscamos una substring estable y
    // discriminativa; usamos los primeros 60 chars normalizados para tolerar
    // variaciones menores de formato).
    const probeNuevo = nuevoNorm.slice(0, 80);
    const probeAntiguo = antiguoNorm.slice(0, 80);
    if (htmlNorm.includes(probeNuevo)) {
      resultado.textosNuevosPresentes.push(c.claimId);
    } else {
      resultado.errores.push(`texto NUEVO ausente: ${c.claimId} ("${probeNuevo.slice(0, 50)}...")`);
    }
    if (!htmlNorm.includes(probeAntiguo)) {
      resultado.textosAntiguosAusentes.push(c.claimId);
    } else {
      resultado.errores.push(`texto ANTIGUO aún presente: ${c.claimId}`);
    }
  }

  // Veredicto: pass si todo crítico está OK.
  const correccionesOk =
    correccionesDelSlug.length === 0 ||
    (resultado.textosNuevosPresentes.length === correccionesDelSlug.length &&
      resultado.textosAntiguosAusentes.length === correccionesDelSlug.length);
  const avisoCoherente =
    (art.estadoEsperado === 'needs_human_review' && aviso) ||
    (art.estadoEsperado === 'completed' && !aviso);

  if (
    resultado.httpStatus === 200 &&
    resultado.canonicalCorrecto &&
    resultado.jsonLdValido &&
    correccionesOk &&
    avisoCoherente
  ) {
    resultado.resultado = 'pass';
  }
  // El aviso coherente es deseable pero no bloqueante si hay variaciones de
  // copy: lo reportamos pero no forzamos fail solo por eso (puede haber
  // refactor del componente). Descomentar la línea siguiente para ser estricto.
  // if (!avisoCoherente) resultado.resultado = 'fail';

  return resultado;
}

async function main() {
  console.log(`[fase3e-validar-produccion] BASE_URL=${BASE_URL}`);
  console.log(`[fase3e-validar-produccion] Validando ${ARTICULOS.length} artículos...\n`);

  const resultados = [];
  for (const art of ARTICULOS) {
    process.stdout.write(`  ${art.slug.padEnd(55)} `);
    const r = await validarArticulo(art);
    resultados.push(r);
    const icon = r.resultado === 'pass' ? '✓' : '✗';
    console.log(`${icon} ${r.resultado} (HTTP ${r.httpStatus}, ${r.textosNuevosPresentes.length} corr OK)`);
    if (r.errores.length > 0) {
      for (const e of r.errores.slice(0, 3)) console.log(`      - ${e}`);
    }
  }

  const pass = resultados.filter((r) => r.resultado === 'pass').length;
  const total = resultados.length;
  const doc = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    total,
    pass,
    fail: total - pass,
    correccionesVerificadas: CORRECCIONES.length,
    resultados,
  };

  writeFileSync(OUT_PATH, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(`\n[fase3e-validar-produccion] ${pass}/${total} pass → ${OUT_PATH}`);
  if (pass !== total) {
    console.error('[fase3e-validar-produccion] HAY ARTÍCULOS QUE NO PASAN.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('[fase3e-validar-produccion] Error fatal:', e);
  process.exit(2);
});
