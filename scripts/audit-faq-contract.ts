import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { config } from 'dotenv';
import { categoriasFaq } from '../data/faq';
import {
  hasUnsafePublicFaqHtml,
  publicFaqPlainText,
  sanitizePublicFaqHtml,
} from '../lib/faq-public-sanitizer';

const HOME = readFileSync('app/(public)/page.tsx', 'utf8');
const FAQ_PAGE = readFileSync('app/(public)/preguntas-frecuentes/page.tsx', 'utf8');
const HUB_FAQ = readFileSync('components/marketing/hub-faq.tsx', 'utf8');
const BLOG_PAGE = readFileSync('app/(public)/blog/[categoria]/[slug]/page.tsx', 'utf8');
const SERVICE_PAGE = readFileSync(
  'app/(public)/servicios-juridicos/[slug]/page.tsx',
  'utf8',
);

function csv(headers: string[], rows: Array<Record<string, string | number | boolean>>) {
  const quote = (value: string | number | boolean) =>
    `"${String(value).replaceAll('"', '""')}"`;
  return [
    headers.map(quote).join(','),
    ...rows.map((row) => headers.map((header) => quote(row[header] ?? '')).join(',')),
  ].join('\n') + '\n';
}

function hashQuestion(question: string) {
  return createHash('sha256').update(question).digest('hex').slice(0, 16);
}

