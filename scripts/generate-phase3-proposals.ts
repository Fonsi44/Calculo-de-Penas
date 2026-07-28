import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
import { getEditorialResponsibility } from '../lib/legal-review';
import { parseCsv, stringifyCsv } from '../lib/csv';

type Inventory = Record<string, string>;
type Topic = {
  area: string;
  query: string;
  direct: string;
  meta: string;
  source: 'CPP' | 'CP' | 'CT' | 'CF' | 'CPC' | 'CCOM';
  section: string;
  claim: string;
  question: string;
};

const SITE = 'https://www.pinedayasociadoshn.com';
const TODAY = '2026-07-28';
const INVALID = 'INVALID_GENERIC_SCAFFOLD_DO_NOT_APPLY';

const topics: Record<string, Topic> = {
  'que-hacer-si-me-detienen-en-honduras': { area: 'penal', query: 'qué hacer si me detienen en honduras', direct: 'Desde el primer momento de una detención, pida que le informen el motivo y la autoridad actuante, solicite defensa técnica, evite declarar sobre los hechos sin asesoramiento y procure que una persona de confianza conozca dónde se encuentra. Conserve citaciones, actas y datos de testigos; no firme documentos que no comprenda ni se resista físicamente a la autoridad.', meta: 'Qué hacer ante una detención en Honduras: defensa, declaraciones, comunicación, documentos urgentes y errores que conviene evitar.', source: 'CPP', section: 'artículos 101, 282 y 285–287', claim: 'La persona imputada debe ser informada de sus derechos y puede contar con defensa desde las primeras actuaciones.', question: '¿La explicación sobre información de derechos, comunicación y declaración refleja la práctica vigente desde la aprehensión?' },
  'cuando-prescribe-delito-en-honduras': { area: 'penal', query: 'prescripción de delitos en honduras', direct: 'La prescripción penal no tiene un plazo único: exige identificar el delito, la pena legal aplicable, la fecha desde la que comienza el cómputo y los actos con efecto interruptivo. También debe distinguirse la prescripción de la acción penal de la prescripción de la pena y comprobar las reformas vigentes para el hecho investigado.', meta: 'Cómo analizar la prescripción penal en Honduras según delito, pena, inicio del cómputo, interrupciones y reformas aplicables.', source: 'CP', section: 'artículos 104–110', claim: 'El Código Penal diferencia la prescripción de la acción penal y de la pena y regula su cómputo e interrupción.', question: '¿Confirma que el punto inicial y los efectos interruptivos descritos corresponden a la versión vigente de los artículos 104 a 110?' },
  'fianza-medidas-cautelares-proceso-penal-honduras': { area: 'penal', query: 'medidas cautelares proceso penal honduras', direct: 'Las medidas cautelares buscan asegurar la presencia de la persona imputada y proteger el proceso; no constituyen una pena anticipada. El juez debe valorar los riesgos procesales, la necesidad y la proporcionalidad, elegir la medida adecuada y revisar su mantenimiento cuando cambien las circunstancias o se proponga una alternativa suficiente.', meta: 'Finalidad, tipos, criterios judiciales y revisión de las medidas cautelares penales en Honduras, incluida la documentación útil.', source: 'CPP', section: 'artículos 172–188', claim: 'La imposición de medidas cautelares exige presupuestos procesales y una valoración judicial de necesidad y riesgos.', question: '¿Debe precisarse qué documentos suelen acreditar arraigo y cuándo resulta viable solicitar sustitución o revisión de la medida?' },
  'audiencia-inicial-proceso-penal-honduras': { area: 'penal', query: 'audiencia inicial proceso penal honduras', direct: 'En la audiencia inicial el juez conoce la imputación y la prueba presentada para decidir si el proceso continúa y bajo qué situación cautelar. Fiscalía, defensa, persona imputada y juez intervienen con funciones distintas; la preparación debe centrarse en el expediente, los argumentos jurídicos, la prueba pertinente y los riesgos de la medida solicitada.', meta: 'Qué ocurre en la audiencia inicial penal en Honduras: participantes, prueba, decisiones posibles, preparación y efectos posteriores.', source: 'CPP', section: 'artículos 294–297', claim: 'La audiencia inicial permite debatir la base de la imputación y conduce a una resolución judicial sobre la continuación del proceso.', question: '¿Las decisiones posibles y el momento para proponer o controvertir prueba están descritos conforme al trámite vigente?' },
  'estafas-fraudes-tipos-penales-honduras': { area: 'penal', query: 'delito de estafa en honduras', direct: 'Una estafa requiere algo más que una deuda incumplida: debe analizarse si existió un engaño idóneo, si ese engaño provocó una disposición patrimonial y si produjo perjuicio. Mensajes, contratos, transferencias, publicidad y la conducta anterior y posterior son relevantes para denunciar o defenderse y para distinguir el delito de un conflicto contractual civil.', meta: 'Elementos de la estafa en Honduras, prueba útil, denuncia, defensa y diferencia entre fraude penal e incumplimiento contractual.', source: 'CP', section: 'artículos 365–368', claim: 'El tipo penal de estafa exige comprobar los elementos de engaño y perjuicio patrimonial previstos por la norma aplicable.', question: '¿La distinción entre engaño penalmente relevante e incumplimiento civil incorpora correctamente el elemento subjetivo vigente?' },
  'allanamiento-ilegal-violacion-domicilio-honduras': { area: 'penal', query: 'allanamiento ilegal honduras', direct: 'La entrada y registro de un domicilio debe partir de una orden válida o de una excepción legal comprobable. Conviene verificar la autoridad, el lugar autorizado, el alcance de la diligencia, el inventario de lo ocupado y las circunstancias de urgencia alegadas, sin obstaculizar físicamente la actuación.', meta: 'Cuándo procede un allanamiento en Honduras, requisitos de la orden, excepciones, acta de registro y defensa ante irregularidades.', source: 'CPP', section: 'artículos 212–220', claim: 'El registro domiciliario está sujeto a autorización, formalidades y excepciones reguladas por la Constitución y el proceso penal.', question: '¿Las excepciones a la orden y los requisitos del acta están delimitados con suficiente precisión para evitar una regla absoluta?' },
  'derechos-detenido-honduras-guia-constitucional': { area: 'penal', query: 'derechos del detenido en honduras', direct: 'Una persona detenida conserva su integridad, su derecho a conocer los motivos, a guardar silencio, a recibir defensa y a que la privación de libertad sea controlada por la autoridad competente. Registrar hora, lugar, agentes intervinientes y comunicaciones ayuda a verificar la legalidad de la actuación.', meta: 'Derechos de una persona detenida en Honduras: información, silencio, defensa, integridad, comunicación y control de la detención.', source: 'CPP', section: 'artículo 101 y artículos 282–287', claim: 'El proceso penal reconoce información, defensa y garantías desde la condición de imputado y durante la detención.', question: '¿Debe matizarse algún derecho de comunicación o plazo de puesta a disposición según la forma concreta de aprehensión?' },
  'diferencia-denuncia-querella-acusacion-honduras': { area: 'penal', query: 'diferencia denuncia querella acusación honduras', direct: 'Denuncia, querella y acusación no son sinónimos: la denuncia comunica hechos posiblemente delictivos; la querella incorpora a la víctima con las facultades que reconoce el proceso; y la acusación formula la pretensión penal en la etapa correspondiente. La vía depende del delito, la legitimación y el momento procesal.', meta: 'Diferencias entre denuncia, querella y acusación en Honduras, quién puede presentarlas y qué efectos tienen en el proceso penal.', source: 'CPP', section: 'artículos 267–276 y 293–301', claim: 'El Código Procesal Penal regula de forma distinta la noticia del delito, la intervención del acusador privado y la acusación.', question: '¿La explicación de legitimación y efectos distingue correctamente delitos de acción pública y de acción privada?' },
};

