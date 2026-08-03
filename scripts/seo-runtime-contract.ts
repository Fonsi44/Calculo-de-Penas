/**
 * Gate unificado de runtime SEO/GEO (PROMPT 2 §13).
 *
 * Coordina y evalúa con resultados honestos:
 *   PASS / FAIL / SKIPPED_WITH_REASON
 *
 * Componentes:
 *   1. seo:public-contract        (estático: landings, sitemaps, claims, JSON-LD, llms.txt)
 *   2. contenido dinámico         (auditoría de política sobre DB/archivos)
 *   3. contrato del blog          (datos dinámicos)
 *   4. enlazado interno           (53 casos clasificados)
 *   5. sitemap en runtime         (requiere app + base local/staging)
 *   6. JSON-LD (IDs)              (tests estáticos)
 *   7. E2E esenciales             (requiere app; --run-e2e)
 *   8. Accesibilidad esencial     (requiere app; --run-a11y)
 *   9. Lighthouse                 (requiere app; --run-lighthouse)
 *
 * Regla: NUNCA marca PASS una prueba que no pudo ejecutarse por falta de
 * entorno; en ese caso reporta SKIPPED_WITH_REASON.
 *
 * Uso:
 *   npx tsx scripts/seo-runtime-contract.ts [--env-file .env.e2e.local]
 *       [--base-url http://localhost:3100]
 *       [--run-e2e] [--run-a11y] [--run-lighthouse]
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  loadEnvFile,
  inspectEnvironment,
  describeEnvironment,
} from "@/scripts/lib/environment-guard";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, "docs/seo/current");

type GateResult = "PASS" | "FAIL" | "SKIPPED_WITH_REASON";

interface GateEntry {
  check: string;
  result: GateResult;
  details: string;
}

const DB_ENV_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "NEON_BRANCH_ID",
  "NEON_ENDPOINT_ID",
  "ALLOW_STAGING_MIGRATIONS",
  "ALLOW_E2E_SEED",
  "ALLOW_TEST_EMAILS",
];

/** Env sin variables de base de datos (para gates estáticos sin DB). */
function withoutDbEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of DB_ENV_KEYS) delete env[key];
  return env;
}

function run(
  cmd: string,
  args: string[],
  opts: { env?: NodeJS.ProcessEnv } = {},
) {
  // Cuando se pasa opts.env se usa COMPLETO (permite eliminar claves como
  // DATABASE_URL); si no se pasa, se hereda process.env.
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf8",
    env: opts.env ?? { ...process.env },
  });
  if (result.status !== 0 && result.status !== 2) {
    const out = (result.stdout ?? "").split("\n").filter(Boolean).slice(-12);
    const err = (result.stderr ?? "").split("\n").filter(Boolean).slice(-8);
    if (out.length)
      process.stdout.write(`    └ salida: ${out.join(" | ").slice(0, 500)}\n`);
    if (err.length)
      process.stdout.write(`    └ stderr: ${err.join(" | ").slice(0, 300)}\n`);
  }
  return result;
}

/** Cuenta violaciones OPEN de severidad error en el CSV de auditoría dinámica. */
function countOpenErrorViolations(): number {
  const path = join(OUT_DIR, "dynamic-content-policy-audit.csv");
  if (!existsSync(path)) return -1;
  const lines = readFileSync(path, "utf8").split("\n").slice(1);
  let count = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split('","').map((s) => s.replace(/^"|"$/g, ""));
    // columnas: environment,table,record_id,field,route,violation,severity,match,before_hash,proposed_after_hash,automatic_or_manual,status
    const severity = parts[6];
    const status = parts[11];
    if (severity === "error" && status === "OPEN") count++;
  }
  return count;
}

/** Comprueba que todos los 53 casos tienen clasificación en la resolución. */
function internalLinksClassified(): { total: number; unclassified: number } {
  const path = join(OUT_DIR, "internal-link-resolution.csv");
  if (!existsSync(path)) return { total: -1, unclassified: -1 };
  const lines = readFileSync(path, "utf8")
    .split("\n")
    .slice(1)
    .filter((l) => l.trim());
  let unclassified = 0;
  for (const line of lines) {
    const parts = line.split('","').map((s) => s.replace(/^"|"$/g, ""));
    const state = parts[11];
    if (!state) unclassified++;
  }
  return { total: lines.length, unclassified };
}

