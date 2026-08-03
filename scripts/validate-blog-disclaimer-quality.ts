import { readFileSync, readdirSync } from 'node:fs';

const CANONICAL = 'Aviso legal: Este contenido es informativo y no constituye asesoría jurídica personalizada ni crea una relación abogado–cliente. La normativa aplicable y su interpretación pueden variar según los hechos y las reformas vigentes. Para evaluar un caso concreto, consulte directamente con un abogado habilitado en Honduras.';
const forbidden = /Aviso informativo|fines exclusivamente de divulgación|carácter informativo,\s*orientativo|Parte de la información de este contenido|legislación hondureña vigente al \d|pendiente de revisión jurídica individual/i;
const errors: string[] = [];

const disclaimerSource = readFileSync('lib/legal-disclaimer.ts', 'utf8');
if (!disclaimerSource.includes(CANONICAL)) errors.push('La fuente canónica no contiene el texto objetivo exacto.');
const publicPage = readFileSync('app/(public)/blog/[categoria]/[slug]/page.tsx', 'utf8');
if (forbidden.test(publicPage)) errors.push('La página pública conserva un aviso superior o redundante.');
if ((publicPage.match(/<LegalDisclaimer/g) ?? []).length !== 1) errors.push('La página del artículo no renderiza exactamente un LegalDisclaimer.');
if (publicPage.includes('<AiReviewNotice')) errors.push('La página conserva un segundo aviso documental.');

const component = readFileSync('components/marketing/legal-disclaimer.tsx', 'utf8');
if (/\b20\d{2}\b/.test(component)) errors.push('El componente contiene una fecha hardcodeada.');
if (/legalReviewedAt|reviewedBy/.test(component)) errors.push('El componente mezcla revisión documental y jurídica.');
if ((readdirSync('components/marketing').filter((file) => /disclaimer/i.test(file))).length !== 1) errors.push('Existe más de un componente marketing de disclaimer.');

const proposals: Array<{ slug: string; proposed: { body: string; legalReviewStatus: string } }> = [];
for (const area of readdirSync('data/seo/article-editorial-proposals')) {
  for (const file of readdirSync(`data/seo/article-editorial-proposals/${area}`).filter((name) => name.endsWith('.json'))) {
    proposals.push(JSON.parse(readFileSync(`data/seo/article-editorial-proposals/${area}/${file}`, 'utf8')));
  }
}
for (const proposal of proposals) {
  if (forbidden.test(proposal.proposed.body) || proposal.proposed.body.includes(CANONICAL)) errors.push(`${proposal.slug}: body contiene un aviso embebido.`);
  if (proposal.proposed.legalReviewStatus === 'lawyer_verified') errors.push(`${proposal.slug}: revisión jurídica falsa.`);
}
const preview = JSON.parse(readFileSync('data/seo/preview-blog-fixtures.json', 'utf8'));
for (const fixture of preview.fixtures) {
  if (forbidden.test(fixture.body) || fixture.body.includes(CANONICAL)) errors.push(`${fixture.slug}: fixture contiene aviso embebido.`);
  if (
    fixture.reviewed_by
    && !['verified', 'lawyer_verified', 'published_lawyer_signed'].includes(fixture.review_status)
  ) errors.push(`${fixture.slug}: reviewedBy sin firma individual confirmada.`);
}
for (const file of readdirSync('docs/seo/patches/phase3').filter((name) => name.endsWith('.json'))) {
  const batch = JSON.parse(readFileSync(`docs/seo/patches/phase3/${file}`, 'utf8'));
  for (const patch of batch.patches) {
    if (forbidden.test(patch.proposed.body) || patch.proposed.body.includes(CANONICAL)) errors.push(`${patch.slug}: patch reintroduce aviso heredado.`);
  }
}

if (errors.length) {
  console.error(`BLOG DISCLAIMER QUALITY: ${errors.length} incumplimientos`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('BLOG DISCLAIMER QUALITY: 0 superiores; 1 componente canónico; 0 duplicidades; 0 fechas fijas; 0 revisiones falsas.');
}
