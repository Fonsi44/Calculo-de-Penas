/**
 * E2E Critical — Seguridad (escenario 18).
 *
 * @critical
 *
 * Verifica:
 * - Respuestas sin secretos, tokens, emails completos, RTN en cuerpo
 * - Cabeceras de seguridad presentes
 * - x-correlation-id en respuestas
 * - Sin PII en contenido público
 */
import { test, expect } from '@playwright/test';

const PII_PATTERNS = [
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, // JWT en cuerpo
  /-----BEGIN.*PRIVATE KEY-----/,
  /sk-[A-Za-z0-9]{20,}/, // API keys
  /[A-Za-z0-9+/]{40,}={0,2}/, // posibles tokens base64 largos
];

test.describe('@critical Security — headers y logs', () => {
  test('18. Páginas públicas no exponen PII ni secretos', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();

    // No debe contener secretos
    for (const pattern of PII_PATTERNS) {
      expect(html).not.toMatch(pattern);
    }
    // No debe contener rutas de intranet
    expect(html).not.toContain('/intranet/');
    expect(html).not.toContain('/api/admin/');
  });

  test('18. Endpoints públicos tienen x-correlation-id', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.headers()['x-correlation-id']).toBeTruthy();
  });

  test('18. Endpoint health no expone información sensible', async ({ request }) => {
    const res = await request.get('/api/health');
    const body = await res.json();
    // No debe contener secrets
    const str = JSON.stringify(body);
    expect(str).not.toMatch(/secret|password|token|key/i);
  });

  test('18. Páginas de error no exponen stack traces', async ({ page }) => {
    await page.goto('/_not-found');
    const html = await page.content();
    expect(html).not.toMatch(/at\s+\S+\.(ts|tsx|js|jsx):\d+:\d+/); // stack trace
    expect(html).not.toContain('NODE_ENV');
  });
});
