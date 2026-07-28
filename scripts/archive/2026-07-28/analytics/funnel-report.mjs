#!/usr/bin/env node
/**
 * Funnel Report Fase 3 — Embudo orgánico por landing page
 *
 * Uso: node scripts/analytics/funnel-report.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { atomicWrite } from './export-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
config({ path: resolve(ROOT, '.env') });
config({ path: resolve(ROOT, '.env.local'), override: true });

const OUT_FILE = resolve(ROOT, 'docs', 'analytics', 'funnel-report.md');
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
const property = `properties/${PROPERTY_ID}`;

async function getGoogle() {
  const { google } = await import('googleapis');
  const auth = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    'http://localhost:3000'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  await auth.getAccessToken();
  return { google, auth };
}

async function ga4RunReport(google, auth, metrics, dimensions = []) {
  const data = google.analyticsdata({ version: 'v1beta', auth });
  const limit = 10000;
  const rows = [];
  for (let offset = 0; ; offset += limit) {
    const resp = await data.properties.runReport({ property, requestBody: {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
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

async function main() {
  console.log('Funnel Report — Fase 3\n');
  const { google, auth } = await getGoogle();

  // 1. Organic sessions by landing page
  const organicQuery = await ga4RunReport(google, auth,
    ['sessions', 'totalUsers'],
    ['landingPage', 'sessionSource', 'sessionMedium']
  );

  const organicByLP = {};
  for (const row of organicQuery) {
    const lp = row.dimensionValues[0]?.value || '/';
    const source = row.dimensionValues[1]?.value || '';
    const medium = row.dimensionValues[2]?.value || '';
    if (source === 'google' && medium === 'organic') {
      if (!organicByLP[lp]) organicByLP[lp] = { sessions: 0, users: 0 };
      organicByLP[lp].sessions += parseInt(row.metricValues[0]?.value || '0');
      organicByLP[lp].users += parseInt(row.metricValues[1]?.value || '0');
    }
  }

  // 2. Events by landing page
  const eventsQuery = await ga4RunReport(google, auth,
    ['eventCount'],
    ['eventName', 'landingPage']
  );

  const eventsByLP = {};
  for (const row of eventsQuery) {
    const eventName = row.dimensionValues[0]?.value || '';
    const lp = row.dimensionValues[1]?.value || '/';
    if (!eventsByLP[lp]) eventsByLP[lp] = {};
    eventsByLP[lp][eventName] = (eventsByLP[lp][eventName] || 0) + parseInt(row.metricValues[0]?.value || '0');
  }

  // 3. Build funnel table for target pages
  const targetPages = [
    'pension-alimenticia-porcentaje',
    'pension-alimenticia-honduras-guia-completa',
    'prescripcion-deudas',
    'danos-perjuicios',
    'poder-legal',
    'custodia-hijos',
    'divorcio-honduras-guia-completa',
  ];

  let md = '# Funnel Orgánico 28d — Post-despliegue Fase 1B\n\n';
  md += `**Generado:** ${new Date().toISOString()}\n\n`;
  md += '| Landing | Sesiones org | Usuarios | CTA clicks | Form submits | WhatsApp | Phone |\n';
  md += '|---------|------------:|--------:|----------:|------------:|--------:|-----:|\n';

  const targetEvents = ['seo_blog_cta_click', 'contact_form_submit', 'whatsapp_click', 'phone_click'];

  for (const target of targetPages) {
    for (const [lp, data] of Object.entries(organicByLP)) {
      if (!lp.includes(target)) continue;
      const ev = eventsByLP[lp] || {};
      md += `| ${lp.replace('https://www.pinedayasociadoshn.com', '')} | ${data.sessions} | ${data.users} | ${ev['seo_blog_cta_click'] || 0} | ${ev['contact_form_submit'] || 0} | ${ev['whatsapp_click'] || 0} | ${ev['phone_click'] || 0} |\n`;
    }
  }

  const totalSessions = Object.values(organicByLP).reduce((s, d) => s + d.sessions, 0);
  const totalUsers = Object.values(organicByLP).reduce((s, d) => s + d.users, 0);
  const totalCTA = Object.values(eventsByLP).reduce((s, e) => s + (e['seo_blog_cta_click'] || 0), 0);
  const totalSubmit = Object.values(eventsByLP).reduce((s, e) => s + (e['contact_form_submit'] || 0), 0);

  md += '\n## Totales\n\n';
  md += `| Sesiones orgánicas (Google) | ${totalSessions} |\n`;
  md += `| Usuarios orgánicos | ${totalUsers} |\n`;
  md += `| CTA clicks | ${totalCTA} |\n`;
  md += `| Contact form submits | ${totalSubmit} |\n`;
  md += `| Tasa CTA/sesión | ${totalSessions > 0 ? (totalCTA / totalSessions * 100).toFixed(1) + '%' : 'N/A'} |\n`;

  md += '\n*Nota: Datos de 28 días previos al 2026-07-24 (periodo post-despliegue Fase 1B insuficiente).*\n';

  await atomicWrite(OUT_FILE, md);
  console.log(`Report: ${OUT_FILE}`);
  console.log(`Organic sessions: ${totalSessions}, CTA clicks: ${totalCTA}, Form submits: ${totalSubmit}`);
}

main().catch(e => { console.error(e.message?.slice(0, 200)); process.exit(1); });
