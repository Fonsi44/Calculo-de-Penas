#!/usr/bin/env node
/**
 * SEO Live Collector — Recolecta datos de todas las fuentes disponibles
 *
 * Ejecuta:
 *   - Google Search Console (seo:gsc:live)
 *   - Google Analytics 4 (seo:ga4:live)
 *   - Bing WMT (seo:bing:live)
 *   - IndexNow (dry-run)
 *   - SEO Health local
 *
 * Si una credencial falta, marca como pendiente sin fallar todo.
 *
 * Genera:
 *   - data/seo/live-summary.json
 *   - docs/audits/seo-live-summary.md
 *
 * Uso:
 *   npm run seo:collect
 *   npm run seo:collect -- --gsc-only    # solo GSC
 *   npm run seo:collect -- --ga4-only    # solo GA4
 *   npm run seo:collect -- --bing-only   # solo Bing
 *   npm run seo:collect -- --local-only  # solo auditorías locales
 */

import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env') });
config({ path: resolve(ROOT, '.env.local'), override: true });

const SEO_DATA_DIR = resolve(ROOT, 'data', 'seo');
const AUDITS_DIR = resolve(ROOT, 'docs', 'audits');
const SUMMARY_JSON = resolve(SEO_DATA_DIR, 'live-summary.json');
const SUMMARY_MD = resolve(AUDITS_DIR, 'seo-live-summary.md');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function run(cmd) {
  try {
    const out = execSync(cmd, {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: ROOT,
      timeout: 120_000,
      windowsHide: true,
    }).trim();
    return { ok: true, output: out };
  } catch (e) {
    return { ok: false, error: e.message?.substring(0, 200) || String(e) };
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

async function main() {
  const args = process.argv.slice(2);
  const gscOnly = args.includes('--gsc-only');
  const ga4Only = args.includes('--ga4-only');
  const bingOnly = args.includes('--bing-only');
  const localOnly = args.includes('--local-only');
  const allSources = !gscOnly && !ga4Only && !bingOnly && !localOnly;

  console.log('SEO Live Collector\n');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const collection = {
    timestamp: new Date().toISOString(),
    sources: {},
  };

  // GSC
  if (allSources || gscOnly) {
    section('Google Search Console');
    const gsc = run('node scripts/google-search-console-live.mjs --json-only');
    collection.sources.gsc = {
      status: gsc.ok ? 'ran' : 'error',
      error: gsc.ok ? undefined : gsc.error,
    };
    console.log(gsc.ok ? '  ✅ Extraído' : `  ❌ ${gsc.error?.substring(0, 100)}`);
  }

  // GA4
  if (allSources || ga4Only) {
    section('Google Analytics 4');
    const ga4 = run('node scripts/google-analytics-live.mjs --json-only');
    collection.sources.ga4 = {
      status: ga4.ok ? 'ran' : 'error',
      error: ga4.ok ? undefined : ga4.error,
    };
    console.log(ga4.ok ? '  ✅ Extraído' : `  ❌ ${ga4.error?.substring(0, 100)}`);
  }

  // Bing
  if (allSources || bingOnly) {
    section('Bing Webmaster Tools');
    const bing = run('node scripts/bing-webmaster-live.mjs --json-only');
    collection.sources.bing = {
      status: bing.ok ? 'ran' : 'error',
      error: bing.ok ? undefined : bing.error,
    };
    console.log(bing.ok ? '  ✅ Extraído' : `  ❌ ${bing.error?.substring(0, 100)}`);
  }

  // IndexNow dry-run
  if (allSources) {
    section('IndexNow');
    const indexNow = run('node scripts/submit-indexnow.mjs --dry-run');
    collection.sources.indexnow = {
      status: indexNow.ok ? 'ran' : 'error',
      error: indexNow.ok ? undefined : indexNow.error,
    };
    console.log(indexNow.ok ? '  ✅ Dry-run ejecutado' : `  ❌ Error`);
  }

  // SEO Health
  if (allSources || localOnly) {
    section('SEO Health (local)');
    const health = run('node scripts/seo-health-check.mjs --json');
    collection.sources.seoHealth = {
      status: health.ok ? 'ran' : 'error',
      error: health.ok ? undefined : health.error,
    };
    console.log(health.ok ? '  ✅ Ejecutado' : `  ❌ Error`);

    // Sitemap audit
    const sitemap = run('node scripts/auditar-indexacion-prioritaria.mjs');
    collection.sources.sitemap = {
      status: sitemap.ok ? 'ran' : 'error',
      error: sitemap.ok ? undefined : sitemap.error,
    };
    console.log(sitemap.ok ? '  ✅ Sitemap verificado' : `  ❌ Error`);
  }

  // Save JSON summary
  ensureDir(SEO_DATA_DIR);
  fs.writeFileSync(SUMMARY_JSON, JSON.stringify(collection, null, 2));

  // Generate Markdown summary
  ensureDir(AUDITS_DIR);
  let md = `# SEO Live Summary\n\n`;
  md += `**Generado:** ${new Date().toISOString()}\n\n`;
  md += `## Fuentes\n\n`;
  md += `| Fuente | Estado | Error |\n`;
  md += `|--------|--------|-------|\n`;

  for (const [source, data] of Object.entries(collection.sources)) {
    const status = data.status === 'ran' ? '✅' : '❌';
    md += `| ${source} | ${status} | ${data.error || '-'} |\n`;
  }

  md += `\n## Archivos de datos\n\n`;
  md += `- GSC: \`data/google/gsc-live.json\`\n`;
  md += `- GA4: \`data/google/ga4-live.json\`\n`;
  md += `- Bing: \`data/bing/bing-live.json\`\n`;
  md += `- Reporte Bing: \`docs/audits/bing-live-report.md\`\n\n`;

  md += `## Siguientes pasos\n\n`;
  md += `1. Si alguna fuente falló, verifica con \`npm run seo:doctor\`\n`;
  md += `2. Para re-autenticar: \`npm run auth:google\` y/o \`npm run auth:bing\`\n`;
  md += `3. Para datos frescos: \`npm run seo:collect\`\n`;

  fs.writeFileSync(SUMMARY_MD, md, 'utf-8');

  const okCount = Object.values(collection.sources).filter(s => s.status === 'ran').length;
  const total = Object.keys(collection.sources).length;

  console.log('\n═══════════════════════════════════════');
  console.log(`  Recolectado: ${okCount}/${total} fuentes`);
  console.log(`  Resumen JSON: data/seo/live-summary.json`);
  console.log(`  Resumen MD:   docs/audits/seo-live-summary.md`);
  console.log('═══════════════════════════════════════');
}

main().catch(e => { console.error(e); process.exit(1); });
