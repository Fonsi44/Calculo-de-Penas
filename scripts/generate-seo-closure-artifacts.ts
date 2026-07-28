import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseCsv, stringifyCsv } from '../lib/csv';
import { getEditorialResponsibility } from '../lib/legal-review';
import { landingsLocales } from '../data/landings-locales';

type RecordRow = Record<string, string>;

function recordsFromCsv(path: string): RecordRow[] {
  const rows = parseCsv(readFileSync(path, 'utf8').split('\n').filter((line) => !line.startsWith('#')).join('\n'));
  const [header, ...data] = rows;
  return data.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(
    header.map((key, index) => [key, row[index] ?? '']),
  ));
}

function writeCsv(path: string, header: string[], rows: unknown[][]) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stringifyCsv([header, ...rows]));
}

const inventory = recordsFromCsv('docs/seo/current/blog-editorial-inventory.csv');
const gsc = recordsFromCsv('docs/seo/current/gsc-query-page-map.csv');
const gscByPage = new Map<string, { clicks: number; impressions: number; query: string; position: number }>();
for (const row of gsc) {
  const current = gscByPage.get(row.page) ?? { clicks: 0, impressions: 0, query: '', position: 0 };
  const impressions = Number(row.impressions);
  current.clicks += Number(row.clicks);
  current.impressions += impressions;
  if (!current.query || impressions > (gsc.find((candidate) => candidate.query === current.query)?.impressions ? Number(gsc.find((candidate) => candidate.query === current.query)!.impressions) : 0)) {
    current.query = row.query;
    current.position = Number(row.position);
  }
  gscByPage.set(row.page, current);
}

const reviewRows = inventory.map((row) => {
  const responsibility = getEditorialResponsibility(row.category);
  const wordCount = Number(row.word_count);
  const sourceCount = Number(row.source_count);
  const impressions = Number(row.impressions);
  const changeType = wordCount < 600
    ? 'CONTENT_REWRITE_REQUIRED'
    : sourceCount === 0
      ? 'DOCUMENTARY_REVIEW_READY'
      : responsibility.requiresHumanAssignment
        ? 'HUMAN_ASSIGNMENT_REQUIRED'
        : 'READY_FOR_LAWYER_REVIEW';
  const risk = ['derecho-penal', 'derecho-laboral', 'derecho-de-familia', 'derecho-civil'].includes(row.category)
    ? 'HIGH'
    : 'MEDIUM';
  const priority = Math.max(1, 1000 - impressions - (risk === 'HIGH' ? 200 : 0));
  const area = row.category;
  const packetArea = area === 'derecho-de-familia' ? 'familia'
    : area === 'derecho-laboral' ? 'laboral'
      : area === 'derecho-penal' ? 'penal'
        : area === 'derecho-civil' ? 'civil'
          : '';
  return {
    priority,
    article: row.url,
    area,
    author: responsibility.author || 'HUMAN_ASSIGNMENT_REQUIRED',
    reviewer: responsibility.defaultReviewer ?? 'HUMAN_ASSIGNMENT_REQUIRED',
    changeType,
    claims: Math.max(1, Math.round(wordCount / 180)),
    sources: sourceCount,
    impressions,
    clicks: Number(row.clicks),
    risk,
    packet: packetArea ? `docs/seo/review-packets/${packetArea}/batch-01.md` : '',
    status: 'lawyer_review_pending',
    title: row.title_rendered,
  };
}).sort((a, b) => a.priority - b.priority);

writeCsv(
  'docs/seo/current/lawyer-review-queue.csv',
  ['priority', 'article', 'area', 'author_proposed', 'reviewer_proposed', 'change_type', 'claims_count', 'sources_count', 'gsc_impressions', 'gsc_clicks', 'risk', 'review_packet', 'status'],
  reviewRows.map((row, index) => [
    index + 1, row.article, row.area, row.author, row.reviewer, row.changeType,
    row.claims, row.sources, row.impressions, row.clicks, row.risk, row.packet, row.status,
  ]),
);

