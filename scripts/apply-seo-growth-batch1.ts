/**
 * Aplicador transaccional del lote SEO 1 (metadata de blog_posts).
 *
 * Lee `docs/seo/growth/batch-1-approved-patch.json` (13 entradas aprobadas por
 * revisión editorial) y aplica SOLO las columnas permitidas:
 *   title | metaTitle | metaDescription
 *
 * Características (PROMPT §9-§12):
 *   - Dry-run por defecto.
 *   - Guardia de entorno: staging/producción detectados por endpoint Neon.
 *     Producción SOLO con --env production Y ALLOW_PRODUCTION_SEO_BATCH1=true.
 *   - Precondición por fila: valores DB actuales == `before` capturado; si no,
 *     ABORTA todo el lote (exit 1) sin escribir nada.
 *   - Transacción por entrada + backup previo a cualquier escritura.
 *   - Idempotente: si current == after, no-op.
 *   - Rollback desde el backup.
 *   - Verificación post-aplicación (exit no-cero en divergencia).
 *   - Log de auditoría en .secrets/backups/ (sin secretos).
 *   - Nunca imprime DATABASE_URL ni secretos.
 *
 * Uso:
 *   npx tsx scripts/apply-seo-growth-batch1.ts --env-file .env.e2e.local \
 *       --env staging --mode dry-run
 *   npx tsx scripts/apply-seo-growth-batch1.ts --env-file .env.e2e.local \
 *       --env staging --mode capture
 *   npx tsx scripts/apply-seo-growth-batch1.ts --env-file .env.e2e.local \
 *       --env staging --mode apply
 *   npx tsx scripts/apply-seo-growth-batch1.ts --env-file .env.e2e.local \
 *       --env staging --mode verify
 *   npx tsx scripts/apply-seo-growth-batch1.ts --env-file .env.e2e.local \
 *       --env staging --mode rollback --backup <timestamp>
 *   # Producción (autorización explícita):
 *   $env:ALLOW_PRODUCTION_SEO_BATCH1='true'; npx tsx scripts/apply-seo-growth-batch1.ts \
 *       --env-file .env --env production --mode capture
 */
import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import { blogPosts } from "../lib/schema";
import {
  loadEnvFile,
  inspectEnvironment,
  describeEnvironment,
  type EnvKind,
} from "./lib/environment-guard";
import { scanContentPolicyViolations } from "../lib/content-policy";
import { META_TITLE_MAX } from "../lib/seo";
import { canonicalOrigin } from "./seo-data-config.mjs";

const ROOT = process.cwd();
const BACKUP_DIR = resolve(ROOT, ".secrets/backups");

/** Número de lote activo (se fija en main desde --batch). */
let BATCH_NUM = 1;
function approvedJsonPath(): string {
  return resolve(
    ROOT,
    "docs/seo/growth",
    `batch-${BATCH_NUM}-approved-patch.json`,
  );
}
function batchPrefix(): string {
  return `seo-growth-batch${BATCH_NUM}`;
}

export const ALLOWED_COLUMNS: ReadonlySet<string> = new Set([
  "title",
  "metaTitle",
  "metaDescription",
]);
/**
 * Host canónico derivado de NEXT_PUBLIC_SITE_URL (.env.example) vía
 * seo-data-config. NUNCA se hardcodea el dominio (evita reintroducir la
 * variante sin la "da" de "asociados").
 */
export const CANONICAL_HOST: string = (() => {
  const origin = canonicalOrigin();
  if (!origin)
    throw new Error(
      "[batch1] No se pudo derivar el origen canónico desde .env.example",
    );
  return new URL(origin).host;
})();
export const META_DESC_MAX = 170;

type Mode = "dry-run" | "capture" | "apply" | "verify" | "rollback";
type DeclaredEnv = "local" | "staging" | "production";

interface RowState {
  title: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string | null;
}

export interface PatchEntry {
  url: string;
  slug: string;
  category: string;
  status: string;
  before: RowState | null;
  after: Record<string, string>;
  contentHash: string;
  rowVersion: number;
}

interface BackupFile {
  timestamp: string;
  env: string;
  entries: Array<{
    slug: string;
    before: RowState;
    after: Record<string, string>;
  }>;
}

