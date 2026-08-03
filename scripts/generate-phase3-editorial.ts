import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseCsv, stringifyCsv } from '../lib/csv';
import { getEditorialResponsibility } from '../lib/legal-review';

type Row = Record<string, string>;
type Source = {
  id: string;
  area: string;
  institution: string;
  title: string;
  number: string;
  type: string;
  url: string;
  sections: string;
  notes: string;
};

const SITE = 'https://www.pinedayasociadoshn.com';
const ACCESSED_AT = '2026-07-28';

throw new Error(
  'INVALID_GENERIC_SCAFFOLD_DO_NOT_APPLY: este generador por área está deshabilitado; use propuestas editoriales individuales por slug.',
);

function records(path: string): Row[] {
  const parsed = parseCsv(
    readFileSync(path, 'utf8').split('\n').filter((line) => !line.startsWith('#')).join('\n'),
  );
  const [header, ...rows] = parsed;
  return rows.filter((row) => row.some(Boolean)).map((row) =>
    Object.fromEntries(header.map((key, index) => [key, row[index] ?? ''])),
  );
}

function writeCsv(path: string, header: string[], rows: unknown[][]) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stringifyCsv([header, ...rows]));
}

const batches: Record<string, string[]> = {
  penal: [
    'que-hacer-si-me-detienen-en-honduras',
    'cuando-prescribe-delito-en-honduras',
    'fianza-medidas-cautelares-proceso-penal-honduras',
    'audiencia-inicial-proceso-penal-honduras',
    'estafas-fraudes-tipos-penales-honduras',
    'allanamiento-ilegal-violacion-domicilio-honduras',
    'derechos-detenido-honduras-guia-constitucional',
    'diferencia-denuncia-querella-acusacion-honduras',
  ],
  laboral: [
    'despido-laboral-honduras-guia-completa',
    'despido-injustificado-honduras-derechos-trabajador',
    'calcular-prestaciones-laborales-honduras',
    'calcular-liquidacion-laboral-honduras',
    'empleador-no-paga-salario-honduras',
    'jornada-laboral-horas-extra-descansos-honduras',
    'derechos-trabajadora-embarazada-honduras',
    'acoso-laboral-mobbing-honduras',
  ],
  familia: [
    'custodia-hijos-honduras-juez',
    'pension-alimenticia-honduras-guia-completa',
    'pension-alimenticia-porcentaje-honduras-2026',
    'divorcio-honduras-guia-completa',
    'union-de-hecho-requisitos-derechos-honduras',
    'violencia-intrafamiliar-denuncia-proteccion-honduras',
    'pension-alimenticia-honduras-como-solicitarla',
    'guarda-custodia-menores-tipos-honduras',
  ],
  'civil-notarial': [
    'contratos-arrendamiento-derechos-obligaciones-honduras',
    'danos-perjuicios-indemnizacion-honduras',
    'testamentos-sucesiones-herencia-honduras',
    'herencias-honduras-fallece-familiar',
    'poder-legal-honduras-cuando-se-necesita',
    'compraventa-inmuebles-aspectos-legales-honduras',
    'prescripcion-deudas-plazos-honduras',
    'reclamar-deuda-legalmente-honduras',
  ],
  mercantil: [
    'contratos-franquicia-aspectos',
    'contratos-mercantiles-esenciales-empresas-honduras',
    'competencia-desleal-como-denunciar-honduras',
    'incumplimiento-contrato-comercial-honduras',
    'constitucion-empresas-honduras-pasos-legales',
    'titulos-valores-cheques-sin-fondo-honduras',
    'elegir-tipo-sociedad-empresa-honduras',
    'tipos-sociedad-mercantil-honduras',
  ],
};

