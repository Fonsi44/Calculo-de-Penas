/**
 * Visual regression: captura screenshots y compara contra baseline.
 *
 * Extiende la filosofía de screenshot-audit.cjs con comparación pixel-a-pixel
 * vía pixelmatch + pngjs (JS puro, sin native bindings).
 *
 * MODOS:
 *   baseline  Genera/regenera las imágenes de referencia en
 *             e2e/visual-baselines/. Commitear tras cambios intencionales.
 *   check     Captura a docs/screenshots-current/, compara con baseline,
 *             reporta % diff por imagen. Exit 1 si > threshold.
 *   update    Alias de baseline (regenera baselines).
 *
 * THRESHOLD:
 *   Por defecto 0.1% de píxeles diferentes. Configurable vía VISUAL_THRESHOLD
 *   (ej. VISUAL_THRESHOLD=0.5 node scripts/visual-regression.cjs check).
 *
 * NAMING:
 *   home.mobile.png / home.desktop.png (con PUNTO, no guion).
 *   Esto evita los globs del .gitignore (*-mobile.png, *-desktop.png) que
 *   ignorarían baselines nombrados con guion.
 *
 * USO:
 *   npm run visual:baseline    # generar referencia inicial
 *   npm run visual:check       # comparar contra referencia
 *   npm run visual:update      # regenerar referencia tras cambio intencional
 *
 * EXIT CODES (check):
 *   0 = todas las imágenes dentro del threshold
 *   1 = al menos una imagen supera el threshold (regresión visual)
 *   2 = falta baseline (ejecutar visual:baseline primero)
 */
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
// pixelmatch v7 expone su función via ESM interop ({ __esModule, default }).
// En CJS hay que resolver el .default; fallback para versiones antiguas.
const _pmImport = require('pixelmatch');
const pixelmatch = typeof _pmImport === 'function' ? _pmImport : _pmImport.default;
const { existsSync, mkdirSync, readdirSync, unlinkSync } = require('fs');
const { join, dirname } = require('path');

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'servicios', path: '/servicios-juridicos' },
  { name: 'derecho-penal', path: '/derecho-penal' },
  { name: 'despacho', path: '/despacho' },
  { name: 'blog', path: '/blog' },
  { name: 'solicitar-consulta', path: '/solicitar-consulta' },
  { name: 'abogados-en-nacaome', path: '/abogados-en-nacaome' },
  { name: 'como-llegar', path: '/como-llegar' },
];

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 900 },
];

const BASE = process.env.SITE_BASE_URL || 'https://www.pinedayasociadoshn.com';
const ROOT = join(__dirname, '..');
const BASELINE_DIR = join(ROOT, 'e2e', 'visual-baselines');
const CURRENT_DIR = join(ROOT, 'docs', 'screenshots-current');
const DIFF_DIR = join(ROOT, 'docs', 'screenshots-diff');
const THRESHOLD_PCT = parseFloat(process.env.VISUAL_THRESHOLD || '0.1');

const mode = process.argv[2] || 'check';
if (!['baseline', 'check', 'update'].includes(mode)) {
  console.error(`Modo inválido: "${mode}". Usar: baseline | check | update`);
  process.exit(2);
}
// update === baseline
const isBaseline = mode === 'baseline' || mode === 'update';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function clearDir(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.png')) unlinkSync(join(dir, f));
  }
}