// ───────────────────────────── CLI ─────────────────────────────────────────
export function parseArgs(argv: string[]) {
  const get = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
  };
  const mode = (get("--mode") ?? "dry-run") as Mode;
  const env = (get("--env") ?? "staging") as DeclaredEnv;
  const envFile = get("--env-file");
  const backup = get("--backup");
  const batch = Number(get("--batch") ?? 1);
  if (!Number.isInteger(batch) || batch < 1)
    throw new Error(`[batch1] --batch inválido: ${batch}`);
  const only: string[] = [];
  for (let i = 0; i < argv.length - 1; i++) {
    if (argv[i] === "--only" && argv[i + 1]) only.push(argv[i + 1]);
  }
  if (!["dry-run", "capture", "apply", "verify", "rollback"].includes(mode)) {
    throw new Error(`[batch1] --mode inválido: ${mode}`);
  }
  if (!["local", "staging", "production"].includes(env)) {
    throw new Error(`[batch1] --env inválido: ${env}`);
  }
  return { mode, env, envFile, backup, only, batch };
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Guardia de entorno para operaciones de ESCRITURA (capture/apply/rollback).
 * Lógica pura y testeable. Devuelve void si está permitido; lanza si no.
 */
export function assertWriteAllowed(
  detected: EnvKind,
  declaredEnv: DeclaredEnv,
  envVars: Record<string, string | undefined> = process.env,
): void {
  if (declaredEnv !== detected) {
    throw new Error(
      `[batch1] Entorno declarado (${declaredEnv}) no coincide con el detectado (${detected}). Abortando.`,
    );
  }
  if (detected === "production") {
    if (envVars.ALLOW_PRODUCTION_SEO_BATCH1 !== "true") {
      throw new Error(
        "[batch1] Producción requiere ALLOW_PRODUCTION_SEO_BATCH1=true (autorización explícita). Abortando.",
      );
    }
    return;
  }
  if (detected === "staging") {
    if (envVars.ALLOW_STAGING_MIGRATIONS !== "true") {
      throw new Error(
        "[batch1] Escritura en staging requiere ALLOW_STAGING_MIGRATIONS=true. Abortando.",
      );
    }
    return;
  }
  if (detected === "local") {
    // Local: permitido para pruebas de ciclo (siempre que se declare local).
    return;
  }
  throw new Error(`[batch1] Entorno no permitido para escritura: ${detected}`);
}

function audit(env: string, event: Record<string, unknown>): void {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const file = join(BACKUP_DIR, `${batchPrefix()}-audit-${env}.jsonl`);
  appendFileSync(
    file,
    JSON.stringify({
      ts: new Date().toISOString(),
      batch: BATCH_NUM,
      ...event,
    }) + "\n",
    "utf8",
  );
}

function backupPath(env: string, timestamp: string): string {
  return join(BACKUP_DIR, `${batchPrefix()}-${env}-${timestamp}.json`);
}

export function assertCanonicalUrl(url: string): void {
  if (!url.startsWith(`https://${CANONICAL_HOST}/blog/`)) {
    throw new Error(`[batch1] URL no canónica en el patch: ${url}`);
  }
}

export function assertNoProhibitedCopy(
  slug: string,
  field: string,
  text: string,
): void {
  const errors = scanContentPolicyViolations(text).filter(
    (v) => v.severity === "error",
  );
  if (errors.length > 0) {
    throw new Error(
      `[batch1] Copy prohibido en ${slug}.${field}: ${errors.map((e) => e.code).join(",")}`,
    );
  }
  if (
    /\bResuelve\b/i.test(text) ||
    /pasos concretos, requisitos y fuentes oficiales/i.test(text)
  ) {
    throw new Error(`[batch1] Lenguaje de plantilla en ${slug}.${field}`);
  }
  // Años: se rechazan los que no sean el año vigente (mantenimiento anual
  // comprobado, p. ej. "Pensión Alimenticia ... 2026").
  const currentYear = new Date().getFullYear();
  const years = text.match(/\b20\d{2}\b/g) ?? [];
  const invalid = years.filter((y) => Number(y) !== currentYear);
  if (invalid.length > 0) {
    throw new Error(
      `[batch1] Año no verificado en ${slug}.${field}: ${[...new Set(invalid)].join(",")}`,
    );
  }
}