const titles: Record<string, string> = {
  'abogados-en-nacaome': 'Cómo Elegir Abogado en Nacaome: 10 Criterios',
  'despido-laboral-honduras-guia-completa': 'Despido Injustificado en Honduras: Prestaciones y Plazos',
  'danos-perjuicios-indemnizacion-honduras': 'Daños y Perjuicios en Honduras: Cómo Reclamar',
  'testamentos-sucesiones-herencia-honduras': 'Herencias en Honduras: Testamento y Sucesión',
  'union-de-hecho-requisitos-derechos-honduras': 'Unión de Hecho en Honduras: Requisitos y Derechos',
  'estafas-fraudes-tipos-penales-honduras': 'Estafa en Honduras: Tipos, Denuncia y Defensa',
  'allanamiento-ilegal-violacion-domicilio-honduras': 'Allanamiento en Honduras: Derechos y Qué Hacer',
  'jornada-laboral-horas-extra-descansos-honduras': 'Jornada Laboral en Honduras: Horas Extra y Recargos',
  'contratos-franquicia-aspectos': 'Contrato de Franquicia en Honduras: Cláusulas y Riesgos',
  'custodia-hijos-honduras-juez': 'Custodia de Hijos en Honduras: Criterios del Juez',
  'pension-alimenticia-honduras-guia-completa': 'Pensión Alimenticia en Honduras: Requisitos y Pasos',
  'cuando-prescribe-delito-en-honduras': 'Prescripción Penal en Honduras: Plazos y Cálculo',
  'proteccion-datos-personales-derechos-arco-honduras': 'Derechos ARCO en Honduras: Cómo Ejercerlos',
  'guia-aduanera-importaciones-honduras': 'Cómo Importar a Honduras: Requisitos y Documentos',
};

const sources: Source[] = [
  {
    id: 'HN-CONST-131-1982',
    area: 'derecho-penal',
    institution: 'Asamblea Nacional Constituyente / Tribunal Superior de Cuentas',
    title: 'Constitución de la República de Honduras',
    number: 'Decreto No. 131',
    type: 'Constitución',
    url: 'https://tsc.gob.hn/web/leyes/Constitucion_de_la_republica.pdf',
    sections: 'artículos 68, 71, 82, 84, 89 y 99',
    notes: 'Documento oficial abierto; comprobar reformas posteriores aplicables antes de firma.',
  },
  {
    id: 'HN-CPP-9-99-E',
    area: 'derecho-penal',
    institution: 'Congreso Nacional / Tribunal Superior de Cuentas',
    title: 'Código Procesal Penal',
    number: 'Decreto No. 9-99-E',
    type: 'Código',
    url: 'https://tsc.gob.hn/web/leyes/Codigo_Procesal_Penal_2016.pdf',
    sections: 'artículos 101, 112–115, 282 y 285–294',
    notes: 'Documento oficial abierto; la página índice oficial enumera reformas e interpretaciones.',
  },
  {
    id: 'HN-CP-130-2017',
    area: 'derecho-penal',
    institution: 'Congreso Nacional / Tribunal Superior de Cuentas',
    title: 'Código Penal',
    number: 'Decreto No. 130-2017',
    type: 'Código',
    url: 'https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf',
    sections: 'artículos 104–110, 263–271 y tipos específicos aplicables',
    notes: 'Documento oficial abierto; contrastar las reformas 2019–2026 listadas por TSC.',
  },
  {
    id: 'HN-CT-189-59',
    area: 'derecho-laboral',
    institution: 'Congreso Nacional / Tribunal Superior de Cuentas',
    title: 'Código del Trabajo',
    number: 'Decreto No. 189-59',
    type: 'Código',
    url: 'https://www.tsc.gob.hn/web/leyes/codigo_de_trabajo.pdf',
    sections: 'artículos 112–126, 321–346 y 664–669',
    notes: 'Documento oficial abierto; verificar reforma o interpretación anotada junto a cada artículo.',
  },
  {
    id: 'HN-FAM-76-84',
    area: 'derecho-de-familia',
    institution: 'Congreso Nacional / Tribunal Superior de Cuentas',
    title: 'Código de Familia',
    number: 'Decreto No. 76-84',
    type: 'Código',
    url: 'https://www.tsc.gob.hn/web/leyes/codigo_de_familia.pdf',
    sections: 'artículos 59–75, 109–125, 211–226 y 238–255',
    notes: 'Documento oficial abierto; incluye notas de reformas y exige contraste con Decreto 35-2013.',
  },
  {
    id: 'HN-NNA-35-2013',
    area: 'derecho-de-familia',
    institution: 'Congreso Nacional / La Gaceta',
    title: 'Código de la Niñez y de la Adolescencia',
    number: 'Decreto No. 35-2013',
    type: 'Código / reforma integral',
    url: 'https://www.tsc.gob.hn/web/leyes/Codigo_ni%C3%B1ezyadolescencia_2013.pdf',
    sections: 'principio de interés superior y disposiciones reformadas sobre familia y niñez',
    notes: 'La Gaceta No. 33,222 abierta; concretar artículo según el claim de custodia o protección.',
  },
  {
    id: 'HN-CPC-211-2006',
    area: 'derecho-civil',
    institution: 'Congreso Nacional / Tribunal Superior de Cuentas',
    title: 'Código Procesal Civil',
    number: 'Decreto No. 211-2006',
    type: 'Código',
    url: 'https://tsc.gob.hn/web/leyes/Codigo_Procesal%20Civil_.pdf',
    sections: 'procedimiento declarativo, monitorio, ejecución y medidas cautelares según pretensión',
    notes: 'Documento oficial abierto; seleccionar artículo exacto según vía y cuantía antes de firma.',
  },
  {
    id: 'HN-COM-CODE',
    area: 'derecho-mercantil',
    institution: 'Congreso Nacional',
    title: 'Código de Comercio de Honduras',
    number: 'Decreto No. 73-50',
    type: 'Código',
    url: 'https://www.tsc.gob.hn/biblioteca/index.php/codigos',
    sections: 'sociedades, obligaciones y contratos mercantiles según negocio',
    notes: 'Índice institucional localizado; documento exacto y vigencia requieren revisión humana antes de verificar claims.',
  },
];

