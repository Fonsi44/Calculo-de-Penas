#!/usr/bin/env node
/**
 * Valida el flujo mínimo del starter sin Figma:
 * - presets de tema presentes
 * - 2 páginas de ejemplo
 * - bloques marketing
 * - reglas Cursor
 */
import { existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'STACK.md',
  'README.md',
  'lib/site.ts',
  'app/page.tsx',
  'app/about/page.tsx',
  'themes/corporate-navy.css',
  'themes/modern-minimal.css',
  'themes/warm-legal.css',
  'themes/vibrant-startup.css',
  '.cursor/rules/tailwind-tokens.mdc',
  '.cursor/rules/design-workflow.mdc',
  '.cursor/skills/new-web-page/SKILL.md',
  'components/marketing/page-hero.tsx',
  'components/marketing/cta-block.tsx',
  'e2e/smoke.spec.ts',
];

let failed = 0;

for (const rel of required) {
  const path = resolve(ROOT, rel);
  if (!existsSync(path)) {
    console.error(`FAIL: falta ${rel}`);
    failed++;
  } else {
    console.log(`OK: ${rel}`);
  }
}

const themeCount = readdirSync(resolve(ROOT, 'themes')).filter((f) => f.endsWith('.css')).length;
if (themeCount < 3) {
  console.error(`FAIL: se requieren al menos 3 presets CSS (encontrados: ${themeCount})`);
  failed++;
} else {
  console.log(`OK: ${themeCount} presets CSS`);
}

if (failed > 0) {
  console.error(`\nvalidate-flow: ${failed} error(es)`);
  process.exit(1);
}

console.log('\nvalidate-flow: flujo code-first listo (sin Figma)');
