// Construye el patch manifest on-page (title/meta/H1) del lote 1.
// 1) Lee el lote y el plan (título actual). 2) Obtiene meta/H1 actuales desde
// Production (GET read-only). 3) Propone mejoras alineadas con la intención y
// la demanda. 4) Escribe batch-1-title-meta-patch.json (documentación de la
// propuesta; NO escribe en la DB).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalOrigin } from './seo-data-config.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GROWTH = resolve(ROOT, 'docs', 'seo', 'growth');
if (!existsSync(GROWTH)) mkdirSync(GROWTH, { recursive: true });
const ORIGIN = canonicalOrigin();

function parseCsvLine(line) {
  const fields = [];
  const re = /("(?:[^"]|"")*"|[^,]*)(?:,|$)/g;
  let m;
  while ((m = re.exec(line))) {
    if (m[1] === undefined) break;
    fields.push(m[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
    if (re.lastIndex >= line.length) break;
  }
  return fields;
}
function readCsv(file) {
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim());
  const header = parseCsvLine(lines[0].replace(/\r$/, ''));
  return lines.slice(1).map((l) => {
    const fields = parseCsvLine(l.replace(/\r$/, ''));
    const out = {};
    header.forEach((h, i) => { out[h] = (fields[i] ?? '').trim(); });
    return out;
  });
}

const batch = readCsv(resolve(GROWTH, 'batch-1-selection.csv'));
const plan = readCsv(resolve(ROOT, 'docs/seo/current/content-action-plan.csv'));
const titleByUrl = new Map(plan.map((r) => [r.url, r.title]));

const TIMEOUT = 20000;
async function getCurrent(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return { status: res.status, title: '', meta: '', h1: '' };
    const html = await res.text();
    const t = html.match(/<title>([^<]*)<\/title>/);
    const m = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const h = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    return {
      status: res.status,
      title: t ? t[1].trim() : '',
      meta: m ? m[1].trim() : '',
      h1: h ? h[1].replace(/<[^>]+>/g, '').trim() : '',
    };
  } catch {
    return { status: 0, title: '', meta: '', h1: '' };
  }
}

// Propuestas: plantillas de título/meta/H1 por categoría+cluster (YMYL,
// sin promesas, sin "guía completa" forzado, respuesta directa).
function propose(url, slug, category, cur) {
  const planTitle = titleByUrl.get(url) || slug;
  const cluster = slug;
  const cat = (category || '').split('/').pop();
  const title = planTitle.length <= 60 ? planTitle : planTitle;
  // Título propuesto: anteponer la consulta principal sin exceder ~60 chars.
  const titles = {
    'derecho-laboral/empleador-no-paga-salario-honduras': 'No me paga el salario en Honduras: qué hacer y dónde reclamar',
    'derecho-penal/cuando-necesito-abogado-penalista-honduras': '¿Cuándo necesito un abogado penalista en Honduras?',
    'derechos-ciudadanos/derecho-de-peticion-instituciones-honduras': 'Derecho de petición en Honduras: cómo ejercerlo ante instituciones',
    'derecho-de-familia/divorcio-honduras-guia-completa': 'Divorcio en Honduras: tipos, requisitos y proceso (2026)',
    'derecho-penal/estafas-fraudes-tipos-penales-honduras': 'Estafa en Honduras: tipos penales, penas y cómo denunciar',
    'derecho-laboral/derechos-trabajadora-embarazada-honduras': 'Derechos de la trabajadora embarazada en Honduras: fuero y prestaciones',
    'proceso-penal/habeas-corpus-cuando-interponer-honduras': 'Hábeas corpus en Honduras: cuándo y cómo interponerlo',
    'derecho-de-familia/custodia-hijos-honduras-juez': 'Custodia de hijos en Honduras: qué decide el juez y cómo pedirla',
    'derecho-notarial/poder-legal-honduras-cuando-se-necesita': 'Poder legal en Honduras: tipos y cuándo se necesita',
    'derecho-ambiental/licencia-ambiental-categorias-plazos-honduras': 'Licencia ambiental en Honduras: categorías, requisitos y plazos',
    'proceso-penal/juicio-oral-etapas-que-esperar-honduras': 'Juicio oral en Honduras: etapas y qué esperar',
    'derecho-laboral/despido-laboral-honduras-guia-completa': 'Despido laboral en Honduras: indemnización y derechos del trabajador',
    'hondurenos-en-espana/nacionalidad-espanola-para-hondurenos-residencia-plazos': 'Nacionalidad española para hondureños: plazos y requisitos',
    'derecho-civil/reclamar-deuda-legalmente-honduras': 'Reclamar una deuda legalmente en Honduras: pasos y plazos',
    'derecho-penal/defensa-penal-menores-edad-honduras': 'Defensa penal de menores en Honduras: proceso y derechos',
    'derecho-de-familia/pension-alimenticia-honduras-guia-completa': 'Pensión alimenticia en Honduras: porcentaje, cálculo y proceso',
    'derecho-administrativo/expropiacion-forzosa-derechos-propietario-honduras': 'Expropiación forzosa en Honduras: derechos del propietario',
    'derecho-administrativo/contratacion-publica-licitaciones': 'Contratación pública en Honduras: licitaciones y requisitos',
  };
  const proposedTitle = titles[`${cat}/${slug}`] || (title.length > 65 ? title.slice(0, 62) + '…' : title);
  const meta = `Resuelve ${cluster.replace(/-/g, ' ')} con pasos concretos, requisitos y fuentes oficiales en Honduras. Sin compromiso.`;
  const h1 = proposedTitle.replace(/ \(2026\)$/, '').replace(/\.$/, '');
  return { proposed_title: proposedTitle, proposed_meta: meta, proposed_h1: h1 };
}

async function main() {
  const patch = [];
  for (const b of batch) {
    const url = b.url;
    const slug = url.split('/').pop();
    const cat = b.url.split('/blog/')[1]?.split('/')[0] || '';
    const cur = await getCurrent(url);
    const p = propose(url, slug, cat, cur);
    patch.push({
      url, slug, category: cat,
      gsc_evidence: b.gsc_evidence,
      current: { title: cur.title || titleByUrl.get(url) || '', meta: cur.meta, h1: cur.h1, http_status: cur.status },
      proposed: p,
      rationale: 'Demanda GSC real (impresiones+posición 4–20) con CTR mejorable; title/meta/H1 alineados a la consulta principal, sin promesas ni ' +
        'consulta gratuita. Aplicación requiere flujo editorial + revisión jurídica (YMYL).',
      official_sources_required: 'Poder Judicial / La Gaceta / dependencia del sector según el tema',
      legal_review: 'REQUIRED',
    });
  }
  writeFileSync(resolve(GROWTH, 'batch-1-title-meta-patch.json'), JSON.stringify({ generatedAt: new Date().toISOString(), count: patch.length, patch }, null, 2), 'utf8');
  console.log('Patch manifest: ' + patch.length + ' URLs');
  for (const p of patch.slice(0, 6)) {
    console.log(`  - ${p.slug} [HTTP ${p.current.http_status}] actual: "${(p.current.title || '').slice(0, 40)}" → "${p.proposed.proposed_title.slice(0, 50)}"`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
