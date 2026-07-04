// QA visual de cierre — transformación web pública.
// Captura desktop + móvil de rutas clave y reporta errores de consola / overflow horizontal.
// Uso: node scripts/qa-visual-cierre.mjs (requiere servidor en http://localhost:4319)
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.QA_BASE || 'http://localhost:4319';
const OUT = './.qa-shots';
mkdirSync(`${OUT}/desktop`, { recursive: true });
mkdirSync(`${OUT}/mobile`, { recursive: true });

const ROUTES = [
  '/',
  '/despacho',
  '/derecho-penal',
  '/servicios-juridicos',
  '/hondurenos-en-espana',
  '/solicitar-consulta',
  '/preguntas-frecuentes',
  '/guia-legal-abogados-honduras',
  '/como-llegar',
  '/abogados-en-nacaome',
  '/abogado-penalista-choluteca',
];

const slug = (r) => (r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '-'));

const issues = [];

const browser = await chromium.launch();

// --- Desktop ---
const dctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const dpage = await dctx.newPage();
const dConsole = [];
dpage.on('console', (m) => { if (m.type() === 'error') dConsole.push(m.text()); });
dpage.on('pageerror', (e) => dConsole.push(`PAGEERROR: ${e.message}`));

for (const r of ROUTES) {
  dConsole.length = 0;
  const url = BASE + r;
  try {
    await dpage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await dpage.screenshot({ path: `${OUT}/desktop/${slug(r)}.png`, fullPage: true });
    // Overflow horizontal: scrollWidth > clientWidth
    const overflow = await dpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 2) issues.push(`[desktop] ${r} overflow horizontal=${overflow}px`);
    // H1 count
    const h1 = await dpage.locator('h1').count();
    if (h1 !== 1) issues.push(`[desktop] ${r} h1.count=${h1} (esperado 1)`);
    if (dConsole.length) issues.push(`[desktop] ${r} console: ${dConsole.slice(0, 2).join(' | ')}`);
  } catch (e) {
    issues.push(`[desktop] ${r} GOTO_FAIL: ${e.message}`);
  }
}
await dctx.close();

// --- Mobile ---
const mctx = await browser.newContext({ ...devices['iPhone 12'] });
const mpage = await mctx.newPage();
const mConsole = [];
mpage.on('console', (m) => { if (m.type() === 'error') mConsole.push(m.text()); });
mpage.on('pageerror', (e) => mConsole.push(`PAGEERROR: ${e.message}`));

for (const r of ROUTES) {
  mConsole.length = 0;
  const url = BASE + r;
  try {
    await mpage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await mpage.screenshot({ path: `${OUT}/mobile/${slug(r)}.png`, fullPage: true });
    const overflow = await mpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 2) issues.push(`[mobile] ${r} overflow horizontal=${overflow}px`);
    const h1 = await mpage.locator('h1').count();
    if (h1 !== 1) issues.push(`[mobile] ${r} h1.count=${h1} (esperado 1)`);
    if (mConsole.length) issues.push(`[mobile] ${r} console: ${mConsole.slice(0, 2).join(' | ')}`);
  } catch (e) {
    issues.push(`[mobile] ${r} GOTO_FAIL: ${e.message}`);
  }
}
await mctx.close();

await browser.close();

console.log(`Capturas: ${ROUTES.length * 2} (${OUT}/desktop, ${OUT}/mobile)`);
if (issues.length === 0) {
  console.log('RESULTADO: SIN issues detectados (overflow, h1 multiple, errores consola).');
} else {
  console.log(`RESULTADO: ${issues.length} issue(s) detectados:`);
  for (const i of issues) console.log('  - ' + i);
}
