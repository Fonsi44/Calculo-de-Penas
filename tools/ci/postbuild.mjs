#!/usr/bin/env node
/**
 * postbuild tolerante: en checkouts públicos `scripts/` está gitignored.
 * Si faltan los scripts, el build sigue siendo válido (Vercel Preview/LHCI/CI).
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const steps = [
  'scripts/verify-chunks.mjs',
  'scripts/generate-llms-txt.mjs',
  'scripts/submit-indexnow.mjs',
];

const missing = steps.filter((rel) => !existsSync(resolve(ROOT, rel)));
if (missing.length) {
  console.log(`postbuild: omitido (faltan scripts: ${missing.join(', ')})`);
  process.exit(0);
}

for (const rel of steps) {
  const result = spawnSync(process.execPath, [resolve(ROOT, rel)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
