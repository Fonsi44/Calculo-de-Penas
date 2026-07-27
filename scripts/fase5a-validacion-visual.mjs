import { chromium, devices } from 'playwright';
import fs from 'fs';

const BASE = 'https://www.pinedayasociadoshn.com';
const CATS = JSON.parse(fs.readFileSync('.secrets/cats-lote3.json', 'utf8'));
const SLUGS = JSON.parse(fs.readFileSync('.secrets/slugs-lote3.json', 'utf8'));
// 7+ artículos: cubrir los 3 completed + 2 blocked + 2 needs_human_review (con correcciones y enlaces)
const TEST_SLUGS = [
  'poder-legal-honduras-cuando-se-necesita',        // completed + corrección 1888
  'contratos-mercantiles-esenciales-empresas-honduras', // completed
  'recurso-de-amparo-honduras-guia-completa',       // completed
  'reclamar-deuda-legalmente-honduras',             // needs_human_review + enlace
  'importar-china-guia-aduanera',                   // blocked
  'importar-mercancias-guia-aduanera',              // blocked
  'derechos-indigenas-consulta-previa-honduras',    // needs_human_review
  'union-de-hecho-requisitos-derechos-honduras',    // needs_human_review + enlace
];

const browser = await chromium.launch();
const resultados = [];

for (const slug of TEST_SLUGS) {
  const cat = CATS[slug];
  const url = `${BASE}/blog/${cat}/${slug}`;
  for (const viewport of ['desktop', 'mobile']) {
    const context = await browser.newContext(
      viewport === 'mobile' ? { ...devices['iPhone 13'] } : { viewport: { width: 1280, height: 800 } },
    );
    const page = await context.newPage();
    const consoleErrors = [];
    const consoleWarnings = [];
    const networkErrors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 80));
      if (m.type() === 'warning') consoleWarnings.push(m.text().slice(0, 80));
    });
    page.on('requestfailed', (r) => networkErrors.push(r.url().slice(-60)));
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const html = await page.content();
      const h1Count = await page.locator('h1').count();
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      const jsonld = await page.locator('script[type="application/ld+json"]').count();
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
      });
      const swRegistered = await page.evaluate(() => navigator.serviceBook?.controller !== null || 'serviceWorker' in navigator);
      resultados.push({
        slug, viewport, status: resp?.status(),
        h1Count, canonical: canonical?.slice(0, 80),
        jsonld, hasOverflow,
        swSupported: swRegistered,
        consoleErrors: consoleErrors.length, consoleWarnings: consoleWarnings.length,
        networkErrors: networkErrors.length,
        errorSamples: consoleErrors.slice(0, 2),
        networkErrorSamples: networkErrors.slice(0, 2),
        ok: resp?.status() === 200 && h1Count === 1 && canonical && jsonld >= 1 && consoleErrors.length === 0 && !hasOverflow,
      });
    } catch (e) {
      resultados.push({ slug, viewport, error: e.message.slice(0, 100), ok: false });
    }
    await context.close();
  }
}
await browser.close();

const pass = resultados.filter((r) => r.ok).length;
const out = { fase: '5A', lote: 3, generatedAt: new Date().toISOString(), totalChecks: resultados.length, pass, fail: resultados.length - pass, resultados };
fs.writeFileSync('docs/audits/fase5a-lote3-validacion-visual.json', JSON.stringify(out, null, 2));
console.log('Checks:', resultados.length, '| PASS:', pass, '| FAIL:', resultados.length - pass);
for (const r of resultados) {
  console.log(`  ${r.slug.slice(0, 38).padEnd(38)} ${r.viewport.padEnd(7)} ${r.ok ? 'PASS' : 'FAIL'} | status:${r.status} h1:${r.h1Count} jld:${r.jsonld} err:${r.consoleErrors} net:${r.networkErrors} overflow:${r.hasOverflow}`);
}
