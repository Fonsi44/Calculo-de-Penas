import fs from 'fs';
import path from 'path';

interface GscData {
  siteUrl: string;
  timestamp: string;
  period: { startDate?: string; endDate?: string };
  queryPages: {
    query: string;
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
}

const dataPath = path.join(process.cwd(), 'data', 'google', 'gsc-live.json');
const raw = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(raw) as GscData;

const outDir = path.join(process.cwd(), 'docs', 'seo', 'current');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const metadata = [
  `# property=${data.siteUrl}`,
  `# extracted_at=${data.timestamp}`,
  `# range=${data.period?.startDate ?? ''}..${data.period?.endDate ?? ''}`,
  '# timezone=America/Tegucigalpa',
  '# dimensions=query,page',
  `# rows=${data.queryPages.length}`,
];

function escapeCsv(val: string | number) {
  if (typeof val === 'number') return val.toString();
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

const oppRows = data.queryPages.filter(qp => qp.position >= 3 && qp.position <= 15 && qp.impressions >= 10);
oppRows.sort((a, b) => b.impressions - a.impressions);
const oppHeaders = ['query', 'page', 'clicks', 'impressions', 'ctr', 'position'];
const oppLines = [...metadata, oppHeaders.join(',')];
for (const r of oppRows) {
  oppLines.push([r.query, r.page, r.clicks, r.impressions, r.ctr.toFixed(4), r.position.toFixed(2)].map(escapeCsv).join(','));
}
fs.writeFileSync(path.join(outDir, 'gsc-opportunity-report.csv'), oppLines.join('\n'));

const queriesMap = new Map<string, typeof data.queryPages>();
for (const qp of data.queryPages) {
  if (!queriesMap.has(qp.query)) {
    queriesMap.set(qp.query, []);
  }
  queriesMap.get(qp.query)!.push(qp);
}

const canHeaders = ['query', 'page', 'clicks', 'impressions', 'ctr', 'position'];
const canLines = [...metadata, canHeaders.join(',')];
for (const [q, pages] of queriesMap.entries()) {
  const significantPages = pages.filter(p => p.impressions >= 5);
  if (significantPages.length > 1) {
    for (const p of significantPages) {
      canLines.push([p.query, p.page, p.clicks, p.impressions, p.ctr.toFixed(4), p.position.toFixed(2)].map(escapeCsv).join(','));
    }
  }
}
fs.writeFileSync(path.join(outDir, 'gsc-cannibalization-report.csv'), canLines.join('\n'));

const lowCtrRows = data.queryPages.filter(qp => qp.impressions >= 20 && qp.ctr < 0.03);
lowCtrRows.sort((a, b) => a.ctr - b.ctr);
const lowCtrLines = [...metadata, oppHeaders.join(',')];
for (const r of lowCtrRows) {
  lowCtrLines.push([r.query, r.page, r.clicks, r.impressions, r.ctr.toFixed(4), r.position.toFixed(2)].map(escapeCsv).join(','));
}
fs.writeFileSync(path.join(outDir, 'gsc-low-ctr-report.csv'), lowCtrLines.join('\n'));

const mapLines = [...metadata, oppHeaders.join(',')];
for (const row of data.queryPages) {
  mapLines.push([
    row.query, row.page, row.clicks, row.impressions,
    row.ctr.toFixed(4), row.position.toFixed(2),
  ].map(escapeCsv).join(','));
}
fs.writeFileSync(path.join(outDir, 'gsc-query-page-map.csv'), mapLines.join('\n'));

console.log('Generated GSC reports');