export function validatePatch(patch: PatchEntry[]): void {
  const slugs = new Set<string>();
  for (const e of patch) {
    if (e.status !== "APPROVED") continue;
    assertCanonicalUrl(e.url);
    if (slugs.has(e.slug))
      throw new Error(`[batch1] Slug duplicado en patch: ${e.slug}`);
    slugs.add(e.slug);
    for (const key of Object.keys(e.after)) {
      if (!ALLOWED_COLUMNS.has(key)) {
        throw new Error(`[batch1] Columna no permitida en ${e.slug}: ${key}`);
      }
    }
    if (!e.after.title && !e.after.metaTitle && !e.after.metaDescription) {
      throw new Error(`[batch1] Entrada sin cambios: ${e.slug}`);
    }
    const metaTitle = e.after.metaTitle ?? "";
    const metaDesc = e.after.metaDescription ?? "";
    if (metaTitle.length > META_TITLE_MAX) {
      throw new Error(
        `[batch1] metaTitle excede ${META_TITLE_MAX}: ${e.slug} (${metaTitle.length})`,
      );
    }
    if (metaDesc.length > META_DESC_MAX) {
      throw new Error(
        `[batch1] metaDescription excede ${META_DESC_MAX}: ${e.slug} (${metaDesc.length})`,
      );
    }
    assertNoProhibitedCopy(e.slug, "title", e.after.title ?? "");
    assertNoProhibitedCopy(e.slug, "metaTitle", metaTitle);
    assertNoProhibitedCopy(e.slug, "metaDescription", metaDesc);
    const expectedHash = sha256(JSON.stringify(e.after));
    if (e.contentHash !== expectedHash) {
      throw new Error(
        `[batch1] contentHash no coincide en ${e.slug}: el JSON fue editado sin regenerar`,
      );
    }
  }
}

