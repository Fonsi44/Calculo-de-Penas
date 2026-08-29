import { defineConfig } from 'vitest/config';
import path from 'path';
import { existsSync } from 'node:fs';

const hasScripts = existsSync(path.resolve(__dirname, 'scripts/seo-growth-final-reconcile.mjs'));
const hasDocs = existsSync(path.resolve(__dirname, 'docs/seo/growth/batch-1-selection.csv'));

/** Tests que importan o leen `scripts/` (gitignored en checkout público). */
const SCRIPT_DEPENDENT_TESTS = [
  'tests/apply-seo-growth-batch1.test.ts',
  'tests/audit-a11y-public-contract.test.ts',
  'tests/blog-claims-extract.test.ts',
  'tests/blog-notebooklm-contract.test.ts',
  'tests/blog-notebooklm-editorial-gate.test.ts',
  'tests/blog-notebooklm-review.test.ts',
  'tests/blog-verify-fix.test.ts',
  'tests/canonical-domain-enforce.test.ts',
  'tests/llms-txt.test.ts',
  'tests/meta-seo-auditor.test.ts',
  'tests/remediate-commercial-claims.test.ts',
  'tests/seo-content-audit.test.ts',
  'tests/seo-data-cli.test.ts',
];

/** Tests que leen fixtures bajo `docs/` (gitignored en checkout público). */
const DOCS_DEPENDENT_TESTS = [
  'tests/blog-inventory-recovery.test.ts',
  'tests/blog-performance-contract.test.ts',
  'tests/blog-route-contract.test.ts',
  'tests/seo-growth-final-reconciliation.test.ts',
  'tests/seo-phase3-editorial.test.ts',
];

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      'node_modules',
      '.next',
      'web-starter/**',
      'e2e/**',
      'tests/e2e/**',
      'playwright-report/**',
      '.opencode/**',
      '.kilo/**',
      ...(hasScripts ? [] : SCRIPT_DEPENDENT_TESTS),
      ...(hasDocs ? [] : DOCS_DEPENDENT_TESTS),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      reportsDirectory: './coverage',
      // Umbral inicial conservador (Fase HQC): se subirá gradualmente.
      // El objetivo no es bloquear PRs ahora, sino hacer visible la cobertura
      // real y establecer una línea base medible.
      thresholds: {
        lines: 35,
        statements: 35,
        branches: 25,
        functions: 30,
      },
      // Excluir del cómputo: scripts legacy, datos, configs y archivos no
      // funcionales que no aportan a la cobertura de producto.
      exclude: [
        'node_modules/**',
        '.next/**',
        'coverage/**',
        'e2e/**',
        'tests/e2e/**',
        'playwright-report/**',
        'scripts/legacy/**',
        'data/**',
        'docs/**',
        'auditoria-blog/**',
        '**/*.config.{ts,mjs,cjs}',
        'next-env.d.ts',
        'drizzle/**',
      ],
    },
  },
});
