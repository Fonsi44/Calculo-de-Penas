#!/usr/bin/env node
/**
 * Google Analytics 4 — Datos LIVE para el proyecto
 *
 * Extrae datos reales de GA4 (Data API) y los guarda en data/google/ga4-live.json.
 * Soporta OAuth (gcloud ADC) y service account.
 *
 * Uso:
 *   npm run seo:ga4:live                     # últimos 7 días
 *   npm run seo:ga4:live -- --days 28        # últimos 28 días
 *   npm run seo:ga4:live -- --days 90        # últimos 90 días
 *   npm run seo:ga4:live -- --json-only      # solo JSON
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
const OUT_FILE = resolve(GOOGLE_DATA_DIR, "ga4-live.json");
const OUT_CSV = resolve(GOOGLE_DATA_DIR, "ga4-live.csv");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const DAYS = parseInt(getArg("--days") || "28", 10);
const JSON_ONLY = hasFlag("--json-only");
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

/** Autodescubre el property ID de GA4 vía Admin API (service account/ADC). */
async function resolvePropertyId(auth) {
  if (PROPERTY_ID) return PROPERTY_ID;
  const { google } = await import("googleapis");
  const admin = google.analyticsadmin({ version: "v1alpha", auth });
  const accounts = await admin.accounts.list();
  const accs = accounts.data.accounts || [];
  if (!accs.length) return null;
  const props = await admin.properties.list({
    filter: `parent:${accs[0].name}`,
  });
  const list = props.data.properties || [];
  const match =
    list.find(
      (p) => p.displayName && p.displayName.toLowerCase().includes("pineda"),
    ) ||
    list.find((p) => p.propertyType === "PROPERTY_TYPE_GA4") ||
    list[0];
  if (!match) return null;
  const resolved = match.name.split("/").pop();
  if (!JSON_ONLY)
    console.log(`GA4 property resuelto: ${match.displayName} (${resolved})`);
  return resolved;
}
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

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
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    await auth.authorize();
    return auth;
  }

  // Service account desde .secrets/ga4-service-account.json (gitignored)
  const saFile = resolve(ROOT, ".secrets", "ga4-service-account.json");
  if (fs.existsSync(saFile)) {
    try {
      const sa = JSON.parse(fs.readFileSync(saFile, "utf8"));
      if (sa.client_email && sa.private_key) {
        if (!JSON_ONLY)
          console.log(
            "Usando service account (.secrets/ga4-service-account.json)",
          );
        const auth = new google.auth.JWT({
          email: sa.client_email,
          key: sa.private_key,
          scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
        });
        await auth.authorize();
        return auth;
      }
    } catch {
      /* fall through */
    }
  }

  // OAuth refresh token (preferido porque gcloud ADC puede no tener analytics.readonly)
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

  // gcloud ADC (fallback)
  try {
    const probe = runGcloud([
      "auth",
      "application-default",
      "print-access-token",
    ]);
    if (!probe.ok) throw new Error("ADC no disponible");
    if (!JSON_ONLY) console.log("Usando gcloud ADC");
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    return auth.getClient();
  } catch {
    return null;
  }
}

async function runReport(
  auth,
  property,
  startDate,
  endDate,
  metrics,
  dimensions = [],
) {
  const { google } = await import("googleapis");
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const rows = [];
  let headers;
  const limit = 10000;
  for (let offset = 0; ; offset += limit) {
    const resp = await withRetry(() =>
      analyticsData.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: metrics.map((m) => ({ name: m })),
          dimensions: dimensions.map((d) => ({ name: d })),
          limit,
          offset,
        },
      }),
    );
    headers ||= resp.data;
    const page = resp.data.rows || [];
    rows.push(...page);
    if (page.length < limit || rows.length >= Number(resp.data.rowCount || 0))
      break;
  }
  return { ...headers, rows };
}

function parseRows(report) {
  if (!report.rows) return [];
  return report.rows.map((row) => {
    const obj = {};
    row.dimensionValues.forEach((dv, i) => {
      obj[report.dimensionHeaders?.[i]?.name || `dim${i}`] = dv.value;
    });
    row.metricValues.forEach((mv, i) => {
      obj[report.metricHeaders?.[i]?.name || `metric${i}`] = mv.value;
    });
    return obj;
  });
}

