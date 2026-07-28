#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIVE_ROOT_FILES = ['README.md', 'AGENTS.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'docs/README.md'];
const LIVE_DOC_DIRS = [
  'docs/adr',
  'docs/architecture',
  'docs/operations',
  'docs/ops',
  'docs/security',
  'docs/standards',
];

function markdownFiles(directory) {
  if (!existsSync(resolve(ROOT, directory))) return [];
  return readdirSync(resolve(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
  });
}

const files = [...LIVE_ROOT_FILES, ...LIVE_DOC_DIRS.flatMap(markdownFiles)].sort();
const failures = [];
const linkPattern = /\[[^\]]*]\(([^)]+)\)/g;
const REQUIRED_FRONTMATTER = [
  'status', 'owner', 'created', 'last_reviewed', 'review_due', 'supersedes', 'superseded_by',
];

for (const file of files) {
  const source = readFileSync(resolve(ROOT, file), 'utf8');
  if (file.startsWith('docs/')) {
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
    let target = match[1].trim().replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^(?:https?:|mailto:|tel:|#|\/)/.test(target)) continue;
    try {
      target = decodeURIComponent(target);
    } catch {
      failures.push(`${file}: enlace con codificación inválida: ${match[1]}`);
      continue;
    }
    const absoluteTarget = resolve(ROOT, dirname(file), target);
    if (!existsSync(absoluteTarget)) {
      failures.push(`${file}: ${match[1]} → ${relative(ROOT, absoluteTarget)}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Documentación viva: ${failures.length} enlace(s) local(es) roto(s)`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exit(1);
}

console.log(`Documentación viva: ${files.length} archivos, 0 enlaces locales rotos`);