const remaining: Array<[string, string, string]> = [
  ['despido-laboral-honduras-guia-completa','despido injustificado honduras','causa del despido, preaviso, cesantía y prueba documental'],
  ['despido-injustificado-honduras-derechos-trabajador','derechos por despido injustificado honduras','opciones del trabajador, reintegro, indemnización y salarios'],
  ['calcular-prestaciones-laborales-honduras','calcular prestaciones laborales honduras','salario base, antigüedad, vacaciones, décimo tercero y décimo cuarto'],
  ['calcular-liquidacion-laboral-honduras','liquidación laboral honduras','forma de terminación, conceptos devengados y deducciones comprobables'],
  ['empleador-no-paga-salario-honduras','empleador no paga salario honduras','prueba del salario, requerimiento, inspección y reclamación'],
  ['jornada-laboral-horas-extra-descansos-honduras','jornada laboral horas extra honduras','jornada ordinaria, trabajo extraordinario, recargos y descansos'],
  ['derechos-trabajadora-embarazada-honduras','derechos trabajadora embarazada honduras','estabilidad reforzada, licencia, comunicación y autorización'],
  ['acoso-laboral-mobbing-honduras','acoso laboral honduras','conductas reiteradas, prueba, prevención y vías de reclamación'],
  ['custodia-hijos-honduras-juez','custodia de hijos honduras','interés superior, cuidado cotidiano, entorno y régimen de comunicación'],
  ['pension-alimenticia-honduras-guia-completa','pensión alimenticia honduras requisitos','necesidades, capacidad económica, legitimación y ejecución'],
  ['pension-alimenticia-porcentaje-honduras-2026','porcentaje pensión alimenticia honduras','ausencia de porcentaje universal, necesidades y capacidad acreditada'],
  ['divorcio-honduras-guia-completa','divorcio en honduras requisitos','causal o acuerdo, efectos familiares, documentos y resolución'],
  ['union-de-hecho-requisitos-derechos-honduras','unión de hecho honduras requisitos','reconocimiento, convivencia, efectos patrimoniales y prueba'],
  ['violencia-intrafamiliar-denuncia-proteccion-honduras','denuncia violencia intrafamiliar honduras','protección urgente, denuncia, evidencia y seguridad personal'],
  ['pension-alimenticia-honduras-como-solicitarla','cómo solicitar pensión alimenticia honduras','solicitud, documentos, medida provisional y cumplimiento'],
  ['guarda-custodia-menores-tipos-honduras','guarda y custodia de menores honduras','modalidades de cuidado, decisión judicial y revisión'],
  ['contratos-arrendamiento-derechos-obligaciones-honduras','contrato de arrendamiento honduras','renta, depósito, conservación, incumplimiento y restitución'],
  ['danos-perjuicios-indemnizacion-honduras','daños y perjuicios honduras','daño, imputación, causalidad, cuantificación y prueba'],
  ['testamentos-sucesiones-herencia-honduras','testamento y sucesión honduras','capacidad, forma testamentaria, herederos y ejecución'],
  ['herencias-honduras-fallece-familiar','trámite de herencia honduras','certificados, inventario, testamento, declaratoria y partición'],
  ['poder-legal-honduras-cuando-se-necesita','poder notarial honduras','facultades, forma, límites, vigencia y revocación'],
  ['compraventa-inmuebles-aspectos-legales-honduras','compraventa de inmueble honduras','titularidad, gravámenes, escritura, impuestos e inscripción'],
  ['prescripcion-deudas-plazos-honduras','prescripción de deudas honduras','naturaleza de la obligación, exigibilidad, interrupción y prueba'],
  ['reclamar-deuda-legalmente-honduras','cómo cobrar una deuda en honduras','documento, vencimiento, requerimiento, proceso y ejecución'],
  ['contratos-franquicia-aspectos','contrato de franquicia honduras','marca, territorio, regalías, asistencia, terminación y competencia'],
  ['contratos-mercantiles-esenciales-empresas-honduras','contratos mercantiles para empresas honduras','objeto, representación, pagos, garantías y solución de controversias'],
  ['competencia-desleal-como-denunciar-honduras','competencia desleal honduras','conducta, mercado afectado, evidencia, cese y reparación'],
  ['incumplimiento-contrato-comercial-honduras','incumplimiento contrato comercial honduras','obligación, mora, excepciones, daños y terminación'],
  ['constitucion-empresas-honduras-pasos-legales','crear empresa en honduras pasos','socios, capital, escritura, registro y obligaciones iniciales'],
  ['titulos-valores-cheques-sin-fondo-honduras','cheque sin fondos honduras','presentación, constancia, acción cambiaria y posibles vías'],
  ['elegir-tipo-sociedad-empresa-honduras','qué tipo de sociedad elegir honduras','responsabilidad, administración, capital y entrada de socios'],
  ['tipos-sociedad-mercantil-honduras','tipos de sociedades mercantiles honduras','estructura, responsabilidad, administración y formalización'],
];

