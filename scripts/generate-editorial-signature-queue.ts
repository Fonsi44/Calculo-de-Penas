import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csv(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const candidateByArea: Record<string, string> = {
  penal: 'Danilo Pineda Maradiaga',
  'derecho-penal': 'Danilo Pineda Maradiaga',
  laboral: 'Emil Barahona',
  'derecho-laboral': 'Emil Barahona',
  familia: 'Thania Marlene Paz',
  'derecho-de-familia': 'Thania Marlene Paz',
  'civil-notarial': 'Thania Marlene Paz',
  'derecho-civil': 'Thania Marlene Paz',
  'derecho-notarial': 'Thania Marlene Paz',
  mercantil: 'Thania Marlene Paz',
  'derecho-mercantil': 'Thania Marlene Paz',
  administrativo: 'Thania Marlene Paz',
  'derecho-administrativo': 'Thania Marlene Paz',
  'propiedad-intelectual': 'Thania Marlene Paz',
  'hondurenos-en-espana': 'Thania Marlene Paz',
};

async function proposalSlugs(root: string): Promise<Set<string>> {
  const result = new Set<string>();
  for (const area of await readdir(root)) {
    const areaPath = join(root, area);
    for (const file of await readdir(areaPath)) {
      if (file.endsWith('.json')) result.add(file.slice(0, -5));
    }
  }
  return result;
}

async function main() {
const matrix = parseCsv(await readFile('docs/seo/current/content-action-matrix.csv', 'utf8'));
const [headers, ...records] = matrix;
const index = Object.fromEntries(headers.map((header, position) => [header, position]));
const proposals = await proposalSlugs('data/seo/article-editorial-proposals');
const queueHeaders = [
  'priority',
  'article',
  'area',
  'current_signature',
  'current_review_origin',
  'proposed_signature_type',
  'proposed_signer',
  'content_changed',
  'new_claims',
  'legal_risk',
  'review_packet',
  'signature_status',
];

const rows = records.map((record) => {
  const slug = record[index.slug];
  const area = record[index.area];
  const proposed = proposals.has(slug);
  const signer = candidateByArea[area] ?? '';
  const batch = record[index.target_batch];
  return [
    proposed ? 'P1' : signer ? 'P2' : 'P3',
    slug,
    area,
    'Pineda y Asociados',
    'firm_historical_review',
    signer ? 'lawyer' : 'firm',
    signer,
    proposed ? 'true' : 'false',
    proposed ? 'REVIEW_CHANGED_PARAGRAPHS' : '0',
    proposed ? 'REVIEW_REQUIRED' : 'HISTORICAL_REVIEW_CONFIRMED',
    batch ? `docs/seo/review-packets/${batch}/batch-01.md` : '',
    proposed
      ? 'PENDING_RESIGNATURE'
      : signer
        ? 'READY_FOR_INDIVIDUAL_SIGNATURE'
        : 'FIRM_SIGNATURE_VALID',
  ];
});

const output = [
  queueHeaders.map(csv).join(','),
  ...rows.map((row) => row.map(csv).join(',')),
  '',
].join('\n');
await writeFile('docs/seo/current/editorial-signature-queue.csv', output, 'utf8');
console.log(JSON.stringify({
  articles: rows.length,
  institutional: rows.length,
  individualCandidates: rows.filter((row) => row[6]).length,
  pendingResignature: rows.filter((row) => row[11] === 'PENDING_RESIGNATURE').length,
}, null, 2));
}

void main();
