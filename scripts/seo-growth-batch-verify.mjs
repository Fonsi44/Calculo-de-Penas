/**
 * Verificación pública read-only de las URLs de un lote (200/canonical/robots/
 * h1). Uso: node scripts/seo-growth-batch-verify.mjs --batch 3
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GROWTH = resolve(process.cwd(), 'docs/seo/growth');
function parseBatch(argv) {
  const eq = argv.find((a) => a.startsWith('--batch='));
  if (eq) return Number(eq.split('=')[1]);
  const i = argv.indexOf('--batch');
  if (i >= 0 && argv[i + 1]) return Number(argv[i + 1]);
  return 2;
}
const batch = parseBatch(process.argv) || 2;

function splitLine(l) {
  const out = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (inQuotes) {
      if (c === '"') { if (l[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { out.push(field); field = ''; }
    else field += c;
  }
  out.push(field);
  return out;
}
function readCsv(path) {
  let content = readFileSync(path, 'utf8');
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const lines = content.split('\n').filter((l) => l.trim());
  const header = splitLine(lines[0]);
  return lines.slice(1).map((l) => {
    const f = splitLine(l);
    const o = {};
    header.forEach((h, i) => { o[h] = (f[i] ?? '').replace(/\r$/, ''); });
    return o;
  });
}

const approved = JSON.parse(readFileSync(resolve(GROWTH, `batch-${batch}-approved-patch.json`), 'utf8')).patch;
const rows = approved.map((e) => e.url);
const TIMEOUT = 25000;
async function check(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return `HTTP ${res.status}`;
    const html = await res.text();
    const can = html.match(/<link rel="canonical" href="([^"]+)"/);
    const rob = html.match(/<meta name="robots" content="([^"]+)"/);
    const title = html.match(/<title>([^<]*)<\/title>/);
    const hasH1 = /<h1[^>]*>/.test(html);
    return `HTTP 200 | canonical=${can ? can[1].split('?')[0] : 'MISSING'} | robots=${rob ? rob[1] : 'default'} | h1=${hasH1 ? 'ok' : 'MISSING'} | title="${(title ? title[1] : '').slice(0, 50)}"`;
  } catch (e) {
    return `ERR ${e.message}`;
  }
}
let ok = 0;
for (const u of rows) {
  const r = await check(u);
  if (r.startsWith('HTTP 200')) ok++;
  console.log(`- ${u.split('/').pop()}\n    ${r}`);
}
console.log(`[verify-batch] ${ok}/${rows.length} HTTP 200`);
process.exit(ok === rows.length ? 0 : 1);
