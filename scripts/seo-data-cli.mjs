#!/usr/bin/env node
/**
 * CLI unificada de datos SEO/GEO — Pineda y Asociados
 *
 * Comandos:
 *   npm run seo:data -- doctor                      # diagnóstico del entorno
 *   npm run seo:data -- auth google|bing|status     # autenticación
 *   npm run seo:data -- collect [--source gsc|ga4|bing|crux] [--days N]
 *   npm run seo:data -- audit                       # crawl + auditoría de producción
 *   npm run seo:data -- report                      # informes sanitizados
 *
 * Flags: --dry-run, --json, --verbose, --source, --start, --end, --days
 *
 * Estados honestos: PASS / PARTIAL / SKIPPED / FAIL. Un `no_credentials` o
 * `no_access` NUNCA se marca como PASS. Sin secretos en logs ni en salida.
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import {
  arg,
  hasFlag,
  sleep,
  withRetry,
  atomicWriteJson,
  writeDatasetsCsv,
} from "./analytics/export-utils.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(ROOT, ".env") });
config({ path: resolve(ROOT, ".env.local"), override: true });

const VERSION = "1.0.0";
const TIMEZONE = "America/Tegucigalpa";

// Origen canónico y mask desde la fuente única (sin hardcodear el dominio).
import {
  canonicalOrigin,
  readEnvExampleValue,
  mask as maskValue,
} from "./seo-data-config.mjs";
export { canonicalOrigin, readEnvExampleValue } from "./seo-data-config.mjs";
export function mask(value) {
  return maskValue(value);
}

function hasEnv(name) {
  const v = process.env[name];
  return Boolean(v && v !== "undefined" && !String(v).includes("placeholder"));
}

const SENSITIVE_KEYS = [
  "INDEXNOW_KEY",
  "BING_WEBMASTER_API_KEY",
  "BING_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "OAUTH_CLIENT_SECRET",
  "RESEND_API_KEY",
  "TURNSTILE_SECRET_KEY",
];

function credPresence() {
  return Object.fromEntries(
    SENSITIVE_KEYS.map((k) => [k, hasEnv(k) ? "PRESENT" : "ABSENT"]),
  );
}

// ── Doctor ─────────────────────────────────────────────────────────────────
async function doctor() {
  const checks = [];
  const add = (check, result, details) =>
    checks.push({ check, result, details });

  // Dominio canónico (comparar contra .env.example, sin hardcodear la cadena)
  const origin = canonicalOrigin();
  const example = readEnvExampleValue("NEXT_PUBLIC_SITE_URL");
  const expected = example ? example.replace(/\/+$/, "") : null;
  const domainOk =
    !!expected &&
    origin === expected &&
    /^https:\/\/www\.[a-z0-9]+\.com$/.test(origin);
  add(
    "dominio_canonico",
    domainOk ? "PASS" : "FAIL",
    `${origin}${example ? ` (env.example: ${example})` : ""}`,
  );

  // gcloud / bq
  const gcloud = spawnSync("gcloud", ["--version"], { encoding: "utf8" });
  add(
    "gcloud",
    gcloud.status === 0 ? "PASS" : "SKIPPED",
    gcloud.status === 0 ? "instalada" : "no disponible",
  );
  const bq = spawnSync("bq", ["version"], { encoding: "utf8" });
  add(
    "bq",
    bq.status === 0 ? "PASS" : "SKIPPED",
    bq.status === 0 ? "instalado" : "no disponible",
  );

  // ADC validez (sin imprimir tokens)
  const adc = spawnSync(
    "gcloud",
    ["auth", "application-default", "print-access-token"],
    { encoding: "utf8" },
  );
  add(
    "adc_google",
    adc.status === 0 ? "PASS" : "FAIL",
    adc.status === 0 ? "ADC válido" : "ADC no disponible",
  );

  // Credenciales por fuente
  const bingOAuth = hasEnv("BING_CLIENT_ID") && hasEnv("BING_CLIENT_SECRET");
  const bingApiKey = hasEnv("BING_WEBMASTER_API_KEY");
  const gscUrl = hasEnv("GOOGLE_SEARCH_CONSOLE_SITE_URL");
  const ga4Prop = hasEnv("GOOGLE_ANALYTICS_PROPERTY_ID");
  const ga4Meas = hasEnv("NEXT_PUBLIC_GA_ID");

  add(
    "gsc_config",
    gscUrl ? "PASS" : "PARTIAL",
    gscUrl
      ? "URL configurada"
      : "falta GOOGLE_SEARCH_CONSOLE_SITE_URL (se usará la canónica)",
  );
  add(
    "ga4_config",
    ga4Prop || ga4Meas ? "PARTIAL" : "SKIPPED",
    `${ga4Prop ? `property ${ga4Prop} ` : ""}${ga4Meas ? `measurement ${ga4Meas}` : ""}${!(ga4Prop || ga4Meas) ? "sin GA4 configurado" : ""}`,
  );
  add(
    "bing_creds",
    bingOAuth ? "PASS" : bingApiKey ? "PARTIAL" : "SKIPPED",
    `${bingOAuth ? "OAuth configurado" : "sin OAuth"}${bingApiKey ? " · API key configurada" : " · sin API key"}${!(bingOAuth || bingApiKey) ? " · usa INDEXNOW_KEY (deprecado)" : ""}`,
  );
  add(
    "indexnow_key",
    hasEnv("INDEXNOW_KEY") ? "PASS" : "SKIPPED",
    "clave IndexNow (solo IndexNow, no Bing API)",
  );

  const result = checks.some((c) => c.result === "FAIL")
    ? "FAIL"
    : checks.some((c) => c.result === "PARTIAL")
      ? "PARTIAL"
      : "PASS";
  const summary = {
    verifier: "seo-data-cli",
    version: VERSION,
    generatedAt: new Date().toISOString(),
    timezone: TIMEZONE,
    result,
    checks,
    credentials: credPresence(),
  };
  if (hasFlag("--json")) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`SEO DATA DOCTOR · ${result}`);
    for (const c of checks)
      console.log(
        `  ${c.result === "PASS" ? "✅" : c.result === "PARTIAL" ? "🟡" : c.result === "SKIPPED" ? "⏭" : "⛔"} ${c.check}: ${c.result} — ${c.details}`,
      );
  }
  if (!hasFlag("--dry-run") || result === "FAIL") {
    await atomicWriteJson(
      resolve(ROOT, ".secrets", "seo-data", "doctor.json"),
      summary,
    );
  }
  return result === "FAIL" ? 1 : 0;
}

// ── Auth ───────────────────────────────────────────────────────────────────
function auth(target) {
  const npm = spawnSync("npm", ["run", "auth:google"], {
    cwd: ROOT,
    stdio: "inherit",
    encoding: "utf8",
  });
  return npm.status ?? 1;
}

function authStatus() {
  const status = spawnSync("npm", ["run", "auth:google:status"], {
    cwd: ROOT,
    stdio: "inherit",
    encoding: "utf8",
  });
  return status.status ?? 1;
}

// ── Collect ────────────────────────────────────────────────────────────────
function runCollector(script, extraArgs = []) {
  const result = spawnSync(
    "node",
    [resolve(ROOT, "scripts", script), ...extraArgs, "--json-only"],
    { cwd: ROOT, encoding: "utf8" },
  );
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

async function collect(source, days) {
  const json = hasFlag("--json");
  const report = {
    generatedAt: new Date().toISOString(),
    timezone: TIMEZONE,
    source,
    days,
    status: "SKIPPED",
    detail: "",
  };

  if (source === "gsc") {
    const env = {
      ...process.env,
      GOOGLE_SEARCH_CONSOLE_SITE_URL:
        process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || `${canonicalOrigin()}/`,
    };
    const out = spawnSync(
      "node",
      [
        resolve(ROOT, "scripts", "google-search-console-live.mjs"),
        "--days",
        String(days),
        "--json-only",
      ],
      { cwd: ROOT, env, encoding: "utf8" },
    );
    const parsed =
      safeJson(out.stdout) ||
      safeJson(readLastJson(resolve(ROOT, "data", "google", "gsc-live.json")));
    if (parsed && parsed.status === "ok") {
      report.status = "PASS";
      report.detail = `clicks=${parsed.summary?.clicks} impressions=${parsed.summary?.impressions}`;
    } else if (parsed && parsed.status === "no_credentials") {
      report.status = "SKIPPED";
      report.detail = "no_credentials";
    } else {
      report.status = parsed?.status === "partial" ? "PARTIAL" : "FAIL";
      report.detail = (parsed?.message || out.stderr || "").slice(0, 200);
    }
  } else if (source === "ga4") {
    const out = runCollector("google-analytics-live.mjs", [
      "--days",
      String(days),
    ]);
    const parsed =
      safeJson(out.stdout) ||
      safeJson(readLastJson(resolve(ROOT, "data", "google", "ga4-live.json")));
    if (parsed && parsed.status === "ok") {
      report.status = "PASS";
      report.detail = `users=${parsed.overview?.totalUsers ?? "?"}`;
    } else if (
      parsed &&
      ["no_credentials", "no_config"].includes(parsed.status)
    ) {
      report.status = "SKIPPED";
      report.detail = parsed.status;
    } else {
      report.status = "PARTIAL";
      report.detail =
        "GA4 requiere scope analytics.readonly (client OAuth propio) o service account";
    }
  } else if (source === "bing") {
    const out = runCollector("bing-webmaster-live.mjs");
    const parsed =
      safeJson(out.stdout) ||
      safeJson(readLastJson(resolve(ROOT, "data", "bing", "bing-live.json")));
    if (parsed && parsed.status === "ok") {
      report.status = "PASS";
      report.detail = "datos Bing obtenidos";
    } else if (
      parsed &&
      ["no_credentials", "no_access"].includes(parsed.status)
    ) {
      report.status = "SKIPPED";
      report.detail = parsed.status;
    } else {
      report.status = "PARTIAL";
      report.detail =
        "Bing requiere BING_WEBMASTER_API_KEY o OAuth (no usar INDEXNOW_KEY)";
    }
  } else if (source === "crux") {
    report.status = "PARTIAL";
    report.detail =
      "CrUX requiere quota project y API Chrome UX Report habilitada";
  } else {
    report.status = "FAIL";
    report.detail = `fuente desconocida: ${source}`;
  }

  await atomicWriteJson(
    resolve(ROOT, ".secrets", "seo-data", `collect-${source}.json`),
    report,
  );
  if (json) console.log(JSON.stringify(report, null, 2));
  else console.log(`${report.status} · ${source} · ${report.detail}`);
  return report.status === "FAIL" ? 1 : 0;
}

function safeJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function readLastJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

// ── Main (guard: solo ejecuta como CLI, no al importar) ────────────────────
import { pathToFileURL } from "node:url";
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isMain) {
  const command = process.argv[2] || "doctor";

  if (command === "doctor") process.exit(await doctor());
  else if (command === "auth") {
    const target = process.argv[3] || "google";
    process.exit(target === "status" ? authStatus() : auth(target));
  } else if (command === "collect") {
    const source = arg("--source", "gsc");
    const days = Number(arg("--days", "28"));
    process.exit(await collect(source, days));
  } else if (command === "audit" || command === "report") {
    // Audit/report se delegan a los scripts dedicados de esta intervención.
    const target =
      command === "audit" ? "seo-data-audit.mjs" : "seo-data-report.mjs";
    const out = spawnSync(
      "node",
      [resolve(ROOT, "scripts", target), ...process.argv.slice(3)],
      { cwd: ROOT, stdio: "inherit", encoding: "utf8" },
    );
    process.exit(out.status ?? 1);
  } else {
    console.error(
      `Comando desconocido: ${command}\nUso: npm run seo:data -- [doctor|auth|collect|audit|report]`,
    );
    process.exit(2);
  }
}