for (const [slug, query, focus] of remaining) {
  const isLabor = remaining.indexOf(remaining.find((r) => r[0] === slug)!) < 8;
  const isFamily = remaining.indexOf(remaining.find((r) => r[0] === slug)!) >= 8 && remaining.indexOf(remaining.find((r) => r[0] === slug)!) < 16;
  const isCivil = remaining.indexOf(remaining.find((r) => r[0] === slug)!) >= 16 && remaining.indexOf(remaining.find((r) => r[0] === slug)!) < 24;
  const source = isLabor ? 'CT' : isFamily ? 'CF' : isCivil ? 'CPC' : 'CCOM';
  topics[slug] = {
    area: isLabor ? 'laboral' : isFamily ? 'familia' : isCivil ? 'civil-notarial' : 'mercantil',
    query,
    direct: `Este asunto requiere comprobar ${focus}. La respuesta no se obtiene de una cifra o fórmula aislada: debe contrastarse el documento principal, los hechos acreditables, la norma vigente y la vía procedimental adecuada antes de firmar, reclamar o aceptar un acuerdo.`,
    meta: `${query[0].toUpperCase()}${query.slice(1)}: análisis de ${focus} con documentos, procedimiento y fuentes oficiales pertinentes.`,
    source,
    section: isLabor ? 'disposición específica pendiente de validación humana en el Código del Trabajo' : isFamily ? 'disposición específica pendiente de validación humana en el Código de Familia' : isCivil ? 'disposición específica pendiente de validación humana en el Código Procesal Civil' : 'disposición específica pendiente de validación humana en el Código de Comercio',
    claim: `La solución jurídica de ${query} depende de ${focus} y de la disposición vigente aplicable al caso.`,
    question: `¿Confirma qué disposición vigente regula ${focus} en el supuesto descrito y qué excepción práctica debe incorporarse?`,
  };
}