export async function readRow(
  db: ReturnType<typeof drizzle>,
  slug: string,
): Promise<RowState | null> {
  const rows = await db
    .select({
      title: blogPosts.title,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    title: r.title,
    metaTitle: r.metaTitle,
    metaDescription: r.metaDescription,
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
  };
}

export function sameState(a: RowState | null, b: RowState | null): boolean {
  if (!a || !b) return a === b;
  return (
    (a.title ?? "") === (b.title ?? "") &&
    (a.metaTitle ?? "") === (b.metaTitle ?? "") &&
    (a.metaDescription ?? "") === (b.metaDescription ?? "")
  );
}

export function buildUpdate(
  row: RowState,
  after: RowState | Record<string, string | null | undefined>,
) {
  const update: Record<string, string> = {};
  for (const col of ["title", "metaTitle", "metaDescription"] as const) {
    const target = after[col];
    if (target === undefined || target === null) continue;
    const current = row[col] ?? "";
    if (current !== target) update[col] = target;
  }
  return update;
}

// ───────────────────────────── MAIN ────────────────────────────────────────
async function main(): Promise<void> {
  const { mode, env, envFile, backup, only, batch } = parseArgs(
    process.argv.slice(2),
  );
  BATCH_NUM = batch;

  if (envFile) loadEnvFile(envFile);
  const inspection = inspectEnvironment();
  console.log(
    `[batch1] modo=${mode} env_declarado=${env} | ${describeEnvironment(inspection)}`,
  );

  if (!process.env.DATABASE_URL) {
    throw new Error(
      `[batch1] Falta DATABASE_URL. ¿--env-file correcto? (${envFile ?? "ninguno"})`,
    );
  }

  const isWriteMode =
    mode === "apply" || mode === "rollback" || mode === "capture";
  if (isWriteMode) {
    assertWriteAllowed(inspection.kind, env, process.env);
  }

  const raw = JSON.parse(readFileSync(approvedJsonPath(), "utf8")) as {
    applyPolicy: { columns: string[] };
    patch: PatchEntry[];
  };
  if (raw.applyPolicy.columns.some((c) => !ALLOWED_COLUMNS.has(c))) {
    throw new Error(
      `[batch1] applyPolicy.columns contiene columnas no permitidas`,
    );
  }
  const patchAll = raw.patch.filter((e) => e.status === "APPROVED");
  if (patchAll.length === 0)
    throw new Error("[batch1] No hay entradas APPROVED en el patch");
  let patch = patchAll;
  if (only.length > 0) {
    const allSlugs = new Set(patchAll.map((e) => e.slug));
    const unknown = only.filter((s) => !allSlugs.has(s));
    if (unknown.length > 0) {
      throw new Error(
        `[batch1] --only con slug(s) no presentes en el patch: ${unknown.join(", ")}`,
      );
    }
    patch = patchAll.filter((e) => only.includes(e.slug));
    console.log(`[batch1] filtro --only: ${patch.length} entradas`);
  }
  validatePatch(patch);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  const dbLabel = inspection.kind;

  // ── dry-run ────────────────────────────────────────────────────────────
  if (mode === "dry-run") {
    let changes = 0;
    let noops = 0;
    for (const e of patch) {
      const current = await readRow(db, e.slug);
      if (!current) {
        console.log(`  [MISSING] ${e.slug} (fila no encontrada)`);
        continue;
      }
      const update = buildUpdate(current, e.after);
      const hasBefore = e.before !== null;
      const beforeOk = hasBefore ? sameState(current, e.before) : null;
      if (Object.keys(update).length === 0) {
        noops++;
        console.log(`  [NOOP] ${e.slug} (ya aplicado)`);
      } else {
        changes++;
        console.log(
          `  [CHANGE] ${e.slug} → ${Object.keys(update).join(",")} ` +
            `| before_match=${beforeOk === null ? "no-capturado" : beforeOk ? "ok" : "MISMATCH"}`,
        );
      }
    }
    console.log(
      `[batch1] dry-run: ${changes} cambios, ${noops} no-op. Sin escrituras.`,
    );
    await pool.end();
    return;
  }

  // ── capture ────────────────────────────────────────────────────────────
  if (mode === "capture") {
    const beforeMap: Record<string, RowState> = {};
    let missing = 0;
    for (const e of patch) {
      const current = await readRow(db, e.slug);
      if (!current) {
        missing++;
        console.log(`  [MISSING] ${e.slug} (fila no encontrada)`);
        continue;
      }
      beforeMap[e.slug] = current;
    }
    if (missing > 0) {
      console.error(
        `[batch1] capture abortado: ${missing} fila(s) ausente(s) en la DB.`,
      );
      await pool.end();
      process.exitCode = 1;
      return;
    }
    const updated = {
      ...raw,
      patch: raw.patch.map((e) =>
        e.status === "APPROVED" && beforeMap[e.slug]
          ? {
              ...e,
              before: beforeMap[e.slug],
              rowVersion: (e.rowVersion ?? 1) + 1,
            }
          : e,
      ),
    };
    writeFileSync(
      approvedJsonPath(),
      JSON.stringify(updated, null, 2) + "\n",
      "utf8",
    );
    audit(dbLabel, { mode, env, captured: patch.length, missing });
    console.log(
      `[batch1] capture: ${patch.length} antes capturados → ${approvedJsonPath()}`,
    );
    await pool.end();
    return;
  }

  // ── apply ──────────────────────────────────────────────────────────────
  if (mode === "apply") {
    const missingBefore = patch.filter((e) => e.before === null);
    if (missingBefore.length > 0) {
      throw new Error(
        `[batch1] Falta before capturado (ejecuta --mode capture) para: ` +
          missingBefore.map((e) => e.slug).join(", "),
      );
    }

    // Precondición global: cada fila debe estar en estado `before` (pendiente)
    // o ya en estado `after` (idempotente). Cualquier otra divergencia ABORTA
    // todo el lote sin escribir nada.
    const mismatches: string[] = [];
    const rowMap: Record<string, RowState> = {};
    for (const e of patch) {
      const current = await readRow(db, e.slug);
      if (!current) {
        mismatches.push(`${e.slug}: fila no encontrada`);
        continue;
      }
      rowMap[e.slug] = current;
      const alreadyApplied =
        Object.keys(buildUpdate(current, e.after)).length === 0;
      if (!sameState(current, e.before) && !alreadyApplied) {
        mismatches.push(
          `${e.slug}: valores actuales != before capturado ni after (divergencia)`,
        );
      }
    }
    if (mismatches.length > 0) {
      console.error(
        `[batch1] PRECONDICIÓN FALLIDA (${mismatches.length}):\n- ${mismatches.join("\n- ")}`,
      );
      console.error(
        "[batch1] Sin escrituras. Re-ejecuta --mode capture si los datos cambiaron.",
      );
      await pool.end();
      process.exitCode = 1;
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = backupPath(dbLabel, timestamp);
    const backupData: BackupFile = {
      timestamp,
      env: dbLabel,
      entries: patch.map((e) => ({
        slug: e.slug,
        before: rowMap[e.slug],
        after: e.after,
      })),
    };
    mkdirSync(dirname(backupFile), { recursive: true });
    writeFileSync(
      backupFile,
      JSON.stringify(backupData, null, 2) + "\n",
      "utf8",
    );
    console.log(`[batch1] backup → ${backupFile}`);

    let applied = 0;
    let noops = 0;
    for (const e of patch) {
      const current = rowMap[e.slug];
      const update = buildUpdate(current, e.after);
      if (Object.keys(update).length === 0) {
        noops++;
        console.log(`  [NOOP] ${e.slug}`);
        continue;
      }
      await db.transaction(async (tx) => {
        await tx
          .update(blogPosts)
          .set(update)
          .where(eq(blogPosts.slug, e.slug));
      });
      applied++;
      console.log(`  [APPLIED] ${e.slug} → ${Object.keys(update).join(",")}`);
    }
    audit(dbLabel, {
      mode,
      env,
      applied,
      noops,
      backup: backupFile,
      timestamp,
    });
    console.log(
      `[batch1] apply: ${applied} aplicadas, ${noops} no-op. Backup: ${backupFile}`,
    );
    await pool.end();
    return;
  }

  // ── verify ─────────────────────────────────────────────────────────────
  if (mode === "verify") {
    const divergences: string[] = [];
    for (const e of patch) {
      const current = await readRow(db, e.slug);
      if (!current) {
        divergences.push(`${e.slug}: fila no encontrada`);
        continue;
      }
      const fields: string[] = [];
      for (const col of ["title", "metaTitle", "metaDescription"] as const) {
        const target = e.after[col];
        if (target === undefined) continue;
        if ((current[col] ?? "") !== target) fields.push(col);
      }
      if (fields.length > 0) {
        divergences.push(`${e.slug}: divergencia en ${fields.join(",")}`);
      } else {
        console.log(`  [OK] ${e.slug}`);
      }
    }
    if (divergences.length > 0) {
      console.error(
        `[batch1] VERIFY: ${divergences.length} divergencia(s):\n- ${divergences.join("\n- ")}`,
      );
      audit(dbLabel, {
        mode,
        env,
        ok: patch.length - divergences.length,
        divergences: divergences.length,
      });
      await pool.end();
      process.exitCode = 1;
      return;
    }
    audit(dbLabel, { mode, env, ok: patch.length, divergences: 0 });
    console.log(
      `[batch1] verify: ${patch.length} entradas coherentes con after.`,
    );
    await pool.end();
    return;
  }

  // ── rollback ───────────────────────────────────────────────────────────
  if (mode === "rollback") {
    if (!backup)
      throw new Error("[batch1] rollback requiere --backup <timestamp>");
    const file = backupPath(dbLabel, backup);
    if (!existsSync(file))
      throw new Error(`[batch1] No existe backup: ${file}`);
    let data = JSON.parse(readFileSync(file, "utf8")) as BackupFile;
    if (only.length > 0) {
      data = {
        ...data,
        entries: data.entries.filter((e) => only.includes(e.slug)),
      };
    }

    const currentMap: Record<string, RowState> = {};
    for (const entry of data.entries) {
      const current = await readRow(db, entry.slug);
      if (!current) {
        console.error(
          `[batch1] rollback: fila no encontrada para ${entry.slug}`,
        );
        process.exitCode = 1;
        await pool.end();
        return;
      }
      currentMap[entry.slug] = current;
    }

    let restored = 0;
    for (const entry of data.entries) {
      const current = currentMap[entry.slug];
      const update = buildUpdate(current, entry.before);
      if (Object.keys(update).length === 0) {
        console.log(`  [NOOP] ${entry.slug} (ya restaurado)`);
        continue;
      }
      await db.transaction(async (tx) => {
        await tx
          .update(blogPosts)
          .set(update)
          .where(eq(blogPosts.slug, entry.slug));
      });
      restored++;
      console.log(`  [RESTORED] ${entry.slug}`);
    }
    audit(dbLabel, { mode, env, restored, backup: file });
    console.log(`[batch1] rollback: ${restored} restauradas desde ${file}`);
    await pool.end();
    return;
  }

  throw new Error(`[batch1] modo no soportado: ${mode}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err) => {
    console.error((err as Error).message);
    process.exit(1);
  });
}
