import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
    "_archived_unused/**",
    // Binarios auxiliares de OpenCode en CommonJS (no son código de la app).
    ".opencode/bin/**",
    "wordpress/**",
    // Cobertura de vitest (regenerable con npm run test:coverage).
    "coverage/**",
  ]),
]);

export default eslintConfig;