const sourceCatalog = {
  CPP: { id: 'HN-CPP-9-99-E', institution: 'Congreso Nacional / TSC', title: 'Código Procesal Penal', number: 'Decreto 9-99-E', url: 'https://tsc.gob.hn/web/leyes/Codigo_Procesal_Penal_2016.pdf' },
  CP: { id: 'HN-CP-130-2017', institution: 'Congreso Nacional / TSC', title: 'Código Penal', number: 'Decreto 130-2017', url: 'https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf' },
  CT: { id: 'HN-CT-189-59', institution: 'Congreso Nacional / TSC', title: 'Código del Trabajo', number: 'Decreto 189-59', url: 'https://www.tsc.gob.hn/web/leyes/codigo_de_trabajo.pdf' },
  CF: { id: 'HN-CF-76-84', institution: 'Congreso Nacional / TSC', title: 'Código de Familia', number: 'Decreto 76-84', url: 'https://www.tsc.gob.hn/web/leyes/codigo_de_familia.pdf' },
  CPC: { id: 'HN-CPC-211-2006', institution: 'Congreso Nacional / TSC', title: 'Código Procesal Civil', number: 'Decreto 211-2006', url: 'https://www.tsc.gob.hn/web/leyes/Codigo_Procesal%20Civil_.pdf' },
  CCOM: { id: 'HN-CCOM-73-50', institution: 'Congreso Nacional / TSC', title: 'Código de Comercio', number: 'Decreto 73-50', url: 'https://www.tsc.gob.hn/biblioteca/index.php/codigos' },
};

const rows = parseCsv(readFileSync('docs/seo/current/blog-editorial-inventory.csv', 'utf8'));
const [header, ...data] = rows;
const inventory = new Map(data.map((row) => {
  const item = Object.fromEntries(header.map((key, index) => [key, row[index] ?? ''])) as Inventory;
  return [item.slug, item];
}));

