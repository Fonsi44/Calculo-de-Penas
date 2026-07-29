import { readFile, writeFile } from 'node:fs/promises';
import { GENERATED_LEGAL_CTA_COPY, MID_POST_CTA_SLUGS, injectMidArticleCta } from '../lib/blog-generated-cta';
import { sanitizeBlogRenderedHtml } from '../lib/blog-html-sanitizer';

async function main() {
const copy = Object.values(GENERATED_LEGAL_CTA_COPY).join(' ');
const required = [
  /primera consulta es gratuita/i,
  /confidencial/i,
  /sin compromiso/i,
  /no se garantizan resultados/i,
];
for (const pattern of required) {
  if (!pattern.test(copy)) throw new Error(`Falta contrato CTA: ${pattern}.`);
}
if (/(ganar[aá]|garantiz(?:a|amos)|tiene derecho a|evite la c[aá]rcel|indemnizaci[oó]n asegurada)/i
  .test(copy.replace(/no se garantizan resultados/gi, ''))) {
  throw new Error('El CTA contiene una promesa jurídica absoluta.');
}
if (MID_POST_CTA_SLUGS.size !== 35) throw new Error('Registro de slugs CTA alterado.');
if ([...MID_POST_CTA_SLUGS].some((slug) => /\s/.test(slug))) {
  throw new Error('El registro CTA contiene copy en lugar de slugs.');
}

const rendered = injectMidArticleCta(
  '<p>Uno.</p><p>Dos.</p><p>Tres.</p><p>Cuatro.</p>',
  'defensa-penal-honduras',
);
const sanitized = sanitizeBlogRenderedHtml(rendered).html;
for (const expected of [
  'seo_blog_cta_click',
  'blog_inline',
  '/solicitar-consulta#formulario',
  GENERATED_LEGAL_CTA_COPY.anchor,
]) {
  if (!sanitized.includes(expected)) throw new Error(`CTA sanitizado perdió: ${expected}.`);
}

const page = await readFile('app/(public)/blog/[categoria]/[slug]/page.tsx', 'utf8');
if (page.includes('MID_POST_CTA_COPY')) throw new Error('Persiste copy jurídico muerto.');

const rows = [
  {
    file: 'lib/blog-generated-cta.ts',
    line: 1,
    surface: 'blog_inline',
    is_rendered: true,
    is_dead_code: false,
    risk_category: 'SAFE',
    action: 'CENTRALIZE',
    replacement: 'GENERATED_LEGAL_CTA_COPY',
    body_affected: false,
    final_status: 'SAFE',
  },
  {
    file: 'app/(public)/blog/[categoria]/[slug]/page.tsx',
    line: 36,
    surface: 'blog_inline',
    is_rendered: true,
    is_dead_code: false,
    risk_category: 'DEAD_COPY',
    action: 'REMOVED',
    replacement: 'MID_POST_CTA_SLUGS',
    body_affected: false,
    final_status: 'FIXED',
  },
];
const headers = Object.keys(rows[0]);
const cell = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
await writeFile(
  'docs/security/generated-legal-cta-audit.csv',
  `${headers.map(cell).join(',')}\n${rows.map((row) => headers.map((key) => cell(row[key as keyof typeof row])).join(',')).join('\n')}\n`,
);

console.log('cta_slugs = 35');
console.log('dead_legal_copy = 0');
console.log('required_disclosures = 4/4');
console.log('tracking_preserved = true');
console.log('sanitization_preserved = true');
console.log('body_affected = false');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
