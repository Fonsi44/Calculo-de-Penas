/**
 * Accesibilidad esencial (axe) sobre rutas representativas — PROMPT 2 §9.
 *
 * Ejecuta axe-core/playwright y FALLA si existen violaciones de impacto
 * `critical` o `serious` (sin desactivar reglas; las violaciones moderadas/
 * menores se registran para revisión pero no bloquean).
 *
 * Rutas: home, servicios, artículo representativo, landing indexable,
 * landing NOINDEX, contacto, FAQ.
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'servicios', path: '/servicios-juridicos' },
  { name: 'articulo-penal', path: '/blog/derecho-penal/antejuicio-en-honduras' },
  { name: 'landing-indexable', path: '/abogados-en-nacaome' },
  { name: 'landing-noindex', path: '/abogados-en-pespire' },
  { name: 'contacto', path: '/solicitar-consulta' },
  { name: 'faq', path: '/preguntas-frecuentes' },
];

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test.describe(`A11y esencial ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route.name} (${route.path}) — sin violaciones críticas/serias`, async ({ page }) => {
        await page.context().route('**/_vercel/speed-insights/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
        await page.goto(route.path, { waitUntil: 'networkidle' });
        const results = await new AxeBuilder({ page }).analyze();
        const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
        if (serious.length > 0) {
          // Reporte de detalle para diagnóstico (no se desactivan reglas).
          process.stdout.write(`A11y ${route.path}: ${serious.map((v) => `${v.id}(${v.impact})`).join(', ')}\n`);
        }
        expect(serious, `axe critical/serious en ${route.path}`).toEqual([]);
      });
    }
  });
}