const areaSourceIds: Record<string, string[]> = {
  penal: ['HN-CONST-131-1982', 'HN-CPP-9-99-E', 'HN-CP-130-2017'],
  laboral: ['HN-CT-189-59'],
  familia: ['HN-FAM-76-84', 'HN-NNA-35-2013'],
  'civil-notarial': ['HN-CPC-211-2006'],
  mercantil: ['HN-COM-CODE', 'HN-CPC-211-2006'],
};

const directAnswer: Record<string, string> = {
  penal: 'La respuesta depende de la etapa procesal, la resolución vigente y los hechos documentados. Antes de declarar, firmar o dejar vencer una audiencia, conviene identificar la autoridad actuante, conservar la documentación y solicitar defensa técnica.',
  laboral: 'La reclamación depende de la forma de terminación, los pagos pendientes, la documentación y el plazo de la acción. Antes de firmar una renuncia o finiquito conviene revisar contrato, comunicaciones y comprobantes de pago.',
  familia: 'La decisión depende del interés de las personas menores, las necesidades acreditadas, la capacidad económica y la prueba disponible. Las medidas urgentes y el procedimiento deben ajustarse al caso concreto.',
  'civil-notarial': 'La vía adecuada depende del documento, la obligación, la prueba y el plazo aplicable. Antes de firmar, reclamar o disponer de bienes conviene verificar titularidad, cargas, representación y consecuencias del acto.',
  mercantil: 'El riesgo contractual depende del tipo de negocio, las obligaciones, las garantías y la terminación pactada. Conviene revisar representación, pagos, propiedad intelectual, solución de conflictos y efectos del incumplimiento.',
};

const inventory = records('docs/seo/current/blog-editorial-inventory.csv');
const bySlug = new Map(inventory.map((row) => [row.slug, row]));
const selected = Object.entries(batches).flatMap(([batch, slugs]) =>
  slugs.map((slug) => {
    const row = bySlug.get(slug);
    if (!row) throw new Error(`Artículo del lote no encontrado: ${slug}`);
    return { batch, row };
  }),
);
const selectedSlugs = new Set(selected.map(({ row }) => row.slug));

const duplicateCandidates = new Set([
  'pension-alimenticia-honduras-como-solicitarla',
  'pension-alimenticia-calcular-reclamar-honduras',
  'despido-laboral-honduras-derechos',
  'despido-injustificado-honduras-derechos-trabajador',
  'herencias-honduras-fallece-familiar',
]);

