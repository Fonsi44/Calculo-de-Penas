#!/usr/bin/env node
/**
 * Google Search Console — Datos LIVE para el proyecto
 *
 * Extrae datos reales de GSC y los guarda en data/google/gsc-live.json.
 * Soporta OAuth (gcloud ADC o refresh token) y service account.
 *
 * Uso:
 *   npm run seo:gsc:live                    # últimos 7 días
 *   npm run seo:gsc:live -- --days 28       # últimos 28 días
 *   npm run seo:gsc:live -- --days 90       # últimos 90 días
 *   npm run seo:gsc:live -- --json-only     # solo JSON, sin stdout
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env') });
config({ path: resolve(ROOT, '.env.local'), override: true });

const GOOGLE_DATA_DIR = resolve(ROOT, 'data', 'google');
const OUT_FILE = resolve(GOOGLE_DATA_DIR, 'gsc-live.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}
function hasFlag(name) {
  return process.argv.includes(name);
}

const DAYS = parseInt(getArg('--days') || '28', 10);
const JSON_ONLY = hasFlag('--json-only');
const SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

async function getAuth() {
  const { google } = await import('googleapis');

  // Service account
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (saEmail && saKey) {
    if (!JSON_ONLY) console.log('Usando service account');
    const auth = new google.auth.JWT({
      email: saEmail,
      key: saKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    await auth.authorize();
    return auth;
  }

  // OAuth refresh token
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    if (!JSON_ONLY) console.log('Usando OAuth refresh token');
    const auth = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000');
    auth.setCredentials({ refresh_token: refreshToken });
    return auth;
  }

  // gcloud ADC
  try {
    const { execSync } = await import('node:child_process');
    execSync('gcloud auth application-default print-access-token 2>nul', { stdio: 'pipe' });
    if (!JSON_ONLY) console.log('Usando gcloud ADC');
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    return auth.getClient();
  } catch {
    return null;
  }
}

async function queryGSC(siteUrl, auth, startDate, endDate, dimensions, rowLimit = 500) {
  const { google } = await import('googleapis');
  const sc = google.searchconsole({ version: 'v1', auth });

  const result = await sc.searchanalytics.query({
    siteUrl,
    requestBody: { startDate, endDate, dimensions, rowLimit },
  });

  return result.data.rows || [];
}

async function main() {
  if (!JSON_ONLY) {
    console.log('Google Search Console — LIVE Data Extractor\n');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Período: últimos ${DAYS} días`);
  }

  if (!SITE_URL) {
    console.error('ERROR: GOOGLE_SEARCH_CONSOLE_SITE_URL no configurada en .env.local');
    process.exit(1);
  }

  const auth = await getAuth();
  if (!auth) {
    const result = {
      status: 'no_credentials',
      timestamp: new Date().toISOString(),
      message: 'Sin credenciales. Requiere OAuth, service account o gcloud ADC.',
      help: 'npm run auth:google',
    };
    ensureDir(GOOGLE_DATA_DIR);
    fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  const end = new Date();
  const start = new Date(end.getTime() - DAYS * 24 * 60 * 60 * 1000);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  if (!JSON_ONLY) console.log(`Consultando GSC: ${startStr} → ${endStr}\n`);

  const result = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    siteUrl: SITE_URL,
    period: { start: startStr, end: endStr, days: DAYS },
    summary: {},
    queries: [],
    pages: [],
    countries: [],
    devices: [],
    daily: [],
  };

  try {
    // Summary (sin dimensión para métricas agregadas)
    const { google } = await import('googleapis');
    const sc = google.searchconsole({ version: 'v1', auth });
    const summaryRes = await sc.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: { startDate: startStr, endDate: endStr },
    });
    if (summaryRes.data.rows?.length) {
      const r = summaryRes.data.rows[0];
      result.summary = {
        clicks: Math.round(r.clicks || 0),
        impressions: Math.round(r.impressions || 0),
        ctr: Number((r.ctr || 0) * 100).toFixed(2) + '%',
        position: Number(r.position || 0).toFixed(1),
      };
    }

    // Top queries
    result.queries = (await queryGSC(SITE_URL, auth, startStr, endStr, ['query'], 100))
      .map(r => ({
        query: r.keys[0],
        clicks: Math.round(r.clicks || 0),
        impressions: Math.round(r.impressions || 0),
        ctr: Number((r.ctr || 0) * 100).toFixed(2) + '%',
        position: Number(r.position || 0).toFixed(1),
      }));

    // Top pages
    result.pages = (await queryGSC(SITE_URL, auth, startStr, endStr, ['page'], 200))
      .map(r => ({
        page: r.keys[0],
        clicks: Math.round(r.clicks || 0),
        impressions: Math.round(r.impressions || 0),
      }));

    // Countries
    result.countries = (await queryGSC(SITE_URL, auth, startStr, endStr, ['country'], 50))
      .map(r => ({
        country: r.keys[0],
        clicks: Math.round(r.clicks || 0),
        impressions: Math.round(r.impressions || 0),
      }));

    // Devices
    result.devices = (await queryGSC(SITE_URL, auth, startStr, endStr, ['device'], 10))
      .map(r => ({
        device: r.keys[0],
        clicks: Math.round(r.clicks || 0),
        impressions: Math.round(r.impressions || 0),
      }));

    // Daily
    result.daily = (await queryGSC(SITE_URL, auth, startStr, endStr, ['date'], DAYS))
      .map(r => ({
        date: r.keys[0],
        clicks: Math.round(r.clicks || 0),
        impressions: Math.round(r.impressions || 0),
      }));

    ensureDir(GOOGLE_DATA_DIR);
    fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2));

    if (!JSON_ONLY) {
      console.log('── RESUMEN ──');
      if (result.summary.clicks !== undefined) {
        console.log(`  Clics:       ${result.summary.clicks}`);
        console.log(`  Impresiones: ${result.summary.impressions}`);
        console.log(`  CTR:         ${result.summary.ctr}`);
        console.log(`  Posición:    ${result.summary.position}`);
      }
      console.log(`  Queries:     ${result.queries.length}`);
      console.log(`  Páginas:     ${result.pages.length}`);
      console.log(`  Países:      ${result.countries.length}`);
      console.log(`\nDatos guardados en: ${OUT_FILE}`);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err) {
    result.status = 'error';
    result.error = err.message?.substring(0, 300) || String(err);
    ensureDir(GOOGLE_DATA_DIR);
    fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2));
    console.error('ERROR:', err.message?.substring(0, 300));
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