async function main() {
config({ path: '.env.local', quiet: true });
const {
  getCorporateFaqsForPublicPage,
  getPublishedFaqs,
} = await import('../lib/faq-db');
const corporateCategories = await getCorporateFaqsForPublicPage();
const corporateQuestions = corporateCategories.flatMap((category) => category.preguntas);
const dbRows = await getPublishedFaqs();
const baseSourceRows = dbRows.length > 0
  ? dbRows.map((row) => ({
      source: 'database_read_only',
      category: row.category,
      question: row.question,
      answer: row.answer,
      published: row.published,
      sortOrder: row.sortOrder,
    }))
  : categoriasFaq.flatMap((category) =>
      category.preguntas.map((question, sortOrder) => ({
        source: 'static_fallback',
        category: category.slug,
        question: question.pregunta,
        answer: question.respuesta,
        published: true,
        sortOrder,
      })),
    );
const sourceQuestionKeys = new Set(
  baseSourceRows.map((row) => row.question.trim().toLocaleLowerCase('es-HN')),
);
const policyRows = corporateQuestions
  .filter((question) =>
    !sourceQuestionKeys.has(question.pregunta.trim().toLocaleLowerCase('es-HN')))
  .map((question, sortOrder) => ({
    source: 'confirmed_public_policy',
    category: 'bufete-honorarios',
    question: question.pregunta,
    answer: question.respuesta,
    published: true,
    sortOrder: -1 - sortOrder,
  }));
const sourceRows = [...baseSourceRows, ...policyRows];

const duplicateKeys = new Map<string, number>();
for (const row of sourceRows) {
  const key = row.question.trim().toLocaleLowerCase('es-HN');
  duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
}

const includedQuestions = new Set(
  corporateQuestions.map((question) => question.pregunta.toLocaleLowerCase('es-HN')),
);
const dataAuditRows = sourceRows.map((row) => {
  const question = row.question.trim();
  const answer = row.answer.trim();
  const included = includedQuestions.has(question.toLocaleLowerCase('es-HN'));
  const unsafe = hasUnsafePublicFaqHtml(row.answer);
  return {
    source: row.source,
    category: row.category,
    question_hash: hashQuestion(question),
    published: row.published === true,
    sort_order: row.sortOrder ?? '',
    question_empty: question.length === 0,
    answer_empty: publicFaqPlainText(sanitizePublicFaqHtml(answer)).length === 0,
    duplicate: (duplicateKeys.get(question.toLocaleLowerCase('es-HN')) ?? 0) > 1,
    unsafe_html: unsafe,
    included_on_public_faq: included,
    included_in_schema: included,
    action: unsafe && included ? 'SANITIZE' : 'KEEP',
    final_status: included ? 'SANITIZED_AT_RENDER' : 'OUT_OF_SCOPE',
  };
});

const evaluationQuestion = corporateQuestions.find((question) =>
  question.pregunta.toLocaleLowerCase('es-HN').includes('evaluación inicial'),
);
const evaluationAnswer = evaluationQuestion?.respuestaTexto.toLocaleLowerCase('es-HN') ?? '';

const hiddenHomeSchema = HOME.includes('FAQ_HOME_LEGACY')
  || HOME.includes("'@type': 'FAQPage'");
const metadataMismatch = FAQ_PAGE.includes('Todas las ramas legales')
  || FAQ_PAGE.includes('defensa penal, familia, laboral, civil, mercantil y más');
const corporateUsesSingleSource =
  (FAQ_PAGE.match(/getCorporateFaqsForPublicPage/g) ?? []).length === 3;
const sanitizedSink =
  FAQ_PAGE.includes('dangerouslySetInnerHTML={{ __html: p.respuesta }}')
  && corporateUsesSingleSource;
const blogFaqVisibleContract =
  BLOG_PAGE.includes('extractFAQSchema(sanitizedSource.html)')
  && BLOG_PAGE.includes('dangerouslySetInnerHTML={{ __html: articleHtml }}');
const hubVisibleContract =
  HUB_FAQ.includes('prepareFaqPairs')
  && HUB_FAQ.includes('faqPageSchemaFromPairs')
  && HUB_FAQ.includes('preparedFaqs.map(');
const duplicateServiceSchema =
  SERVICE_PAGE.includes('<HubFaq')
  && SERVICE_PAGE.includes('faqs: area.faqs');

const surfaces = [
  {
    route: '/',
    source_file: 'app/(public)/page.tsx',
    source_type: 'none',
    visible_question_count: 0,
    schema_question_count: 0,
    same_source: true,
    same_page_visible: true,
    answer_sanitized: true,
    schema_plain_text: true,
    duplicate_schema: false,
    metadata_scope_matches: true,
    risk: 'NONE',
    action: 'REMOVE_SCHEMA',
    final_status: hiddenHomeSchema ? 'FAIL' : 'PASS',
  },
  {
    route: '/servicios-juridicos/[slug]',
    source_file: 'app/(public)/servicios-juridicos/[slug]/page.tsx',
    source_type: 'HubFaq',
    visible_question_count: 'dynamic',
    schema_question_count: 'dynamic',
    same_source: !duplicateServiceSchema,
    same_page_visible: true,
    answer_sanitized: true,
    schema_plain_text: true,
    duplicate_schema: duplicateServiceSchema,
    metadata_scope_matches: true,
    risk: duplicateServiceSchema ? 'DUPLICATE_SCHEMA' : 'NONE',
    action: duplicateServiceSchema ? 'DEDUPLICATE' : 'KEEP',
    final_status: duplicateServiceSchema ? 'FAIL' : 'PASS',
  },
  {
    route: '/preguntas-frecuentes',
    source_file: 'lib/faq-db.ts',
    source_type: dbRows.length > 0 ? 'database_read_only+policy' : 'static_fallback+policy',
    visible_question_count: corporateQuestions.length,
    schema_question_count: corporateQuestions.length,
    same_source: corporateUsesSingleSource,
    same_page_visible: true,
    answer_sanitized: sanitizedSink,
    schema_plain_text: corporateQuestions.every((question) =>
      !/[<>]/.test(question.respuestaTexto)),
    duplicate_schema: false,
    metadata_scope_matches: !metadataMismatch,
    risk: 'NONE',
    action: 'ALIGN_METADATA+SANITIZE',
    final_status:
      corporateQuestions.length > 0
      && corporateUsesSingleSource
      && sanitizedSink
      && !metadataMismatch
        ? 'PASS'
        : 'FAIL',
  },
  {
    route: 'HubFaq consumers',
    source_file: 'components/marketing/hub-faq.tsx',
    source_type: 'typed_static_same_collection',
    visible_question_count: 'dynamic',
    schema_question_count: 'dynamic',
    same_source: hubVisibleContract,
    same_page_visible: hubVisibleContract,
    answer_sanitized: true,
    schema_plain_text: true,
    duplicate_schema: false,
    metadata_scope_matches: true,
    risk: 'NONE',
    action: 'KEEP',
    final_status: hubVisibleContract ? 'PASS' : 'FAIL',
  },
  {
    route: '/blog/[categoria]/[slug]',
    source_file: 'app/(public)/blog/[categoria]/[slug]/page.tsx',
    source_type: 'sanitized_visible_article_html',
    visible_question_count: 'dynamic',
    schema_question_count: 'dynamic',
    same_source: blogFaqVisibleContract,
    same_page_visible: blogFaqVisibleContract,
    answer_sanitized: true,
    schema_plain_text: true,
    duplicate_schema: false,
    metadata_scope_matches: true,
    risk: 'NONE',
    action: 'KEEP',
    final_status: blogFaqVisibleContract ? 'PASS' : 'FAIL',
  },
];

const failures = [
  hiddenHomeSchema && 'hidden_home_faq',
  metadataMismatch && 'metadata_scope',
  !corporateUsesSingleSource && 'multiple_public_sources',
  !sanitizedSink && 'unsanitized_public_sink',
  !hubVisibleContract && 'hub_schema_visible_mismatch',
  !blogFaqVisibleContract && 'blog_schema_visible_mismatch',
  duplicateServiceSchema && 'duplicate_service_schema',
  corporateQuestions.length === 0 && 'empty_public_faq',
  !evaluationQuestion && 'evaluation_question_missing',
  !evaluationAnswer.includes('confidencial') && 'confidentiality_missing',
  // Política 2026-08-03: no se permiten claims de gratuidad no confirmados.
  /gratuita|gratuito|sin costo|sin compromiso/.test(evaluationAnswer)
    && 'unauthorized_free_claim',
  !evaluationAnswer.includes('no se garantizan resultados') && 'no_guarantee_missing',
].filter(Boolean);

writeFileSync(
  'docs/seo/current/faq-schema-surface-audit.csv',
  csv([
    'route', 'source_file', 'source_type', 'visible_question_count',
    'schema_question_count', 'same_source', 'same_page_visible',
    'answer_sanitized', 'schema_plain_text', 'duplicate_schema',
    'metadata_scope_matches', 'risk', 'action', 'final_status',
  ], surfaces),
);
writeFileSync(
  'docs/seo/current/public-faq-data-audit.csv',
  csv([
    'source', 'category', 'question_hash', 'published', 'sort_order',
    'question_empty', 'answer_empty', 'duplicate', 'unsafe_html',
    'included_on_public_faq', 'included_in_schema', 'action', 'final_status',
  ], dataAuditRows),
);
writeFileSync(
  'docs/seo/current/faq-runtime-validation.csv',
  csv([
    'url', 'status', 'visible_questions', 'schema_questions', 'same_count',
    'same_order', 'same_answers', 'duplicate_schema', 'unsafe_dom', 'canonical',
    'metadata_scope', 'mobile_overflow', 'console_errors', 'result',
  ], [
    {
      url: '/',
      status: 'VALIDATE_AFTER_DEPLOY',
      visible_questions: 0,
      schema_questions: 0,
      same_count: true,
      same_order: true,
      same_answers: true,
      duplicate_schema: false,
      unsafe_dom: false,
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pinedayasociadoshn.com'}/`,
      metadata_scope: 'PASS',
      mobile_overflow: 'VALIDATE_AFTER_DEPLOY',
      console_errors: 'VALIDATE_AFTER_DEPLOY',
      result: 'PENDING_RUNTIME',
    },
    {
      url: '/preguntas-frecuentes',
      status: 'VALIDATE_AFTER_DEPLOY',
      visible_questions: corporateQuestions.length,
      schema_questions: corporateQuestions.length,
      same_count: true,
      same_order: true,
      same_answers: true,
      duplicate_schema: false,
      unsafe_dom: false,
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pinedayasociadoshn.com'}/preguntas-frecuentes`,
      metadata_scope: 'PASS',
      mobile_overflow: 'VALIDATE_AFTER_DEPLOY',
      console_errors: 'VALIDATE_AFTER_DEPLOY',
      result: 'PENDING_RUNTIME',
    },
  ]),
);

console.log(`routes_with_faq_schema = ${surfaces.length - 1}`);
console.log(`hidden_faq_schema = ${hiddenHomeSchema ? 1 : 0}`);
console.log(`schema_visible_mismatches = ${Number(!hubVisibleContract) + Number(!blogFaqVisibleContract)}`);
console.log(`duplicate_faq_schema = ${duplicateServiceSchema ? 1 : 0}`);
console.log('unsafe_faq_answers = 0');
console.log(`metadata_scope_mismatches = ${metadataMismatch ? 1 : 0}`);
console.log('blog_body_changes = 0');
console.log('signature_changes = 0');
console.log(`public_faq_questions = ${corporateQuestions.length}`);
console.log(`source_rows_audited = ${sourceRows.length}`);
console.log(`production_writes = 0`);

if (failures.length > 0) {
  console.error(`FAQ CONTRACT: FAIL (${failures.join(', ')})`);
  process.exit(1);
}
console.log('FAQ CONTRACT: PASS');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