for (const area of ['penal', 'laboral', 'familia', 'civil']) {
  const selected = reviewRows.filter((row) => row.packet.includes(`/${area}/`)).slice(0, 10);
  const lines = [
    `# Paquete de revisión jurídica — ${area} — lote 01`,
    '',
    '> Estado: `lawyer_review_pending`. Ninguna entrada de este paquete declara firma o revisión jurídica real.',
    '',
    ...selected.flatMap((row, index) => [
      `## ${index + 1}. ${row.title}`,
      '',
      `- URL: ${row.article}`,
      `- Autor propuesto: ${row.author}`,
      `- Revisor propuesto: ${row.reviewer}`,
      `- GSC: ${row.impressions} impresiones; ${row.clicks} clics.`,
      `- Fuentes detectadas: ${row.sources}.`,
      `- Pregunta al abogado: ¿son correctas, vigentes y suficientemente matizadas todas las normas, plazos, excepciones y consecuencias jurídicas afirmadas en este artículo?`,
      `- Decisión requerida: aprobar, corregir con cita exacta o devolver para reescritura.`,
      '',
    ]),
  ];
  const path = `docs/seo/review-packets/${area}/batch-01.md`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${lines.join('\n')}\n`);
}

const remediation = new Map([
  ['allanamiento-ilegal-violacion-domicilio-honduras', ['Allanamiento en Honduras: orden judicial y derechos', 'Cuándo puede realizarse un allanamiento en Honduras, qué debe contener la orden judicial y cómo actuar sin obstaculizar a la autoridad.']],
  ['contratos-franquicia-aspectos', ['Contrato de franquicia en Honduras: cláusulas y riesgos', 'Cláusulas que conviene revisar en un contrato de franquicia en Honduras: territorio, regalías, uso de marca, terminación y solución de conflictos.']],
  ['guia-aduanera-importaciones-honduras', ['Importaciones en Honduras: requisitos y proceso aduanero', 'Documentos, clasificación arancelaria, tributos y etapas generales del despacho para importar mercancías legalmente en Honduras.']],
  ['usucapion-prescripcion-adquisitiva-honduras', ['Usucapión en Honduras: requisitos y proceso judicial', 'Qué es la prescripción adquisitiva, qué elementos deben acreditarse y cómo se tramita judicialmente una pretensión de usucapión en Honduras.']],
]);
writeCsv(
  'docs/seo/current/title-metadata-remediation.csv',
  ['url', 'source', 'title_before', 'title_after', 'meta_before', 'meta_after', 'h1_before', 'h1_after', 'reason', 'gsc_query', 'impressions', 'ctr', 'implementation_location', 'status'],
  inventory.filter((row) => remediation.has(row.slug)).map((row) => {
    const [title, description] = remediation.get(row.slug)!;
    const metrics = gscByPage.get(row.url);
    return [row.url, 'blog_posts + render override', row.title_db, title, row.meta_description, description, row.h1, title, 'truncado o formulación incompleta', metrics?.query ?? '', metrics?.impressions ?? 0, row.ctr, 'lib/blog.ts', 'IMPLEMENTED_PREVIEW'];
  }),
);

writeCsv(
  'docs/seo/current/query-url-map.csv',
  ['query', 'page', 'clicks', 'impressions', 'ctr', 'position'],
  gsc.map((row) => [row.query, row.page, row.clicks, row.impressions, row.ctr, row.position]),
);

const nacaomePaths = [
  'https://www.pinedayasociadoshn.com/',
  'https://www.pinedayasociadoshn.com/abogados-en-nacaome',
  'https://www.pinedayasociadoshn.com/blog/practica-legal/abogados-en-nacaome',
];
writeCsv(
  'docs/seo/current/redirect-candidates.csv',
  ['source', 'target', 'decision', 'evidence', 'production_action', 'rollback'],
  nacaomePaths.map((path) => {
    const metrics = gscByPage.get(path);
    if (path.endsWith('/blog/practica-legal/abogados-en-nacaome')) {
      return [path, '/abogados-en-nacaome', 'REDIRECT_CANDIDATE', `${metrics?.impressions ?? 0} impresiones GSC; intención local solapada`, 'PREPARE_ONLY', 'retirar regla antes de deploy'];
    }
    return [path, '', path.endsWith('/abogados-en-nacaome') ? 'KEEP_INFORMATIONAL_LOCAL' : 'KEEP_COMMERCIAL_BRAND', `${metrics?.impressions ?? 0} impresiones GSC`, 'NONE', 'n/a'];
  }),
);

writeCsv(
  'docs/seo/current/local-landing-classification.csv',
  ['url', 'municipality', 'office_exists', 'service_origin', 'clicks', 'impressions', 'ctr', 'position', 'content_similarity', 'unique_local_value', 'institutions_verified', 'decision', 'target', 'reason', 'production_action'],
  landingsLocales.map((landing) => {
    const url = `https://www.pinedayasociadoshn.com${landing.path ?? `/abogados-en-${landing.slug}`}`;
    const metrics = gscByPage.get(url);
    const unique = (landing.localContext?.length ?? 0) > 0 && (landing.institutions?.length ?? 0) > 0;
    const decision = landing.sedeFisica ? 'KEEP_AND_IMPROVE' : unique ? 'KEEP_AND_IMPROVE' : 'NOINDEX_UNTIL_UNIQUE';
    return [url, landing.ciudad, landing.sedeFisica ? 'yes' : 'no', landing.servedFrom ?? 'oficina de Nacaome', metrics?.clicks ?? 0, metrics?.impressions ?? 0, metrics ? (metrics.impressions ? metrics.clicks / metrics.impressions : 0) : 0, metrics?.position ?? 0, 'PENDING_SEMANTIC_SCORE', unique ? 'yes' : 'no', landing.institutions?.length ?? 0, decision, '', unique ? 'contexto e instituciones registrados' : 'falta valor local único demostrable', 'PREVIEW_ONLY'];
  }),
);

console.log(`Cola jurídica: ${reviewRows.length}; landings: ${landingsLocales.length}; pares GSC: ${gsc.length}.`);
