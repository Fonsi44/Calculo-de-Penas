#!/usr/bin/env node
/**
 * Conversion Funnel Report (Fase 3)
 * Reads GA4 + GSC data and produces an organic funnel by landing page.
 * 
 * Uso: node scripts/analytics/funnel-report.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { google } from 'googleapis';
import { atomicWrite } from './export-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
config({ path: resolve(ROOT, '.env') });
config({ path: resolve(ROOT, '.env.local'), override: true });

const OUT_FILE = resolve(ROOT, 'docs', 'analytics', 'funnel-report.md');
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
const SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
const property = `properties/${PROPERTY_ID}`;

function getAuth() {
  const { google } = await import('googleapis');
  const auth = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    'http://localhost:3000'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

async function ga4Query(auth, metrics, dimensions = [], dateRange = { start: '28daysAgo', end: 'yesterday' }) {
  const data = google.analyticsdata({ version: 'v1beta', auth });
  const limit = 10000;
  const rows = [];
  for (let offset = 0; ; offset += limit) {
    const resp = await data.properties.runReport({ property, requestBody: {
      dateRanges: [{ startDate: dateRange.start, endDate: dateRange.end }],
      metrics: metrics.map(m => ({ name: m })),
      dimensions: dimensions.map(d => ({ name: d })),
      limit, offset,
    } });
    const page = resp.data.rows || [];
    rows.push(...page);
    if (page.length < limit) break;
  }
  return rows;
}

function parseRow(row) {
  const obj = {};
  row.dimensionValues.forEach((dv, i) => { obj[`dim${i}`] = dv.value; });
  row.metricValues.forEach((mv, i) => { obj[`met${i}`] = mv.value; });
  return obj;
}

async function main() {
  console.log('Funnel Report — Fase 3\n');
  const auth = getAuth();

  // Get landing pages with organic sessions + events in 28d
  const funnelQuery = await ga4Query(auth,
    ['sessions', 'totalUsers'],
    ['landingPage', 'sessionSource', 'sessionMedium'],
    { start: '28daysAgo', end: 'yesterday' }
  );

  // Filter to organic sessions only
  const organicLandings = funnelQuery
    .map(r => parseRow(r))
    .filter(r => r.dim1 === 'google' && r.dim2 === 'organic')
    .sort((a, b) => Number(b.met0) - Number(a.met0))
    .slice(0, 30);

  // Get events by path (CTA clicks, form starts, form submits, whatsapp, phone)
  const eventsQuery = await ga4Query(auth,
    ['eventCount'],
    ['eventName', 'landingPage'],
    { start: '28daysAgo', end: 'yesterday' }
  );

  const eventsByPath = {};
  for (const row of eventsQuery) {
    const r = parseRow(row);
    const key = r.dim1 || '/';
    if (!eventsByPath[key]) eventsByPath[key] = {};
    eventsByPath[key][r.dim0] = (eventsByPath[key][r.dim0] || 0) + Number(r.met0);
  }

  let md = '# Funnel Orgánico por Landing Page\n\n';
  md += `**Generado:** ${new Date().toISOString()}\n\n`;
  md += '## Embudo 28 días (orgánico Google)\n\n';
  md += '| Landing | Sesiones | Usuarios | CTA clicks | Form starts | Form submits | WhatsApp | Phone |\n';
  md += '|---------|--------:|--------:|----------:|-----------:|------------:|--------:|-----:|\n';

  for (const lp of organicLandings) {
    const path = lp.dim0 || '/';
    const events = eventsByPath[path] || {};
    md += `| ${path} | ${lp.met0} | ${lp.met1} | ${events['seo_blog_cta_click'] || 0} | ${events['form_start'] || 0} | ${events['contact_form_submit'] || 0} | ${events['whatsapp_click'] || 0} | ${events['phone_click'] || 0} |\n`;
  }

  // Summary
  const totalSessions = organicLandings.reduce((s, r) => s + Number(r.met0), 0);
  const totalCtaClicks = Object.values(eventsByPath).reduce((s, e) => s + (e['seo_blog_cta_click'] || 0), 0);
  const totalFormStarts = Object.values(eventsByPath).reduce((s, e) => s + (e['form_start'] || 0), 0);
  const totalFormSubmits = Object.values(eventsByPath).reduce((s, e) => s + (e['contact_form_submit'] || 0), 0);
  const totalWhatsApp = Object.values(eventsByPath).reduce((s, e) => s + (e['whatsapp_click'] || 0), 0);
  const totalPhone = Object.values(eventsByPath).reduce((s, e) => s + (e['phone_click'] || 0), 0);

  md += '\n## Totales\n\n';
  md += `| Métrica | Valor |\n|---------|-----:|\n`;
  md += `| Sesiones orgánicas | ${totalSessions} |\n`;
  md += `| CTA clicks | ${totalCtaClicks} |\n`;
  md += `| Form starts | ${totalFormStarts} |\n`;
  md += `| Form submits | ${totalFormSubmits} |\n`;
  md += `| WhatsApp clicks | ${totalWhatsApp} |\n`;
  md += `| Phone clicks | ${totalPhone} |\n`;

  if (totalSessions > 0) {
    md += `\n| Tasa CTA/sesión | ${(totalCtaClicks / totalSessions * 100).toFixed(1)}% |\n`;
    md += `| Tasa submit/inicio | ${totalFormStarts > 0 ? (totalFormSubmits / totalFormStarts * 100).toFixed(1) + '%' : 'N/A'} |\n`;
  }

  await atomicWrite(OUT_FILE, md);
  console.log(`Report generated: ${OUT_FILE}`);
  console.log(`Organic sessions: ${totalSessions}`);
  console.log(`Form submits: ${totalFormSubmits}`);
}

main().catch(e => { console.error(e); process.exit(1); });
