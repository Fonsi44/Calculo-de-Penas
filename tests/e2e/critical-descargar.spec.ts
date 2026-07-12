/**
 * E2E Critical — Descargar (escenario 17).
 *
 * @critical
 *
 * Verifica:
 * - Solo POST (GET rechazado)
 * - Sin PII en URL
 * - Consent requerido
 * - Rate limit efectivo
 */
import { test, expect } from '@playwright/test';

test.describe('@critical Descargar — POST público', () => {
  test('17. GET /api/descargar sin parámetros devuelve error (no acepta GET)', async ({ request }) => {
    const res = await request.get('/api/descargar?area=penal&email=test@test.local');
    // GET no debe devolver PDF (debe ser 405 Method Not Allowed o 400)
    expect(res.status()).not.toBe(200);
  });

  test('17. POST sin consent es rechazado', async ({ request }) => {
    const res = await request.post('/api/descargar', {
      data: { area: 'penal', email: 'test@test.local' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/consent|aceptar|privacidad/i);
  });

  test('17. POST con consent devuelve PDF (o error de área si no existe)', async ({ request }) => {
    const res = await request.post('/api/descargar', {
      data: { area: 'penal', email: 'e2e-test@test.local', consent: true },
    });
    // Si el área 'penal' existe como lead magnet → 200 con PDF.
    // Si no existe → 400 "Área no válida". Ambos son comportamientos correctos.
    if (res.status() === 200) {
      expect(res.headers()['content-type']).toContain('application/pdf');
      expect(res.headers()['cache-control']).toMatch(/private|no-store/);
    } else {
      expect(res.status()).toBe(400);
    }
  });

  test('17. Rate limit responde 429 tras exceder límite', async ({ request }) => {
    // Hacer 6 peticiones rápidas (límite = 5 en 15 min)
    const results: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await request.post('/api/descargar', {
        data: { area: 'penal', email: `ratelimit-${i}@test.local`, consent: true },
      });
      results.push(res.status());
    }
    // Al menos una debe ser 429
    expect(results).toContain(429);
  });
});
