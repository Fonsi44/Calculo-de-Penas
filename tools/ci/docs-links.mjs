#!/usr/bin/env node
/**
 * Validación de documentación — enlaces locales, frontmatter y referencias.
 *
 * Cobertura:
 *  1. Enlaces Markdown `[x](target)` de TODOS los `.md` de `docs/` y de los
 *     canónicos de raíz (resuelve relativo al archivo y, en fallo, relativo a
 *     la raíz del repositorio).
 *  2. Referencias entre backticks a rutas `docs/...` de los documentos vivos
 *     (no se aplica a auditorías históricas/archivadas).
 *  3. Frontmatter YAML canónico obligatorio en documentos vivos (raíz,
 *     directorios de documentación viva y archivos vivos explícitos).
 *
 * Los archivos históricos (`audits/archive/`, `audits/fase*-`, `handoffs/`,
 * `changelog/`, `design/`, `seo/fase-*`, `seo/growth/`, `seo/implementation/`,
 * `seo/review-packets/`, `strategy/`) se excluyen de la exigencia de
 * frontmatter y de la comprobación de backticks, porque son evidencia de
 * ejecuciones pasadas (no se reescriben). Sus enlaces Markdown sí se validan.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUBLIC_ROOT_DOCS = ['README.md', 'AGENTS.md', 'CHANGELOG.md', 'CONTRIBUTING.md'];
const LIVE_ROOT_FILES = existsSync(resolve(ROOT, 'docs'))
  ? [...PUBLIC_ROOT_DOCS, 'docs/README.md']
  : PUBLIC_ROOT_DOCS;
const FRONTMATTER_DIRS = [
  'docs/adr',
  'docs/architecture',
  'docs/operations',
  'docs/security',
  'docs/standards',
  'docs/seo/current',
  'docs/audits/current',
  'docs/seo/decisions',
  'docs/changelog',
  'docs/roadmaps/active',
  'docs/roadmaps/completed',
];
const LIVE_FILES_EXTRA = [
  'docs/analytics/configuracion-y-validacion.md',
  'docs/seo/auth-cli.md',
  'docs/seo/bing-webmaster-oauth.md',
  'docs/seo/estrategia-derecho-penal.md',
  'docs/seo/live-data-access.md',
  'docs/seo/mcp-seo-connectors.md',
  'docs/seo-monthly-ops.md',
  'docs/email-resend-operacion.md',
  'docs/analytics-events.md',
  'docs/indexacion-plan-decision.md',
];
const REQUIRED_FRONTMATTER = [
  'status', 'owner', 'created', 'last_reviewed', 'review_due', 'supersedes', 'superseded_by',
];
const GLOB_CHARS = /[*{}\[\]]/;

function markdownFiles(directory) {
  if (!existsSync(resolve(ROOT, directory))) return [];
  return readdirSync(resolve(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
  });
}

const allDocs = markdownFiles('docs');
const files = [...LIVE_ROOT_FILES, ...allDocs].sort();
const liveSet = new Set([
  ...LIVE_ROOT_FILES,
  ...FRONTMATTER_DIRS.flatMap(markdownFiles),
  ...LIVE_FILES_EXTRA,
]);

const failures = [];
const linkPattern = /\[[^\]]*]\(([^)]+)\)/g;
const backtickPattern = /`([^`]+)`/g;
const BACKTICK_EXT = /\.(md|json|csv|ts|tsx|mjs|js|sql|txt|pdf|png|jpe?g|webp)$/;

function exists(target) {
  return existsSync(resolve(ROOT, target));
}

for (const file of files) {
  const filePath = resolve(ROOT, file);
  if (!existsSync(filePath)) continue;
  const source = readFileSync(filePath, 'utf8');

  if (file.startsWith('docs/') && liveSet.has(file)) {
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatter) {
      failures.push(`${file}: falta frontmatter`);
    } else {
      for (const field of REQUIRED_FRONTMATTER) {
        if (!new RegExp(`^${field}:`, 'm').test(frontmatter[1])) {
          failures.push(`${file}: falta campo de frontmatter ${field}`);
        }
      }
    }
  }

  for (const match of source.matchAll(linkPattern)) {
    let target = match[1].trim().replace(/^<|>$/g, '');
    if (!target || /^(?:https?:|mailto:|tel:|file:|#|\/)/.test(target)) continue;
    const bare = target.split('#')[0].split('?')[0];
    if (!bare || GLOB_CHARS.test(bare)) continue;
    try {
      target = decodeURIComponent(bare);
    } catch {
      failures.push(`${file}: enlace con codificación inválida: ${match[1]}`);
      continue;
    }
    const relativeTarget = resolve(ROOT, dirname(file), target);
    const rootTarget = resolve(ROOT, target);
    if (!existsSync(relativeTarget) && !existsSync(rootTarget)) {
      failures.push(`${file}: ${match[1]} → ${relative(ROOT, relativeTarget)}`);
    }
  }

  if (liveSet.has(file)) {
    for (const match of source.matchAll(backtickPattern)) {
      const token = match[1].trim();
      const bare = token.split('#')[0].split('?')[0].trim();
      if (!bare.startsWith('docs/') || GLOB_CHARS.test(bare) || !BACKTICK_EXT.test(bare)) continue;
      if (!exists(bare) && !exists(resolve(ROOT, dirname(file), bare))) {
        failures.push(`${file}: referencia entre backticks inexistente: ${token}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Documentación viva: ${failures.length} problema(s)`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exit(1);
}

console.log(`Documentación viva: ${files.length} archivos, 0 enlaces/backticks/metadatos rotos`);
