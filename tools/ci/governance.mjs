#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DIRS = ['app', 'components', 'hooks', 'lib'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const failures = [];

function collect(directory) {
  if (!existsSync(resolve(ROOT, directory))) return [];
  return readdirSync(resolve(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return collect(path);
    return EXTENSIONS.includes(extname(entry.name)) && !entry.name.endsWith('.d.ts') ? [path] : [];
  });
}

const files = SOURCE_DIRS.flatMap(collect).sort();
const fileSet = new Set(files);

function resolveImport(from, specifier) {
  if (specifier.startsWith('@/')) specifier = specifier.slice(2);
  else if (specifier.startsWith('.')) specifier = relative(ROOT, resolve(ROOT, dirname(from), specifier));
  else return null;
  const candidates = [
    specifier,
    ...EXTENSIONS.map((extension) => specifier + extension),
    ...EXTENSIONS.map((extension) => `${specifier}/index${extension}`),
  ];
  return candidates.find((candidate) => fileSet.has(candidate)) ?? null;
}

const graph = new Map();
const hashes = new Map();
for (const file of files) {
  const source = readFileSync(resolve(ROOT, file), 'utf8');
  const lineCount = source.split('\n').length;
  const limit = 1_000;
  if (lineCount > limit) failures.push(`${file}: ${lineCount} líneas supera presupuesto ${limit}`);
  if (file.startsWith('components/') && /(?:from\s+|import\s*\()['"]@\/app\//.test(source)) {
    failures.push(`${file}: components no puede importar app`);
  }
  const dependencies = [];
  const importPattern = /^(?:\s*import(?!\s+type\b)[^;]*?\sfrom\s*|\s*import\s*\(|\s*export\s+\*\s+from\s*)['"]([^'"]+)['"]/gm;
  for (const match of source.matchAll(importPattern)) {
    const dependency = resolveImport(file, match[1]);
    if (dependency) dependencies.push(dependency);
  }
  graph.set(file, [...new Set(dependencies)]);

  const digest = createHash('sha256').update(source).digest('hex');
  const matches = hashes.get(digest) ?? [];
  matches.push(file);
  hashes.set(digest, matches);
}

for (const matches of hashes.values()) {
  if (matches.length > 1) failures.push(`duplicado exacto de código: ${matches.join(', ')}`);
}

const visiting = new Set();
const visited = new Set();
function visit(file, stack) {
  if (visiting.has(file)) {
    const start = stack.indexOf(file);
    failures.push(`ciclo de imports: ${[...stack.slice(start), file].join(' -> ')}`);
    return;
  }
  if (visited.has(file)) return;
  visiting.add(file);
  for (const dependency of graph.get(file) ?? []) visit(dependency, [...stack, file]);
  visiting.delete(file);
  visited.add(file);
}
for (const file of files) visit(file, []);

const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n');
const forbiddenTracked = tracked.filter((file) =>
  /^(?:\.local|\.backups|data\/backups|output|reports|generated|coverage|playwright-report|test-results)\//.test(file)
  || /\.(?:log|dump|sql\.gz)$/.test(file));
if (forbiddenTracked.length) failures.push(`artefactos locales versionados: ${forbiddenTracked.join(', ')}`);

if (failures.length) {
  console.error(`Gobernanza: ${failures.length} fallo(s)`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exit(1);
}
console.log(`Gobernanza: ${files.length} fuentes, 0 ciclos, límites/imports/artefactos verdes`);