function principalAction(row: Row): string {
  if (selectedSlugs.has(row.slug)) return 'READY_FOR_LAWYER_REVIEW';
  if (row.author_proposed === 'HUMAN_ASSIGNMENT_REQUIRED') return 'HUMAN_ASSIGNMENT_REQUIRED';
  if (duplicateCandidates.has(row.slug)) return 'MERGE_CANDIDATE';
  if (Number(row.word_count) < 600) return 'FULL_REWRITE';
  if (Number(row.impressions) >= 20 && Number(row.ctr) < 0.03) return 'METADATA_UPDATE';
  if (Number(row.official_source_count) === 0) return 'CONTENT_UPDATE';
  if (row.published !== 'true') return 'NOINDEX_PENDING_REVIEW';
  return 'KEEP';
}

writeCsv(
  'docs/seo/current/content-action-matrix.csv',
  ['slug', 'url', 'area', 'title', 'primary_query', 'gsc_impressions', 'gsc_clicks', 'action', 'reason', 'author_proposed', 'reviewer_proposed', 'source_status', 'content_status', 'review_status', 'target_batch'],
  inventory.map((row) => {
    const action = principalAction(row);
    const batch = selected.find((item) => item.row.slug === row.slug)?.batch ?? '';
    return [
      row.slug, row.url, row.category, row.title_rendered, row.primary_query,
      row.impressions, row.clicks, action,
      action === 'READY_FOR_LAWYER_REVIEW'
        ? 'Lote prioritario por riesgo, intención, GSC o profundidad'
        : action === 'HUMAN_ASSIGNMENT_REQUIRED'
          ? 'No existe responsable humano confirmado para el área'
          : action === 'MERGE_CANDIDATE'
            ? 'Solapamiento temático que requiere decisión humana'
            : action === 'FULL_REWRITE'
              ? 'Contenido inferior a 600 palabras'
              : action === 'METADATA_UPDATE'
                ? 'Impresiones relevantes y CTR inferior al 3%'
                : action === 'CONTENT_UPDATE'
                  ? 'Sin fuente oficial detectada'
                  : 'Conservar sujeto a revisión',
      row.author_proposed, row.reviewer_proposed,
      Number(row.official_source_count) > 0 ? 'SOURCE_DETECTED_NOT_REVERIFIED' : 'OFFICIAL_SOURCES_REQUIRED',
      Number(row.word_count) < 600 ? 'SUPERFICIAL' : 'BASELINE_PRESENT',
      'lawyer_review_pending', batch,
    ];
  }),
);

const priorityRows = selected
  .map(({ batch, row }) => ({
    batch,
    row,
    score: Number(row.impressions) * 5
      + (Number(row.position) >= 3 && Number(row.position) <= 15 ? 100 : 0)
      + (['derecho-penal', 'derecho-laboral', 'derecho-de-familia'].includes(row.category) ? 80 : 40)
      + (Number(row.word_count) < 600 ? 50 : 0),
  }))
  .sort((a, b) => b.score - a.score);

writeCsv(
  'docs/seo/current/content-priority-queue.csv',
  ['priority', 'url', 'area', 'primary_query', 'secondary_queries', 'clicks', 'impressions', 'ctr', 'position', 'legal_risk', 'content_quality', 'current_status', 'recommended_action', 'author_proposed', 'reviewer_proposed', 'batch'],
  priorityRows.map(({ batch, row }, index) => [
    index + 1, row.url, row.category, row.primary_query, '', row.clicks, row.impressions,
    row.ctr, row.position, 'HIGH', Number(row.word_count) < 600 ? 'SUPERFICIAL' : 'NEEDS_DOCUMENTARY_REVIEW',
    'lawyer_review_pending', 'READY_FOR_LAWYER_REVIEW', row.author_proposed,
    row.reviewer_proposed, batch,
  ]),
);

