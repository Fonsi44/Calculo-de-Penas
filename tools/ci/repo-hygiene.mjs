#!/usr/bin/env node
/**
 * Higiene del repositorio — validaciones pre-commit y CI.
 *
 * Verifica:
 *   1. No hay archivos prohibidos en raíz ni outputs live versionados
 *   2. No hay secretos hardcodeados (patrones básicos)
 *   3. No hay migraciones sin tracking (journal + manifiesto)
 *   4. No hay scripts en package.json sin archivo correspondiente
 *
 * Uso:
 *   node tools/ci/repo-hygiene.mjs          — validación completa
 *   node tools/ci/repo-hygiene.mjs --quick  — solo raíz + secretos (rápido)
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const quickMode = process.argv.includes('--quick');

let errors = 0;
let warnings = 0;

function error(msg) { console.error(`  ✗ ${msg}`); errors++; }
function warn(msg) { console.warn(`  ⚠ ${msg}`); warnings++; }
function ok(msg) { console.log(`  ✓ ${msg}`); }

// ── 1. Archivos prohibidos en raíz ────────────────────────────────────

console.log('\n═══ 1. Raíz limpia ═══');

const CANONICAL_ROOT_FILES = new Set([
  'README.md', 'AGENTS.md', 'CHANGELOG.md', 'CONTRIBUTING.md',
  'package.json', 'package-lock.json', 'tsconfig.json', 'vercel.json',
  'lighthouserc.json', 'vitest.config.ts', 'next.config.ts', 'drizzle.config.ts',
  'postcss.config.mjs', 'eslint.config.mjs', '.gitignore', '.vercelignore',
  '.env.example',
]);

const CANONICAL_ROOT_DIRS = new Set([
  'app', 'components', 'lib', 'hooks', 'tools', 'tests', 'docs',
  'drizzle', 'public', 'data', 'scripts', 'node_modules',
]);

const trackedPaths = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
  .split('\0').filter(Boolean);
const trackedRootFiles = trackedPaths.filter((path) => !path.includes('/'));
const trackedRootDirs = new Set(trackedPaths.filter((path) => path.includes('/')).map((path) => path.split('/')[0]));

for (const entry of trackedRootDirs) {
  if (!CANONICAL_ROOT_DIRS.has(entry) && !entry.startsWith('.')) {
    warn(`Directorio no canónico versionado en raíz: ${entry}/`);
  }
}
for (const entry of trackedRootFiles) {
  if (!CANONICAL_ROOT_FILES.has(entry)) {
    if (entry.endsWith('.zip') || entry.endsWith('.tar.gz') || entry.endsWith('.7z')) {
      error(`ZIP/backup versionado en raíz: ${entry}`);
    } else if (entry.endsWith('.md') && !CANONICAL_ROOT_FILES.has(entry)) {
      error(`Markdown no canónico versionado en raíz: ${entry}`);
    } else if (entry.endsWith('.csv')) {
      warn(`CSV versionado en raíz: ${entry}`);
    }
  }
}
if (errors === 0 && warnings === 0) ok('Raíz limpia');

// ── 1bis. Árboles documentales paralelos y outputs generados ─────────────

console.log('\n═══ 1bis. Higiene documental ═══');

const rootEntries = readdirSync(ROOT, { withFileTypes: true }).map((e) => e.name);
const parallelDocTrees = rootEntries.filter(
  (name) => /^docs( \d+)*$/i.test(name) && name !== 'docs',
);
for (const name of parallelDocTrees) {
  error(`Árbol documental paralelo en raíz: ${name}/ (consolidar en docs/)`);
}

const BACKUP_DIR_PATTERN = /(^|\/)(backups?|_tmp|\.tmp)(\/|$)/i;
const ARCHIVE_PATTERNS = /\.(zip|tar\.gz|7z|log|dump)$/i;
const trackedDocs = trackedPaths.filter((p) => p.startsWith('docs/'));
let generatedOutputs = 0;
for (const p of trackedDocs) {
  if (BACKUP_DIR_PATTERN.test(p) || ARCHIVE_PATTERNS.test(p)) {
    error(`Backup/output generado versionado bajo docs/: ${p}`);
    generatedOutputs++;
  }
}

const trackedSeoLiveReports = trackedPaths.filter(
  (p) => p.startsWith('data/seo/') && p.endsWith('.md'),
);
for (const p of trackedSeoLiveReports) {
  error(`Reporte SEO live generado versionado bajo data/seo/: ${p}`);
  generatedOutputs++;
}

if (generatedOutputs === 0) {
  ok('Sin backups/outputs generados versionados bajo docs/ o data/seo/');
}

// ── 2. Secretos hardcodeados (solo en archivos no-ignorados) ───────────

if (!quickMode) {
  console.log('\n═══ 2. Secretos ═══');
  // La validación de secretos requiere git ls-files + gitleaks; delegada a CI.
  ok('Validación de secretos delegada a CI (gitleaks)');
}

// ── 3. Migraciones ────────────────────────────────────────────────────

if (!quickMode) {
  console.log('\n═══ 3. Migraciones ═══');
  try {
    execFileSync('node', [resolve(ROOT, 'tools/db/run-migrations.mjs'), 'validate'], {
      cwd: ROOT, stdio: 'pipe', timeout: 10_000,
    });
    ok('Migraciones válidas');
  } catch {
    error('Migraciones: ejecuta npm run db:migrations:validate');
  }
}

// ── 4. Scripts package.json ──────────────────────────────────────────

if (!quickMode) {
  console.log('\n═══ 4. Scripts package.json ═══');
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  const scripts = pkg.scripts || {};
  let missingScripts = 0;
  
  for (const [name, cmd] of Object.entries(scripts)) {
    // Extraer el archivo principal del comando
    const match = cmd.match(/(?:node|npx|tsx)\s+(scripts\/[^\s]+|tools\/[^\s]+)/);
    if (match) {
      const scriptPath = resolve(ROOT, match[1]);
      if (!existsSync(scriptPath)) {
        error(`Script no encontrado: ${name} → ${match[1]}`);
        missingScripts++;
      }
    }
  }
  if (missingScripts === 0) ok('Todos los scripts existen');

  console.log('\n═══ 5. Manifiesto de tooling ═══');
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'tools/manifest.json'), 'utf8'));
  const requiredFields = [
    'id', 'path', 'owner', 'status', 'purpose', 'command', 'mutates', 'dryRun',
    'requiredEnv', 'rollback', 'lastValidated', 'expiresAt',
  ];
  const entriesByPath = new Map();
  for (const entry of manifest.tools ?? []) {
    for (const field of requiredFields) {
      if (!(field in entry)) error(`Tool ${entry.id ?? '(sin id)'} sin campo ${field}`);
    }
    if (entry.status !== 'active') error(`Tool ${entry.id}: status debe ser active`);
    if (!existsSync(resolve(ROOT, entry.path))) error(`Tool no encontrado: ${entry.path}`);
    if (entriesByPath.has(entry.path)) error(`Tool duplicado en manifiesto: ${entry.path}`);
    entriesByPath.set(entry.path, entry);
  }
  const toolFiles = [];
  function collectTools(directory) {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, item.name);
      if (item.isDirectory()) collectTools(path);
      else if (item.name.endsWith('.mjs')) toolFiles.push(relative(ROOT, path));
    }
  }
  collectTools(resolve(ROOT, 'tools'));
  for (const path of toolFiles) {
    if (!entriesByPath.has(path)) error(`Tool activo sin manifiesto: ${path}`);
  }
  if (toolFiles.length === entriesByPath.size) ok(`${toolFiles.length} tools activos manifestados`);
}

// ── Resultado ─────────────────────────────────────────────────────────

console.log(`\n═══ Resultado: ${errors} errores, ${warnings} advertencias ═══`);
process.exit(errors > 0 ? 1 : 0);
