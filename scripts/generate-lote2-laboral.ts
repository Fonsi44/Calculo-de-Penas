import fs from 'fs';
import path from 'path';

const invPath = path.join(process.cwd(), 'docs', 'seo', 'current', 'blog-editorial-inventory.csv');
const lines = fs.readFileSync(invPath, 'utf8').trim().split('\n');
const headers = lines[0].split(',');
const records = lines.slice(1).map(line => {
  const values: string[] = [];
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += line[i];
    }
  }
  values.push(current);
  
  const obj: any = {};
  headers.forEach((h, i) => obj[h] = values[i]);
  return obj;
});

const laboralDocs = records.filter((r: any) => r.category === 'derecho-laboral' && parseInt(r.impressions) > 0);
laboralDocs.sort((a: any, b: any) => parseInt(b.impressions) - parseInt(a.impressions));

const lote2 = laboralDocs.slice(0, 10);

const outReview = path.join(process.cwd(), 'docs', 'seo', 'review-packets', 'derecho-laboral');
const outPatch = path.join(process.cwd(), 'data', 'seo', 'content-patches', 'derecho-laboral');

fs.mkdirSync(outReview, { recursive: true });
fs.mkdirSync(outPatch, { recursive: true });

const mdLines = ['# Lote 2: Derecho Laboral (Alta Intención)\n'];
const patches: any[] = [];

for (const doc of lote2) {
  mdLines.push(`## ${doc.title_db}`);
  mdLines.push(`- URL: https://www.pinedayasociadoshn.com/blog/derecho-laboral/${doc.slug}`);
  mdLines.push(`- Consulta objetivo: ${doc.primary_query}`);
  mdLines.push(`- Intención: ${doc.primary_intent}`);
  mdLines.push(`- Title actual: ${doc.title_rendered}`);
  mdLines.push(`- Title propuesto: ${doc.title_rendered}`);
  mdLines.push(`- Meta actual: ${doc.meta_description}`);
  mdLines.push(`- Meta propuesta: ${doc.meta_description}`);
  mdLines.push(`- H1: ${doc.h1}`);
  mdLines.push(`- Abogado responsable previsto: ${doc.author_proposed}`);
  mdLines.push(`- Estado: lawyer_review_pending\n`);

  patches.push({
    slug: doc.slug,
    category: 'derecho-laboral',
    title: doc.title_db,
    metaTitle: doc.title_rendered,
    metaDescription: doc.meta_description,
    author: doc.author_proposed,
    reviewStatus: 'pending' // As 'pending' is the DB valid enum value until verified by lawyer
  });
}

fs.writeFileSync(path.join(outReview, 'lote2.md'), mdLines.join('\n'));
fs.writeFileSync(path.join(outPatch, 'lote2.json'), JSON.stringify(patches, null, 2));

console.log('Generated lote2 laboral');
