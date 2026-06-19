import { defineConfig } from 'vitest/config';
import path from 'path';

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
      'e2e/**',
      'playwright-report/**',
      // Excluir tooling local con sus propios node_modules (OpenCode crea
      // .opencode/node_modules con tests internos de dependencias como zod
      // que rompen la colección de tests del proyecto).
      '.opencode/**',
      '.kilo/**',
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
