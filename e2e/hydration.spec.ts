import { test, expect } from '@playwright/test';

/**
 * Test de regresión — hidratación de las rutas públicas.
 *
 * Causa raíz que previene: el ChatWidget (Client Component) usaba
 * `typeof document === 'undefined'` como branch server/client, lo que
 * provocaba que el server renderizara `null` y el cliente renderizara el
 * portal en el primer paint → mismatch de hidratación (React error #418).
 * Fix: patrón `mounted` con useSyncExternalStore (determinista server/client).
 *
 * Nota: NO se comprueban todos los errores de consola porque Microsoft Clarity
 * (script de terceros) emite `a[c] is not a function` en contexto headless, lo
 * cual es ruido externo y no deuda de la aplicación. Aquí se valida solo la
 * ausencia de errores de hidratación (#418 / "didn't match").
 */
const ROUTES = [
  '/',
  '/despacho',
  '/derecho-penal',
  '/servicios-juridicos',
  '/hondurenos-en-espana',
  '/solicitar-consulta',
  '/preguntas-frecuentes',
  '/abogados-en-nacaome',
];

test.describe('Hidratación — sin mismatch server/client', () => {
  for (const route of ROUTES) {
    // La home y hubs cargan más scripts de analítica (GA, Clarity, pixel); el
    // teardown del contexto puede superar el timeout por defecto de 30s, por
    // eso se amplia para esas rutas. No afecta a la validez del test.
    test(`${route} no produce errores de hidratación (#418)`, async ({ page }) => {
      test.setTimeout(60000);
      const hydrationErrors: string[] = [];
      page.on('pageerror', (err) => {
        if (/418|hydrat|didn't match|server rendered HTML didn't match/i.test(err.message)) {
          hydrationErrors.push(err.message);
        }
      });

      await page.goto(route, { waitUntil: 'networkidle' });
      // Pausa para que React complete la hidratación y emita cualquier error.
      await page.waitForTimeout(1500);

      expect(hydrationErrors, 'no debe haber mismatch de hidratación').toEqual([]);
    });
  }
});