const sourceById = new Map(sources.map((source) => [source.id, source]));
function verifiedApplication(slug: string, sourceId: string): boolean {
  if (sourceId === 'HN-CONST-131-1982') return /deten|allanamiento/.test(slug);
  if (sourceId === 'HN-CPP-9-99-E') return /deten|medidas|audiencia|denuncia|allanamiento/.test(slug);
  if (sourceId === 'HN-CP-130-2017') return /prescribe|estafas|allanamiento/.test(slug);
  if (sourceId === 'HN-CT-189-59') return true;
  if (sourceId === 'HN-FAM-76-84') return true;
  if (sourceId === 'HN-NNA-35-2013') return /custodia|guarda|violencia/.test(slug);
  return false;
}

function groundedClaim(slug: string, sourceId: string, source: Source): string {
  if (sourceId === 'HN-CONST-131-1982') {
    return 'La Constitución protege la integridad, limita la detención, garantiza defensa y regula la inviolabilidad del domicilio en los artículos indicados.';
  }
  if (sourceId === 'HN-CPP-9-99-E') {
    return 'El Código Procesal Penal enumera derechos del imputado y reglas para la detención, la defensa y las primeras actuaciones en los artículos indicados.';
  }
  if (sourceId === 'HN-CP-130-2017') {
    return 'El Código Penal regula prescripción y delitos contra patrimonio o inviolabilidad domiciliaria; el tipo y la reforma aplicable deben individualizarse.';
  }
  if (sourceId === 'HN-CT-189-59') {
    return 'El Código del Trabajo regula causas de terminación, indemnizaciones, protección por embarazo, jornada y vacaciones en los artículos indicados.';
  }
  if (sourceId === 'HN-FAM-76-84') {
    return 'El Código de Familia regula unión de hecho, alimentos, divorcio y medidas familiares en los artículos indicados.';
  }
  if (sourceId === 'HN-NNA-35-2013') {
    return 'El Decreto 35-2013 reformó el marco de niñez y familia; el artículo concreto debe seleccionarse según custodia o protección solicitada.';
  }
  return `La vía y los requisitos de ${slug} deben concretarse en ${source.title}, ${source.sections}.`;
}

writeCsv(
  'docs/seo/current/legal-source-registry.csv',
  ['source_id', 'practice_area', 'article_slug', 'claim_id', 'claim', 'institution', 'document_title', 'document_number', 'document_type', 'publication_date', 'effective_date', 'exact_url', 'article_or_section', 'accessed_at', 'status', 'verification_notes'],
  selected.flatMap(({ batch, row }) =>
    areaSourceIds[batch].map((sourceId, index) => {
      const source = sourceById.get(sourceId)!;
      const verified = verifiedApplication(row.slug, sourceId);
      return [
        source.id, source.area, row.slug, `${row.slug}-C${index + 1}`,
        groundedClaim(row.slug, sourceId, source),
        source.institution, source.title, source.number, source.type, '', '',
        source.url, source.sections, ACCESSED_AT,
        verified ? 'OFFICIAL_DOCUMENT_VERIFIED' : 'OFFICIAL_DOCUMENT_AMBIGUOUS',
        source.notes,
      ];
    }),
  ),
);