async function main() {
  if (!JSON_ONLY) {
    console.log("Google Analytics 4 — LIVE Data Extractor\n");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Período: últimos ${DAYS} días`);
  }

  const auth = await getAuth();
  if (!auth) {
    const result = {
      status: "no_credentials",
      timestamp: new Date().toISOString(),
      message: "Sin credenciales. Requiere service account o gcloud ADC.",
      help: "npm run auth:google",
    };
    ensureDir(GOOGLE_DATA_DIR);
    fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  // Resolver el property ID (env o Admin API).
  const resolvedProperty = await resolvePropertyId(auth);
  if (!resolvedProperty) {
    console.error(
      "ERROR: sin GOOGLE_ANALYTICS_PROPERTY_ID ni propiedad GA4 accesible",
    );
    process.exit(1);
  }

  const { start: startStr, end: endStr } = resolvePeriod(DAYS);
  const property = `properties/${resolvedProperty}`;

  if (!JSON_ONLY) console.log(`Consultando GA4: ${startStr} → ${endStr}\n`);

  const result = {
    status: "ok",
    timestamp: new Date().toISOString(),
    propertyId: resolvedProperty,
    measurementId: MEASUREMENT_ID || null,
    period: { start: startStr, end: endStr, days: DAYS },
    overview: {},
    topPages: [],
    sources: [],
    countries: [],
    devices: [],
    daily: [],
    eventsByName: [],
    campaigns: [],
    landingPages: [],
    browsers: [],
  };

  try {
    // Overview: total users, sessions, screen page views, etc.
    const overview = await runReport(auth, property, startStr, endStr, [
      "totalUsers",
      "sessions",
      "screenPageViews",
      "averageSessionDuration",
      "bounceRate",
      "eventCount",
      "keyEvents",
    ]);
    if (overview.rows?.length) {
      const r = overview.rows[0];
      result.overview = {
        totalUsers: r.metricValues[0]?.value || "0",
        sessions: r.metricValues[1]?.value || "0",
        pageViews: r.metricValues[2]?.value || "0",
        avgSessionSec: r.metricValues[3]?.value || "0",
        bounceRate: r.metricValues[4]?.value || "0",
        events: r.metricValues[5]?.value || "0",
        keyEvents: r.metricValues[6]?.value || "0",
      };
    }

    // Top pages (dataset completo: los informes pueden mostrar top, los
    // datos conservan todas las filas recuperadas — §4.7).
    const pages = await runReport(
      auth,
      property,
      startStr,
      endStr,
      ["screenPageViews", "totalUsers"],
      ["pagePath"],
    );
    result.topPages = parseRows(pages);

    // Traffic sources (dataset completo)
    const sources = await runReport(
      auth,
      property,
      startStr,
      endStr,
      ["totalUsers", "sessions"],
      ["sessionSource"],
    );
    result.sources = parseRows(sources);

    // Countries (dataset completo)
    const countries = await runReport(
      auth,
      property,
      startStr,
      endStr,
      ["totalUsers", "sessions"],
      ["country"],
    );
    result.countries = parseRows(countries);

    // Devices
    const devices = await runReport(
      auth,
      property,
      startStr,
      endStr,
      ["totalUsers", "sessions"],
      ["deviceCategory"],
    );
    result.devices = parseRows(devices);

    // Daily active users
    const daily = await runReport(
      auth,
      property,
      startStr,
      endStr,
      ["activeUsers", "sessions"],
      ["date"],
    );
    result.daily = parseRows(daily);

    result.eventsByName = parseRows(
      await runReport(
        auth,
        property,
        startStr,
        endStr,
        ["eventCount", "totalUsers"],
        ["eventName"],
      ),
    );
    result.campaigns = parseRows(
      await runReport(
        auth,
        property,
        startStr,
        endStr,
        ["sessions", "totalUsers"],
        ["sessionCampaignName", "sessionSourceMedium"],
      ),
    );
    result.landingPages = parseRows(
      await runReport(
        auth,
        property,
        startStr,
        endStr,
        ["sessions", "newUsers"],
        ["landingPage"],
      ),
    );
    result.browsers = parseRows(
      await runReport(
        auth,
        property,
        startStr,
        endStr,
        ["totalUsers", "sessions"],
        ["browser"],
      ),
    );

    if (!hasFlag("--dry-run")) {
      await atomicWriteJson(OUT_FILE, result);
      await writeDatasetsCsv(OUT_CSV, {
        pages: result.topPages,
        sources: result.sources,
        countries: result.countries,
        devices: result.devices,
        daily: result.daily,
        events: result.eventsByName,
        campaigns: result.campaigns,
        landingPages: result.landingPages,
        browsers: result.browsers,
      });
    }

    if (!JSON_ONLY) {
      console.log("── RESUMEN ──");
      const o = result.overview;
      console.log(`  Usuarios:       ${o.totalUsers}`);
      console.log(`  Sesiones:       ${o.sessions}`);
      console.log(`  Páginas vistas: ${o.pageViews}`);
      console.log(`  Eventos:        ${o.events}`);
      console.log(`  Eventos clave:  ${o.keyEvents}`);
      console.log(`  Sesión media:   ${o.avgSessionSec}s`);
      console.log(`  Tasa rebote:    ${o.bounceRate}`);
      console.log(`  Páginas top:    ${result.topPages.length}`);
      console.log(`  Fuentes:        ${result.sources.length}`);
      console.log(`  Países:         ${result.countries.length}`);
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