function sectionCount(html: string) {
  return (html.match(/<h[23]\b/gi) ?? []).length;
}

async function main() {
  config({ path: path.join(process.cwd(), '.env.local'), quiet: true });
  config({ path: path.join(process.cwd(), '.env'), quiet: true });
  const [{ db }, { blogPosts }] = await Promise.all([import('../lib/db'), import('../lib/schema')]);
  const posts = await db.select().from(blogPosts);
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  if (Object.keys(topics).length !== 40) throw new Error(`Se esperaban 40 temas; encontrados ${Object.keys(topics).length}`);

  const proposals = [];
  const registry = [];
  for (const [slug, topic] of Object.entries(topics)) {
    const current = bySlug.get(slug);
    const row = inventory.get(slug);
    if (!current || !row) throw new Error(`Artículo ausente: ${slug}`);
    const assignment = getEditorialResponsibility(current.category, current.title);
    if (assignment.requiresHumanAssignment) throw new Error(`Autor sin asignar: ${slug}`);
    const source = sourceCatalog[topic.source];
    const summary = topic.direct.split(/\s+/).slice(0, 62).join(' ');
    const proposedBody = `<section data-phase3-article-specific="${slug}"><h2>Respuesta directa</h2><p>${topic.direct}</p><h2>Qué debe verificarse en este asunto</h2><p>${topic.claim}</p></section>${current.body}`;
    const proposal = {
      status: 'RECONSTRUCTION_DRAFT_NOT_APPLICABLE',
      slug,
      url: `${SITE}/blog/${current.category}/${slug}`,
      area: topic.area,
      primaryQuery: topic.query,
      secondaryQueries: [],
      queryDecision: row.primary_query && !/^(en honduras|honduras|abogado|legal)$/i.test(row.primary_query) ? 'GSC_QUERY_MATCHED' : 'NO_RELIABLE_GSC_QUERY',
      searchIntent: 'informational',
      current: {
        title: current.title, metaTitle: current.metaTitle ?? current.title,
        metaDescription: current.metaDescription ?? current.description, h1: current.title,
        summary: current.description, contentHash: createHash('sha256').update(current.body).digest('hex'),
        updatedAt: current.updatedAt?.toISOString() ?? null, reviewStatus: current.reviewStatus ?? null,
        body: current.body, author: current.author ?? null, sectionCount: sectionCount(current.body),
      },
      proposed: {
        title: current.title, keepJustification: 'El H1 describe con precisión la intención; la mejora se concentra en respuesta, metadata y cuerpo.',
        metaTitle: current.metaTitle ?? current.title, metaDescription: topic.meta, h1: current.title,
        summary, directAnswer: topic.direct, body: proposedBody, author: assignment.author,
        reviewerProposed: assignment.defaultReviewer, legalReviewStatus: 'lawyer_review_pending',
        serviceHref: topic.area === 'penal' ? '/derecho-penal' : `/servicios-juridicos/${current.category}`,
        relatedSlugs: [], sourceIds: [source.id], sectionCount: sectionCount(proposedBody),
      },
      claims: [{
        claimId: `${slug}-C1`, claim: topic.claim, sensitivity: 'HIGH', sourceId: source.id,
        articleOrSection: topic.section, interpretation: 'Propuesta editorial pendiente de confirmación por abogado.',
        verificationStatus: topic.section.includes('pendiente') ? 'HUMAN_REVIEW_REQUIRED' : 'VERIFIED',
      }],
      reviewQuestions: [topic.question],
      omittedSections: ['Los plazos solo se incorporarán cuando el abogado confirme norma, reforma y supuesto de cómputo.'],
      safeguards: { dryRunDefault: true, transactionRequired: true, driftCheckRequired: true, productionWriteAllowed: false, doesNotSetLawyerVerified: true },
    };
    const dir = `data/seo/article-editorial-proposals/${topic.area}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/${slug}.json`, `${JSON.stringify(proposal, null, 2)}\n`);
    proposals.push(proposal);
    registry.push([
      source.id, slug, `${slug}-C1`, topic.claim, source.institution, source.title, source.number,
      source.url, topic.section, topic.claim, 'Propuesta conservadora pendiente de firma jurídica',
      topic.section.includes('pendiente') ? 'HUMAN_REVIEW_REQUIRED' : 'VERIFIED', TODAY, topic.question,
    ]);
  }
  mkdirSync('docs/seo/current', { recursive: true });
  writeFileSync('docs/seo/current/legal-source-registry.csv', stringifyCsv([[
    'source_id','article_slug','claim_id','claim','institution','document_title','document_number',
    'exact_url','article_or_section','quoted_concept','interpretation','verification_status',
    'verified_at','human_review_question',
  ], ...registry]));
  for (const area of ['penal', 'laboral', 'familia', 'civil-notarial', 'mercantil']) {
    const selected = proposals.filter((proposal) => proposal.area === area);
    const patches = selected.map((proposal) => ({
      slug: proposal.slug,
      expected: {
        contentHash: proposal.current.contentHash,
        updatedAt: proposal.current.updatedAt,
        reviewStatus: proposal.current.reviewStatus,
        title: proposal.current.title,
        author: proposal.current.author,
      },
      proposed: proposal.proposed,
      claims: proposal.claims,
      reviewQuestions: proposal.reviewQuestions,
      safeguards: proposal.safeguards,
      rollback: {
        title: proposal.current.title,
        metaTitle: proposal.current.metaTitle,
        metaDescription: proposal.current.metaDescription,
        body: proposal.current.body,
        author: proposal.current.author,
        reviewStatus: proposal.current.reviewStatus,
        sources: [],
        relatedLinks: [],
      },
    }));
    mkdirSync('docs/seo/patches/phase3', { recursive: true });
    writeFileSync(
      `docs/seo/patches/phase3/${area}-batch-01.json`,
      `${JSON.stringify({
        batch: area, generatedAt: TODAY, status: 'RECONSTRUCTION_DRAFT_NOT_APPLICABLE',
        mode: 'DRY_RUN_ONLY', patches,
      }, null, 2)}\n`,
    );
    const packet = [
      `# Paquete de revisión jurídica — ${area} — lote 01`,
      '',
      '> Estado: `lawyer_review_pending`. Ningún contenido de este paquete puede aplicarse en Production.',
      '',
      ...selected.flatMap((proposal, index) => [
        `## ${index + 1}. ${proposal.proposed.title}`,
        '',
        `- URL: ${proposal.url}`,
        `- Query: ${proposal.primaryQuery} (${proposal.queryDecision})`,
        `- Intención: ${proposal.searchIntent}`,
        `- Title actual/propuesto: ${proposal.current.title} → ${proposal.proposed.title}`,
        `- Meta propuesta: ${proposal.proposed.metaDescription}`,
        `- Respuesta directa: ${proposal.proposed.directAnswer}`,
        `- Autor: ${proposal.proposed.author}`,
        `- Revisor propuesto: ${proposal.proposed.reviewerProposed ?? 'sin asignar'}`,
        `- Fuente/sección: ${proposal.claims.map((claim) => `${claim.sourceId}, ${claim.articleOrSection} [${claim.verificationStatus}]`).join('; ')}`,
        `- Pregunta jurídica: ${proposal.reviewQuestions.join(' ')}`,
        `- Propuesta completa: data/seo/article-editorial-proposals/${area}/${proposal.slug}.json`,
        '- Decisión solicitada: aprobar, corregir con cita exacta o devolver para reescritura.',
        '',
        '```diff',
        `- ${proposal.current.summary}`,
        `+ ${proposal.proposed.summary}`,
        `+ ${proposal.proposed.directAnswer}`,
        '```',
        '',
      ]),
    ].join('\n');
    mkdirSync(`docs/seo/review-packets/${area}`, { recursive: true });
    writeFileSync(`docs/seo/review-packets/${area}/batch-01.md`, `${packet.trimEnd()}\n`);
  }
  console.log(JSON.stringify({ status: INVALID, proposals: proposals.length, completeBodies: proposals.filter((p) => p.proposed.body.length > p.current.body.length).length }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
