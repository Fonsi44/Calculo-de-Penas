#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..', '..');
const baseline = JSON.parse(readFileSync(resolve(import.meta.dirname, 'knip-baseline.json'), 'utf8'));
const executable = resolve(root, 'node_modules', '.bin', 'knip');
const result = spawnSync(executable, ['--reporter', 'json'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
});
if (!result.stdout.trim()) {
  console.error(result.stderr || 'knip no produjo salida JSON');
  process.exit(1);
}
const report = JSON.parse(result.stdout);
const categories = Object.keys(baseline.maximum);
const actual = Object.fromEntries(categories.map((category) => [
  category,
  report.issues.reduce((total, issue) => total + (issue[category]?.length ?? 0), 0),
]));
const exceeded = categories.filter((category) => actual[category] > baseline.maximum[category]);
console.log(JSON.stringify({ baseline: baseline.maximum, actual, exceeded }, null, 2));
if (exceeded.length) {
  console.error(`La deuda knip aumentó: ${exceeded.join(', ')}`);
  process.exit(1);
}
