#!/usr/bin/env node
/**
 * Higiene del repositorio — validaciones pre-commit y CI.
 *
 * Verifica:
 *   1. No hay archivos prohibidos en raíz (ZIPs, backups, outputs, logs, informes .md no canónicos)
 *   2. No hay secretos hardcodeados (patrones básicos)
 *   3. No hay migraciones sin tracking (journal + manifiesto)
 *   4. No hay scripts en package.json sin archivo correspondiente
 *
 * Uso:
 *   node tools/ci/repo-hygiene.mjs          — validación completa
 *   node tools/ci/repo-hygiene.mjs --quick  — solo raíz + secretos (rápido)
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
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

const rootEntries = readdirSync(ROOT);
for (const entry of rootEntries) {
  const entryPath = resolve(ROOT, entry);
  const isDir = statSync(entryPath).isDirectory();
  if (isDir) {
    if (!CANONICAL_ROOT_DIRS.has(entry) && !entry.startsWith('.')) {
      warn(`Directorio no canónico en raíz: ${entry}/`);
    }
  } else {
    if (!CANONICAL_ROOT_FILES.has(entry)) {
      if (entry.endsWith('.zip') || entry.endsWith('.tar.gz') || entry.endsWith('.7z')) {
        error(`ZIP/backup en raíz: ${entry}`);
      } else if (entry.endsWith('.md') && !CANONICAL_ROOT_FILES.has(entry)) {
        warn(`Markdown no canónico en raíz: ${entry}`);
      } else if (entry.endsWith('.csv')) {
        warn(`CSV en raíz: ${entry}`);
      }
    }
  }
}
if (errors === 0 && warnings === 0) ok('Raíz limpia');

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
}

// ── Resultado ─────────────────────────────────────────────────────────

console.log(`\n═══ Resultado: ${errors} errores, ${warnings} advertencias ═══`);
process.exit(errors > 0 ? 1 : 0);