async function captureAll(targetDir) {
  ensureDir(targetDir);
  clearDir(targetDir);
  const browser = await chromium.launch();
  const overflowReport = [];
  try {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      for (const p of PAGES) {
        const file = `${p.name}.${vp.name}.png`;
        try {
          await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle', timeout: 30000 });
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          await page.screenshot({ path: join(targetDir, file), fullPage: false });
          overflowReport.push({ page: p.name, viewport: vp.name, overflow });
        } catch (e) {
          console.log(`  ✗ ${file} ERROR: ${String(e).substring(0, 80)}`);
        }
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  return overflowReport;
}

function compareImages(baselinePath, currentPath, diffPath) {
  const imgA = PNG.sync.read(readFileSyncSafe(baselinePath));
  const imgB = PNG.sync.read(readFileSyncSafe(currentPath));
  // Dimensiones deben coincidir; si no, es un cambio estructural grave.
  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    return {
      diff: 100,
      note: `dim mismatch: baseline ${imgA.width}x${imgA.height} vs current ${imgB.width}x${imgB.height}`,
    };
  }
  const { width, height } = imgA;
  const diff = new PNG({ width, height });
  const numDiff = pixelmatch(imgA.data, imgB.data, diff.data, width, height, {
    threshold: 0.1, // sensibilidad de color por canal
    alpha: 0.2,
  });
  const totalPixels = width * height;
  const pct = (numDiff / totalPixels) * 100;
  // Guardar diff PNG solo si hay diferencias (ahorra disco)
  if (numDiff > 0) {
    ensureDir(dirname(diffPath));
    writeFileSyncSafe(diffPath, PNG.sync.write(diff));
  }
  return { diff: pct, note: null };
}

function readFileSyncSafe(p) {
  // pngjs usa fs internamente; este wrapper solo documenta dependencia.
  return require('fs').readFileSync(p);
}
function writeFileSyncSafe(p, data) {
  require('fs').writeFileSync(p, data);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log(` Visual regression — modo: ${mode}`);
  console.log(` Target: ${BASE}`);
  console.log(` Threshold: ${THRESHOLD_PCT}%`);
  console.log('═══════════════════════════════════════════════════════');

  if (isBaseline) {
    console.log(`\nGenerando baseline en e2e/visual-baselines/...`);
    const overflow = await captureAll(BASELINE_DIR);
    console.log(`\n✓ ${PAGES.length * VIEWPORTS.length} imágenes baseline generadas.`);
    console.log('  Committear el directorio e2e/visual-baselines/ para establecer la referencia.');
    if (overflow.some((o) => o.overflow > 0)) {
      console.log('\n⚠ Overflow horizontal detectado en baseline:');
      overflow.filter((o) => o.overflow > 0).forEach((o) => {
        console.log(`  ${o.page}.${o.viewport}: ${o.overflow}px`);
      });
    }
    return;
  }

  // mode === 'check'
  if (!existsSync(BASELINE_DIR)) {
    console.error(`\n✗ No existe baseline en ${BASELINE_DIR}.`);
    console.error('  Ejecutar primero: npm run visual:baseline');
    process.exit(2);
  }

  console.log(`\nCapturando imágenes actuales en docs/screenshots-current/...`);
  await captureAll(CURRENT_DIR);

  console.log(`\nComparando contra baseline (threshold ${THRESHOLD_PCT}%)...`);
  console.log('── Resultados ─────────────────────────────────────────');
  let regressions = 0;
  let passed = 0;
  let missing = 0;
  for (const p of PAGES) {
    for (const vp of VIEWPORTS) {
      const file = `${p.name}.${vp.name}.png`;
      const baselinePath = join(BASELINE_DIR, file);
      const currentPath = join(CURRENT_DIR, file);
      const diffPath = join(DIFF_DIR, file);
      if (!existsSync(baselinePath)) {
        console.log(`  ? ${file.padEnd(36)} sin baseline`);
        missing++;
        continue;
      }
      if (!existsSync(currentPath)) {
        console.log(`  ? ${file.padEnd(36)} sin captura actual`);
        missing++;
        continue;
      }
      try {
        const { diff, note } = compareImages(baselinePath, currentPath, diffPath);
        const over = diff > THRESHOLD_PCT;
        if (over) {
          regressions++;
          console.log(`  ✗ ${file.padEnd(36)} ${diff.toFixed(3)}% ${note ? '(' + note + ')' : ''}`);
        } else {
          passed++;
          console.log(`  ✓ ${file.padEnd(36)} ${diff.toFixed(3)}%${note ? ' (' + note + ')' : ''}`);
        }
      } catch (e) {
        regressions++;
        console.log(`  ✗ ${file.padEnd(36)} ERROR: ${e.message}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  const color = regressions > 0 ? '\x1b[31m' : '\x1b[32m';
  console.log(` ${color}Resultado: ${passed} OK · ${regressions} regresiones · ${missing} sin baseline${'\x1b[0m'}`);
  console.log('═══════════════════════════════════════════════════════');

  if (regressions > 0) {
    console.log('\n⚠️  Regresiones visuales detectadas.');
    console.log('   - Diffs en docs/screenshots-diff/ para inspección.');
    console.log('   - Si son intencionales: npm run visual:update y commitear.');
  } else if (missing > 0) {
    console.log('\n⚠️  Faltan baselines. Ejecutar: npm run visual:baseline');
  } else {
    console.log('\n✅ Sin regresiones visuales.');
  }

  process.exitCode = regressions > 0 ? 1 : 0;
})().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(2);
});
