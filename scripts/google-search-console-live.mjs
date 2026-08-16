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

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import {
  atomicWriteJson,
  hasFlag,
  resolvePeriod,
  writeDatasetsCsv,
  withRetry,
} from "./analytics/export-utils.mjs";
import { runGcloud } from "./gcloud-cli.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
config({ path: resolve(ROOT, ".env") });
config({ path: resolve(ROOT, ".env.local"), override: false });

const GOOGLE_DATA_DIR = resolve(ROOT, "data", "google");
const OUT_FILE = resolve(GOOGLE_DATA_DIR, "gsc-live.json");
const OUT_CSV = resolve(GOOGLE_DATA_DIR, "gsc-live.csv");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const DAYS = parseInt(getArg("--days") || "28", 10);
const JSON_ONLY = hasFlag("--json-only");
let SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

/** Resuelve la propiedad GSC canónica vía sites.list (sin URLs hardcoded). */
async function resolveSiteUrl(auth) {
  if (SITE_URL) return SITE_URL;
  const { google } = await import("googleapis");
  const sc = google.searchconsole({ version: "v1", auth });
  const sites = await sc.sites.list();
  const entries = (sites.data.siteEntry || []).filter((s) =>
    ["siteOwner", "siteFullUser", "siteRestrictedUser"].includes(
      s.permissionLevel,
    ),
  );
  const canonicalHost = (process.env.NEXT_PUBLIC_SITE_URL || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const match = entries.find((s) => s.siteUrl.includes(canonicalHost));
  SITE_URL = (match || entries[0])?.siteUrl || null;
  if (SITE_URL && !JSON_ONLY) console.log(`GSC site resuelto: ${SITE_URL}`);
  return SITE_URL;
}

async function getAuth() {
  const { google } = await import("googleapis");

  // Service account
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (saEmail && saKey) {
    if (!JSON_ONLY) console.log("Usando service account");
    const auth = new google.auth.JWT({
      email: saEmail,
      key: saKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    await auth.authorize();
    return auth;
  }

  // OAuth refresh token
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    if (!JSON_ONLY) console.log("Usando OAuth refresh token");
    const auth = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "http://localhost:3000",
    );
    auth.setCredentials({ refresh_token: refreshToken });
    return auth;
  }

  // gcloud ADC
  try {
    const probe = runGcloud([
      "auth",
      "application-default",
      "print-access-token",
    ]);
    if (!probe.ok) throw new Error("ADC no disponible");
    if (!JSON_ONLY) console.log("Usando gcloud ADC");
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    return auth.getClient();
  } catch {
    return null;
  }
}

async function queryGSC(siteUrl, auth, startDate, endDate, dimensions) {
  const { google } = await import("googleapis");
  const sc = google.searchconsole({ version: "v1", auth });

  const rows = [];
  const rowLimit = 25000;
  for (let startRow = 0; ; startRow += rowLimit) {
    const result = await withRetry(() =>
      sc.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit,
          startRow,
          dataState: "final",
        },
      }),
    );
    const page = result.data.rows || [];
    rows.push(...page);
    if (page.length < rowLimit) break;
  }
  return rows;
}

async function main() {
  if (!JSON_ONLY) {
    console.log("Google Search Console — LIVE Data Extractor\n");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Período: últimos ${DAYS} días`);
  }

  const auth = await getAuth();
  if (!auth) {
    const result = {
      status: "no_credentials",
      timestamp: new Date().toISOString(),
      message:
        "Sin credenciales. Requiere OAuth, service account o gcloud ADC.",
      help: "npm run auth:google",
    };
    ensureDir(GOOGLE_DATA_DIR);
    fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  // Resolver la propiedad canónica (GOOGLE_SEARCH_CONSOLE_SITE_URL o sites.list).
  const resolvedSiteUrl = await resolveSiteUrl(auth);
  if (!resolvedSiteUrl) {
    console.error(
      "ERROR: sin propiedad GSC accesible y sin GOOGLE_SEARCH_CONSOLE_SITE_URL",
    );
    process.exit(1);
  }

  const { start: startStr, end: endStr } = resolvePeriod(DAYS);

  if (!JSON_ONLY) console.log(`Consultando GSC: ${startStr} → ${endStr}\n`);

  const result = {
    status: "ok",
    timestamp: new Date().toISOString(),
    siteUrl: SITE_URL,
    period: { start: startStr, end: endStr, days: DAYS },
    summary: {},
    queries: [],
    pages: [],
    countries: [],
    devices: [],
    appearances: [],
    daily: [],
    queryPages: [],
  };

  try {
    // Summary (sin dimensión para métricas agregadas)
    const { google } = await import("googleapis");
    const sc = google.searchconsole({ version: "v1", auth });
    const summaryRes = await sc.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: { startDate: startStr, endDate: endStr },
    });
    if (summaryRes.data.rows?.length) {
      const r = summaryRes.data.rows[0];
      result.summary = {
        clicks: Math.round(r.clicks || 0),
        impressions: Math.round(r.impressions || 0),
        ctr: Number((r.ctr || 0) * 100).toFixed(2) + "%",
        position: Number(r.position || 0).toFixed(1),
      };
    }

    // Top queries
    result.queries = (
      await queryGSC(SITE_URL, auth, startStr, endStr, ["query"])
    ).map((r) => ({
      query: r.keys[0],
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
      ctr: Number((r.ctr || 0) * 100).toFixed(2) + "%",
      position: Number(r.position || 0).toFixed(1),
    }));

    // Top pages
    result.pages = (
      await queryGSC(SITE_URL, auth, startStr, endStr, ["page"])
    ).map((r) => ({
      page: r.keys[0],
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
    }));

    // Countries
    result.countries = (
      await queryGSC(SITE_URL, auth, startStr, endStr, ["country"])
    ).map((r) => ({
      country: r.keys[0],
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
    }));

    // Devices
    result.devices = (
      await queryGSC(SITE_URL, auth, startStr, endStr, ["device"])
    ).map((r) => ({
      device: r.keys[0],
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
    }));

    // Daily
    result.daily = (
      await queryGSC(SITE_URL, auth, startStr, endStr, ["date"])
    ).map((r) => ({
      date: r.keys[0],
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
    }));

    result.appearances = (
      await queryGSC(SITE_URL, auth, startStr, endStr, ["searchAppearance"])
    ).map((r) => ({
      appearance: r.keys[0],
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));
    result.queryPages = (
      await queryGSC(SITE_URL, auth, startStr, endStr, ["query", "page"])
    ).map((r) => ({
      query: r.keys[0],
      page: r.keys[1],
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));
    if (!hasFlag("--dry-run")) {
      await atomicWriteJson(OUT_FILE, result);
      await writeDatasetsCsv(OUT_CSV, {
        queries: result.queries,
        pages: result.pages,
        countries: result.countries,
        devices: result.devices,
        appearances: result.appearances,
        daily: result.daily,
        queryPages: result.queryPages,
      });
    }

    if (!JSON_ONLY) {
      console.log("── RESUMEN ──");
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
    result.status = "error";
    result.error = err.message?.substring(0, 300) || String(err);
    ensureDir(GOOGLE_DATA_DIR);
    if (!hasFlag("--dry-run")) await atomicWriteJson(OUT_FILE, result);
    console.error("ERROR:", err.message?.substring(0, 300));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
