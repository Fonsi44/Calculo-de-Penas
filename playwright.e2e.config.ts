/**
 * Playwright E2E Configuration — Subfase 2/3.
 *
 * Diseñado para ejecutarse contra una base efímera aislada.
 * Requiere que el servidor Next.js esté corriendo (el script e2e/run.mjs
 * no lo levanta; debe iniciarse antes con npm run build && npm start).
 *
 * Secretos: NUNCA incluir credenciales reales. Usar .env.e2e generado
 * por scripts/e2e/setup.mjs.
 */
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.e2e') });
config(); // fallback

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3100';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // Secuencial: la base es compartida
  forbidOnly: true,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // Redactar secrets en traces
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // Global setup/teardown NO usado — el script e2e/run.mjs orquesta el ciclo.
});
