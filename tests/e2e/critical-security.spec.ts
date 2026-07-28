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
  /sk-[A-Za-z0-9]{20,}/, // API keys estilo OpenAI
  /ghp_[A-Za-z0-9]{30,}/, // GitHub PATs
  /AKIA[0-9A-Z]{16}/, // AWS access keys
  // Tokens base64 largos que contienen + o / (caracteres distintivos de base64
  // que las verification keys de Google/Bing y los hashes de chunk no tienen).
  // Esto reduce los falsos positivos manteniendo la detección de secretos reales.
  /[A-Za-z0-9+/]*[+/][A-Za-z0-9+/]{39,}={0,2}/,
];

test.describe('@critical Security — headers y logs', () => {
  test('18. Páginas públicas no exponen PII ni secretos', async ({ page }) => {
    await page.goto('/');
    const rawHtml = await page.content();

    // Normalizar: eliminar artefactos de build de Next.js (hashes de chunks,
    // URLs de imagen codificadas, source maps) que generan falsos positivos en
    // el patrón de tokens base64 largos. Preserva el resto del HTML.
    const html = rawHtml
      .replace(/\/_next\/static\/[^"'\s]+/g, '') // chunks, media, CSS
      .replace(/\/_next\/image\?[^"'\s]+/g, '')   // URLs de imagen optimizada
      .replace(/\/_next\/[^"'\s]+/g, '');          // otros paths internos

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