function main(): void {
  const envFile = process.argv.includes("--env-file")
    ? process.argv[process.argv.indexOf("--env-file") + 1]
    : ".env.local";
  const baseUrl = process.argv.includes("--base-url")
    ? process.argv[process.argv.indexOf("--base-url") + 1]
    : "http://localhost:3100";
  const runE2e = process.argv.includes("--run-e2e");
  const runA11y = process.argv.includes("--run-a11y");
  const runLighthouse = process.argv.includes("--run-lighthouse");

  loadEnvFile(envFile);
  const inspection = inspectEnvironment();
  // Una DATABASE_URL "undefined"/placeholder/desconocida no es una DB usable.
  // Usamos connectionMode (fail-closed de environment-guard) en lugar de solo
  // comprobar la variable, para no tratar valores placeholder como DB real.
  const hasDb = inspection.connectionMode !== "none";
  const results: GateEntry[] = [];
  let failed = false;

  const record = (check: string, result: GateResult, details: string) => {
    if (result === "FAIL") failed = true;
    results.push({ check, result, details });
    console.log(
      `  ${result === "PASS" ? "✅" : result === "FAIL" ? "⛔" : "⏭"} ${check}: ${result} — ${details}`,
    );
  };

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" Gate SEO/GEO de runtime (seo:runtime-contract)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Entorno: ${describeEnvironment(inspection)}`);
  console.log(`DB local/staging: ${hasDb ? "sí" : "no"}`);
  console.log("");

  // 1. Contrato público estático (sin DB: los tests unitarios internos no
  // deben heredar una URL de staging/prod — tests/setup.ts lo exige).
  const publicContract = run("npx", ["tsx", "scripts/seo-public-contract.ts"], {
    env: withoutDbEnv(),
  });
  record(
    "seo:public-contract",
    publicContract.status === 0 ? "PASS" : "FAIL",
    publicContract.status === 0 ? "exit 0" : `exit ${publicContract.status}`,
  );

  // 2. Contenido dinámico (política)
  const dyn = run("npx", [
    "tsx",
    "scripts/audit-dynamic-content.ts",
    "--env-file",
    envFile,
  ]);
  const openViolations = countOpenErrorViolations();
  if (!hasDb) {
    record(
      "content:audit-dynamic",
      "SKIPPED_WITH_REASON",
      "sin DB local/staging (claims en DB no auditados)",
    );
  } else if (dyn.status !== 0) {
    record("content:audit-dynamic", "FAIL", `exit ${dyn.status}`);
  } else if (openViolations === -1) {
    record("content:audit-dynamic", "FAIL", "sin CSV de auditoría dinámica");
  } else if (openViolations > 0) {
    record(
      "content:audit-dynamic",
      "FAIL",
      `${openViolations} violaciones OPEN (ver dynamic-content-policy-audit.csv; patch pendiente de ejecución autorizada)`,
    );
  } else {
    record("content:audit-dynamic", "PASS", "sin violaciones OPEN");
  }

  // 3. Contrato del blog (datos dinámicos)
  const blog = run("npx", [
    "tsx",
    "scripts/audit-blog-contract.ts",
    "--env-file",
    envFile,
  ]);
  if (!hasDb) {
    record("seo:blog-contract", "SKIPPED_WITH_REASON", "sin DB local/staging");
  } else if (blog.status === 0) {
    record("seo:blog-contract", "PASS", "exit 0");
  } else if (blog.status === 2) {
    record("seo:blog-contract", "SKIPPED_WITH_REASON", "sin DB accesible");
  } else {
    record(
      "seo:blog-contract",
      "FAIL",
      `exit ${blog.status} — ver detalle arriba`,
    );
  }

  // 4. Enlazado interno (53 casos)
  const links = run("npx", [
    "tsx",
    "scripts/internal-links-patch.ts",
    "--env-file",
    envFile,
  ]);
  const classified = internalLinksClassified();
  if (!hasDb) {
    record(
      "seo:internal-links",
      "SKIPPED_WITH_REASON",
      "sin DB local/staging (clasificación contra datos reales)",
    );
  } else if (links.status !== 0) {
    record("seo:internal-links", "FAIL", `exit ${links.status}`);
  } else if (classified.total === -1) {
    record("seo:internal-links", "FAIL", "sin CSV de resolución");
  } else if (classified.unclassified > 0) {
    record(
      "seo:internal-links",
      "FAIL",
      `${classified.unclassified} caso(s) sin clasificar de ${classified.total}`,
    );
  } else {
    record(
      "seo:internal-links",
      "PASS",
      `${classified.total} casos clasificados (estado: ver internal-link-resolution.csv)`,
    );
  }

  // 5. Sitemap en runtime
  const sitemap = run("npx", [
    "tsx",
    "scripts/validate-sitemap-runtime.ts",
    "--base-url",
    baseUrl,
    "--env-file",
    envFile,
  ]);
  if (sitemap.status === 2) {
    record(
      "seo:sitemap:validate-runtime",
      "SKIPPED_WITH_REASON",
      "app no accesible en " + baseUrl,
    );
  } else if (sitemap.status === 0) {
    record("seo:sitemap:validate-runtime", "PASS", "exit 0");
  } else {
    record("seo:sitemap:validate-runtime", "FAIL", `exit ${sitemap.status}`);
  }

  // 6. JSON-LD (IDs de persona + indexabilidad estática) — sin DB.
  const jsonld = run(
    "npx",
    [
      "vitest",
      "run",
      "tests/jsonld-entity-ids.test.ts",
      "tests/seo-public-indexability.test.ts",
    ],
    { env: withoutDbEnv() },
  );
  record(
    "jsonld-entity-ids",
    jsonld.status === 0 ? "PASS" : "FAIL",
    jsonld.status === 0 ? "tests ok" : `exit ${jsonld.status}`,
  );

  // 7. E2E esenciales
  if (runE2e) {
    const e2e = run("npx", [
      "playwright",
      "test",
      "tests/e2e/seo-runtime-contract.spec.ts",
      "--config",
      "playwright.config.ts",
    ]);
    record(
      "e2e:seo-runtime-contract",
      e2e.status === 0 ? "PASS" : "FAIL",
      e2e.status === 0 ? "exit 0" : `exit ${e2e.status}`,
    );
  } else {
    record(
      "e2e:seo-runtime-contract",
      "SKIPPED_WITH_REASON",
      "requiere app corriendo; usar --run-e2e",
    );
  }

  // 8. Accesibilidad esencial (axe)
  if (runA11y) {
    const a11y = run("npx", [
      "playwright",
      "test",
      "tests/e2e/a11y-runtime-essentials.spec.ts",
      "--config",
      "playwright.config.ts",
    ]);
    record(
      "a11y:essentials",
      a11y.status === 0 ? "PASS" : "FAIL",
      a11y.status === 0 ? "exit 0" : `exit ${a11y.status}`,
    );
  } else {
    record(
      "a11y:essentials",
      "SKIPPED_WITH_REASON",
      "requiere app corriendo; usar --run-a11y",
    );
  }

  // 9. Lighthouse
  if (runLighthouse) {
    const lh = run("npx", [
      "lighthouse",
      `${baseUrl}/`,
      "--output",
      "json",
      "--output-path",
      "test-results/lighthouse-home.json",
      "--quiet",
      "--chrome-flags=--headless",
    ]);
    record(
      "lighthouse:home",
      lh.status === 0 ? "PASS" : "FAIL",
      lh.status === 0 ? "exit 0" : `exit ${lh.status}`,
    );
  } else {
    record(
      "lighthouse",
      "SKIPPED_WITH_REASON",
      "requiere app corriendo; usar --run-lighthouse",
    );
  }

  // ── Resumen ─────────────────────────────────────────────────────────────
  const passCount = results.filter((r) => r.result === "PASS").length;
  const failCount = results.filter((r) => r.result === "FAIL").length;
  const skipCount = results.filter(
    (r) => r.result === "SKIPPED_WITH_REASON",
  ).length;
  console.log("");
  console.log(
    `Resumen: ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIPPED_WITH_REASON`,
  );
  if (failed) {
    console.log("⛔ SEO/GEO RUNTIME CONTRACT: FAIL");
    process.exit(1);
  }
  console.log("✅ SEO/GEO RUNTIME CONTRACT: PASS (con SKIPPED explícitos)");
}

const isEntry =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
  main();
}
