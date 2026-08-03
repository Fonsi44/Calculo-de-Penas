import { readFileSync, readdirSync } from 'node:fs';

type Proposal = {
  status: string;
  slug: string;
  primaryQuery: string;
  current: { body: string; title: string; author: string | null; sectionCount: number };
  proposed: {
    body: string;
    title: string;
    keepJustification?: string;
    metaDescription: string;
    directAnswer: string;
    author: string | null;
    legalReviewStatus: string;
    sectionCount: number;
  };
  claims: Array<{ sensitivity: string; sourceId: string; articleOrSection: string }>;
  reviewQuestions: string[];
  safeguards: { productionWriteAllowed: boolean; doesNotSetLawyerVerified: boolean };
};

const genericQueries = new Set(['en honduras', 'honduras', 'abogado', 'legal']);
const roots = readdirSync('data/seo/article-editorial-proposals', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) =>
    readdirSync(`data/seo/article-editorial-proposals/${entry.name}`)
      .filter((file) => file.endsWith('.json'))
      .map((file) => `data/seo/article-editorial-proposals/${entry.name}/${file}`),
  );
const proposals = roots.map((file) => JSON.parse(readFileSync(file, 'utf8')) as Proposal);
const errors: string[] = [];
const expectedAreas = ['penal', 'laboral', 'familia', 'civil-notarial', 'mercantil'];

function normalizedWords(value: string) {
  return new Set(value.toLocaleLowerCase('es-HN')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3));
}

function jaccard(a: string, b: string) {
  const left = normalizedWords(a);
  const right = normalizedWords(b);
  const intersection = [...left].filter((word) => right.has(word)).length;
  return intersection / new Set([...left, ...right]).size;
}

if (proposals.length !== 40) errors.push(`Se esperaban 40 propuestas y existen ${proposals.length}.`);
for (const area of expectedAreas) {
  const count = roots.filter((file) => file.includes(`/${area}/`)).length;
  if (count !== 8) errors.push(`${area}: se esperaban 8 propuestas y existen ${count}.`);
}
for (const proposal of proposals) {
  const { slug, current, proposed } = proposal;
  if (!proposed.metaDescription.trim()) errors.push(`${slug}: falta meta.`);
  if (!proposed.directAnswer.trim()) errors.push(`${slug}: falta directAnswer.`);
  if (proposed.metaDescription === proposed.directAnswer) errors.push(`${slug}: meta y directAnswer son idénticas.`);
  if (!proposed.body.trim()) errors.push(`${slug}: falta body completo.`);
  if (proposed.body === current.body) errors.push(`${slug}: body idéntico al actual.`);
  if (proposed.sectionCount < current.sectionCount) errors.push(`${slug}: pierde estructura respecto al cuerpo actual.`);
  if (!proposed.author || proposed.author === 'Pineda y Asociados') errors.push(`${slug}: autor humano inválido.`);
  if (proposed.title === current.title && !proposed.keepJustification) errors.push(`${slug}: title conservado sin justificación.`);
  if (genericQueries.has(proposal.primaryQuery.trim().toLocaleLowerCase('es-HN'))) errors.push(`${slug}: query principal genérica.`);
  if (!proposal.claims.length) errors.push(`${slug}: no contiene claims.`);
  const claimSources = new Set(proposal.claims.map((claim) => claim.sourceId));
  for (const claim of proposal.claims) {
    if (claim.sensitivity !== 'LOW' && (!claim.sourceId || !claim.articleOrSection)) {
      errors.push(`${slug}: claim sensible sin mapeo de fuente y sección.`);
    }
  }
  if ([...claimSources].some((sourceId) => !sourceId)) errors.push(`${slug}: fuente global sin claim.`);
  if (!proposal.reviewQuestions.length) errors.push(`${slug}: faltan preguntas de revisión.`);
  if (proposed.legalReviewStatus === 'lawyer_verified') errors.push(`${slug}: atribuye revisión jurídica inexistente.`);
  if (proposal.safeguards.productionWriteAllowed) errors.push(`${slug}: permite Production.`);
  if (!proposal.safeguards.doesNotSetLawyerVerified) errors.push(`${slug}: puede establecer lawyer_verified.`);
}

for (let index = 0; index < proposals.length; index += 1) {
  for (let candidate = index + 1; candidate < proposals.length; candidate += 1) {
    const left = proposals[index];
    const right = proposals[candidate];
    if (left.proposed.metaDescription === right.proposed.metaDescription) {
      errors.push(`Meta duplicada: ${left.slug} / ${right.slug}.`);
    }
    if (left.proposed.directAnswer === right.proposed.directAnswer) {
      errors.push(`DirectAnswer duplicada: ${left.slug} / ${right.slug}.`);
    }
    if (left.reviewQuestions.join('\n') === right.reviewQuestions.join('\n')) {
      errors.push(`Preguntas duplicadas: ${left.slug} / ${right.slug}.`);
    }
    if (jaccard(left.proposed.directAnswer, right.proposed.directAnswer) > 0.72) {
      errors.push(`Posible plantilla semántica (${jaccard(left.proposed.directAnswer, right.proposed.directAnswer).toFixed(2)}): ${left.slug} / ${right.slug}.`);
    }
  }
}

for (const file of readdirSync('docs/seo/patches/phase3').filter((name) => name.endsWith('.json'))) {
  const batch = JSON.parse(readFileSync(`docs/seo/patches/phase3/${file}`, 'utf8'));
  for (const patch of batch.patches ?? []) {
    if (!patch.proposed?.body && !patch.proposed?.bodyRef) errors.push(`${file}/${patch.slug}: patch sin body.`);
    if (!patch.rollback?.body) errors.push(`${file}/${patch.slug}: rollback sin body.`);
    if (patch.safeguards?.productionWriteAllowed !== false) errors.push(`${file}/${patch.slug}: patch permite Production.`);
  }
}

for (const area of expectedAreas) {
  const packet = readFileSync(`docs/seo/review-packets/${area}/batch-01.md`, 'utf8');
  if (!packet.includes('```diff')) errors.push(`${area}: paquete sin diff legible.`);
}

if (errors.length) {
  console.error(`FASE 3 QUALITY: ${errors.length} incumplimientos`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('FASE 3 QUALITY: 40 propuestas específicas y completas verificadas.');
}
