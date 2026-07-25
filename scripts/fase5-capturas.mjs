#!/usr/bin/env node
/**
 * FASE 5 — Capturador de pantallas para auditoría visual.
 *
 * Uso:
 *   node scripts/fase5-capturas.mjs baseline   # estado previo (HEAD actual)
 *   node scripts/fase5-capturas.mjs after      # estado tras la implementación
 *
 * Requiere un servidor levantado en http://localhost:3178 (next dev -p 3178).
 * Captura 14 rutas en 4 viewports (375, 768, 1280, 1440) — full page PNG.
 *
 * No es un test de regresión pixel-perfect: las capturas son evidencia visual
 * para docs/design/fase-5/auditoria-visual-actual.md y validacion-visual.md.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = process.env.FASE5_BASE_URL ?? 'http://localhost:3178';
const FASE = process.argv[2];
if (FASE !== 'baseline' && FASE !== 'after') {
  console.error('Uso: node scripts/fase5-capturas.mjs baseline|after');
  process.exit(2);
}

const RUTAS = [
  ['home', '/'],
  ['despacho', '/despacho'],
  ['servicios', '/servicios-juridicos'],
  ['derecho-penal', '/derecho-penal'],
  ['servicio-familia', '/servicios-juridicos/derecho-de-familia'],
  ['servicio-laboral', '/servicios-juridicos/derecho-laboral'],
  ['servicio-civil', '/servicios-juridicos/derecho-civil-y-notarial'],
  ['consulta', '/solicitar-consulta'],
  ['faq', '/preguntas-frecuentes'],
  ['como-llegar', '/como-llegar'],
  ['espana-hub', '/hondurenos-en-espana'],
  ['local-nacaome', '/abogados-en-nacaome'],
  ['local-choluteca', '/abogados-en-choluteca'],
  ['local-san-lorenzo', '/abogados-en-san-lorenzo'],
];

const VIEWPORTS = [
  { w: 375, h: 812 },   // iPhone 13 mini / móvil estrecho
  { w: 768, h: 1024 },  // iPad portrait / tablet
  { w: 1280, h: 800 },  // laptop
  { w: 1440, h: 900 },  // desktop
];

const OUT_DIR = resolve(ROOT, 'docs/design/fase-5', FASE);
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const fallos = [];

for (const { w, h } of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce', // capturas deterministas, sin animaciones pendientes
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  for (const [slug, ruta] of RUTAS) {
    const url = `${BASE_URL}${ruta}`;
    const out = resolve(OUT_DIR, `${w}`, `${slug}.png`);
    mkdirSync(dirname(out), { recursive: true });

    try {
      const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      if (!res || res.status() >= 400) {
        fallos.push(`${w}/${slug}: HTTP ${res?.status() ?? 'sin respuesta'}`);
        continue;
      }
      // Espera extra: fuentes + imágenes lazy + posible hidratación
      await page.waitForLoadState('domcontentloaded');
      try { await page.evaluate(() => document.fonts?.ready); } catch {}
      await page.waitForTimeout(600);
      await page.screenshot({ path: out, fullPage: true, type: 'png' });
      console.log(`  OK   ${w}/${slug}.png  (${ruta})`);
    } catch (err) {
      fallos.push(`${w}/${slug}: ${err.message.split('\n')[0]}`);
      console.log(`  FAIL ${w}/${slug}.png  → ${err.message.split('\n')[0]}`);
    }
  }

  await context.close();
}

await browser.close();

console.log('');
if (fallos.length === 0) {
  console.log(`OK ${FASE}: ${RUTAS.length * VIEWPORTS.length} capturas en ${OUT_DIR}`);
  process.exit(0);
} else {
  console.log(`WARN ${FASE}: ${fallos.length} fallo(s) de ${RUTAS.length * VIEWPORTS.length}:`);
  for (const f of fallos) console.log(`   - ${f}`);
  process.exit(1);
}