for (const [batch, slugs] of Object.entries(batches)) {
  const lines = [
    `# Paquete de revisión jurídica — ${batch} — lote 01`,
    '',
    '> Estado: `documentary_review` → `lawyer_review_pending`. Autor y revisor son propuestas internas, no una firma pública.',
    '',
  ];
  const patches = slugs.map((slug, index) => {
    const row = bySlug.get(slug)!;
    const assignment = getEditorialResponsibility(row.category, row.title_rendered);
    const newTitle = titles[slug] ?? row.title_rendered.replace(/(?:Guía Completa|2026)/gi, '').replace(/\s{2,}/g, ' ').trim();
    const answer = directAnswer[batch];
    const ids = areaSourceIds[batch];
    const related = slugs.filter((candidate) => candidate !== slug).slice(index % 5, (index % 5) + 2);
    lines.push(
      `## ${index + 1}. ${newTitle}`,
      '',
      `- URL: ${row.url}`,
      `- Consulta objetivo: ${row.primary_query || newTitle.toLocaleLowerCase('es-HN')}`,
      `- GSC: ${row.impressions} impresiones; ${row.clicks} clics; CTR ${row.ctr}; posición ${row.position}.`,
      `- Title anterior: ${row.title_rendered}`,
      `- Title propuesto: ${newTitle}`,
      `- Meta anterior: ${row.meta_description}`,
      `- Meta propuesta: ${answer}`,
      `- Resumen de cambios: respuesta inicial prudente, marco normativo, documentos, procedimiento, excepciones, errores, fuentes y enlaces contextuales.`,
      `- Claims sensibles: plazos, requisitos, autoridad competente, efectos y excepciones; validar contra ${ids.join(', ')}.`,
      `- Fuentes exactas: ${ids.map((id) => `${id} (${sourceById.get(id)!.url}; ${sourceById.get(id)!.sections})`).join('; ')}`,
      `- Autor propuesto: ${assignment.requiresHumanAssignment ? 'HUMAN_ASSIGNMENT_REQUIRED' : assignment.author}`,
      `- Revisor propuesto: ${assignment.defaultReviewer ?? 'HUMAN_ASSIGNMENT_REQUIRED'}`,
      `- Enlaces internos propuestos: ${related.map((relatedSlug) => `${SITE}/blog/${bySlug.get(relatedSlug)!.category}/${relatedSlug}`).join('; ')}`,
      `- Servicio relacionado: ${batch === 'penal' ? '/derecho-penal' : `/servicios-juridicos/${row.category}`}`,
      '- CTA: solicitar una evaluación confidencial del caso y la documentación.',
      '- Estado: lawyer_review_pending; noindex, follow; fuera de sitemap y llms.txt.',
      `- Preguntas: ¿Confirma la selección de artículos y reformas? ¿Existe una excepción práctica no reflejada? ¿Debe matizarse algún plazo o autoridad? ¿Puede publicarse la respuesta inicial propuesta?`,
      '- Decisión solicitada: aprobar cada claim, corregirlo con cita exacta o devolverlo para reescritura.',
      '',
    );
    return {
      slug,
      expected: {
        updatedAt: row.date_modified || null,
        reviewStatus: row.legal_review_status_raw,
        contentHash: row.body_hash,
      },
      proposed: {
        title: newTitle,
        metaDescription: answer,
        directAnswer: answer,
        author: assignment.requiresHumanAssignment ? null : assignment.author,
        reviewerProposed: assignment.defaultReviewer ?? null,
        legalReviewStatus: 'documentary_review',
        sourceIds: ids,
        relatedSlugs: related,
      },
      safeguards: {
        dryRunDefault: true,
        transactionRequired: true,
        driftCheckRequired: true,
        productionWriteAllowed: false,
        doesNotSetLawyerVerified: true,
      },
      rollback: {
        title: row.title_db,
        metaDescription: row.meta_description,
        reviewStatus: row.legal_review_status_raw,
      },
    };
  });
  const packet = `docs/seo/review-packets/${batch}/batch-01.md`;
  mkdirSync(dirname(packet), { recursive: true });
  writeFileSync(packet, `${lines.join('\n')}\n`);
  const patchPath = `docs/seo/patches/phase3/${batch}-batch-01.json`;
  mkdirSync(dirname(patchPath), { recursive: true });
  writeFileSync(patchPath, `${JSON.stringify({ batch, generatedAt: ACCESSED_AT, mode: 'DRY_RUN_ONLY', patches }, null, 2)}\n`);
}

const publicOverrides = Object.fromEntries(
  Object.entries(batches).flatMap(([batch, slugs]) =>
    slugs.map((slug, index) => {
      const row = bySlug.get(slug)!;
      const assignment = getEditorialResponsibility(row.category, row.title_rendered);
      const related = slugs.filter((candidate) => candidate !== slug).slice(index % 5, (index % 5) + 2);
      return [slug, {
        title: titles[slug] ?? row.title_rendered.replace(/(?:Guía Completa|2026)/gi, '').replace(/\s{2,}/g, ' ').trim(),
        metaDescription: directAnswer[batch],
        directAnswer: directAnswer[batch],
        author: assignment.requiresHumanAssignment ? null : assignment.author,
        sourceIds: areaSourceIds[batch],
        sources: areaSourceIds[batch].map((id) => {
          const source = sourceById.get(id)!;
          return { title: source.title, url: source.url, sections: source.sections };
        }),
        related: related.map((relatedSlug) => ({
          title: titles[relatedSlug] ?? bySlug.get(relatedSlug)!.title_rendered,
          href: `/blog/${bySlug.get(relatedSlug)!.category}/${relatedSlug}`,
        })),
      }];
    }),
  ),
);
writeFileSync(
  'data/seo/phase3-editorial-overrides.json',
  `${JSON.stringify({
    generatedAt: ACCESSED_AT,
    status: 'documentary_review',
    lawyerVerified: false,
    overrides: publicOverrides,
  }, null, 2)}\n`,
);

