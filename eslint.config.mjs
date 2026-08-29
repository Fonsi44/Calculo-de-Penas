import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "data/**",
    "drizzle/**",
    "docs/**",
    ".opencode/bin/**",
    "wordpress/**",
    // Cobertura de vitest (regenerable con npm run test:coverage).
    "coverage/**",
    // Plantilla aislada (tiene su propio tsconfig; no comparte aliases del app principal).
    "web-starter/**",
  ]),
]);

export default eslintConfig;