writeCsv(
  'docs/seo/current/lawyer-review-queue.csv',
  ['priority', 'article', 'area', 'author_proposed', 'reviewer_proposed', 'change_type', 'claims_count', 'sources_count', 'gsc_impressions', 'gsc_clicks', 'risk', 'review_packet', 'status'],
  priorityRows.map(({ batch, row }, index) => [
    index + 1, row.url, row.category, row.author_proposed, row.reviewer_proposed,
    'DOCUMENTARY_REVIEW_PREPARED', areaSourceIds[batch].length, areaSourceIds[batch].length,
    row.impressions, row.clicks, 'HIGH', `docs/seo/review-packets/${batch}/batch-01.md`,
    'lawyer_review_pending',
  ]),
);

writeCsv(
  'docs/seo/current/title-metadata-remediation.csv',
  ['url', 'title_before', 'title_after', 'meta_before', 'meta_after', 'query', 'intent', 'impressions', 'ctr', 'justification', 'date', 'implementation_location', 'status'],
  Object.entries(titles).map(([slug, title]) => {
    const row = bySlug.get(slug);
    if (!row) throw new Error(`Remediación sin artículo: ${slug}`);
    const batch = selected.find((item) => item.row.slug === slug)?.batch;
    const meta = batch
      ? directAnswer[batch]
      : slug === 'abogados-en-nacaome'
        ? 'Diez criterios para comparar especialidad, comunicación, honorarios y alcance antes de elegir abogado en Nacaome.'
        : slug.includes('arco')
          ? 'Qué significan los derechos de acceso, rectificación, cancelación y oposición y qué debe verificarse antes de presentar una solicitud en Honduras.'
          : 'Documentos, clasificación, permisos, tributos y etapas que conviene verificar antes de importar mercancías a Honduras.';
    return [
      row.url, row.title_rendered, title, row.meta_description, meta,
      row.primary_query, 'INFORMATIONAL', row.impressions, row.ctr,
      'Title completo alineado con intención; meta prudente y sin promesas absolutas',
      ACCESSED_AT, 'lib/blog.ts + patch dry-run', 'IMPLEMENTED_RENDER_OVERRIDE_AND_PATCH_PREPARED',
    ];
  }),
);

const linkAudit = records('docs/seo/current/internal-link-audit.csv');
writeCsv(
  'docs/seo/current/internal-link-audit.csv',
  ['url', 'service_link', 'author_link', 'cluster_links', 'official_sources', 'cta', 'broken_links', 'generic_anchors', 'action', 'status', 'cluster_resolution', 'resolution_reason'],
  linkAudit.map((row) => {
    const deficient = Number(row.cluster_links) < 2;
    return [
      row.url, row.service_link, row.author_link, row.cluster_links,
      row.official_sources, row.cta, row.broken_links, row.generic_anchors,
      row.action, row.status,
      deficient ? 'NO_SAFE_CLUSTER_TARGET' : 'EXISTING_CONTEXTUAL_LINKS_SUFFICIENT',
      deficient
        ? 'Todos los artículos permanecen lawyer_review_pending; no se añaden enlaces públicos hacia contenidos aún no autorizados.'
        : 'Dos o más enlaces contextuales ya detectados.',
    ];
  }),
);

console.log(`Fase 3: ${inventory.length} clasificados; ${selected.length} artículos en 5 lotes; ${sources.length} documentos marco.`);
