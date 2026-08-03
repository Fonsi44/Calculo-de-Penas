import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { consolidateResults } from '../scripts/audit-a11y-public-contract';

const TEMP_TEST_DIR = path.join(__dirname, '../test-results/a11y-test-temp');
const TEST_SHA = 'e2a916c0e7152dc78f6b153a5f8b244520d4780f';

const ROUTES = [
  '/', '/despacho', '/servicios-juridicos', '/derecho-penal', '/preguntas-frecuentes',
  '/blog', '/blog?page=2', '/blog/derecho-penal/defensa-penal-honduras',
  '/equipo/danilo-pineda-maradiaga', '/abogados-en-nacaome', '/abogados-en-choluteca',
  '/solicitar-consulta', '/politica-privacidad'
];

function createMockFile(filename: string, data: Record<string, unknown>) {
  fs.writeFileSync(path.join(TEMP_TEST_DIR, filename), JSON.stringify(data, null, 2));
}

describe('audit-a11y-public-contract consolidator unit tests', () => {
  beforeAll(() => {
    if (!fs.existsSync(TEMP_TEST_DIR)) {
      fs.mkdirSync(TEMP_TEST_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEMP_TEST_DIR)) {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    }
  });

  const writeValidSet = () => {
    // Clear directory
    fs.readdirSync(TEMP_TEST_DIR).forEach(f => fs.unlinkSync(path.join(TEMP_TEST_DIR, f)));

    // Create 13 routes x 3 viewports = 39 cases
    for (const route of ROUTES) {
      for (const vp of ['desktop', 'mobile', 'small-mobile']) {
        createMockFile(`result_${route.replace(/[\/\?]/g, '_')}_${vp}.json`, {
          head_sha: TEST_SHA,
          timestamp: new Date().toISOString(),
          route,
          viewport: vp,
          reflow_mode: 'normal',
          color_scheme: 'light',
          reduced_motion: 'normal',
          axe_critical: 0,
          axe_serious: 0,
          color_contrast: 0,
          keyboard: 'PASS',
          escape: 'PASS',
          focus_return: 'PASS',
          aria_relations: 'PASS',
          horizontal_overflow: false,
          console_errors: 0,
          result: 'PASS'
        });
      }
    }

    // Create 4 widget collision states
    const widgetStates = ['cookie_consent_open', 'mobile_menu_open', 'ios_install_open', 'chat_widget_open'];
    for (const state of widgetStates) {
      createMockFile(`collision_${state}.json`, {
        state,
        cookie_consent_open: 'closed',
        mobile_menu_open: 'closed',
        ios_popover_open: 'closed',
        chat_open: 'closed',
        result: 'PASS'
      });
    }
  };

  it('valida con éxito un set de resultados completo y correcto', () => {
    writeValidSet();
    const summary = consolidateResults(TEMP_TEST_DIR, TEST_SHA);
    expect(summary.hasFailures).toBe(false);
    expect(summary.uniqueRoutesCount).toBe(13);
  });

  it('falla si hay una ruta ausente', () => {
    writeValidSet();
    // Delete one route files
    fs.readdirSync(TEMP_TEST_DIR).forEach(f => {
      if (f.includes('_despacho')) {
        fs.unlinkSync(path.join(TEMP_TEST_DIR, f));
      }
    });
    expect(() => consolidateResults(TEMP_TEST_DIR, TEST_SHA)).toThrow(/Faltan rutas/);
  });

  it('falla si hay un viewport ausente', () => {
    writeValidSet();
    // Delete all desktop files
    fs.readdirSync(TEMP_TEST_DIR).forEach(f => {
      if (f.includes('_desktop')) {
        fs.unlinkSync(path.join(TEMP_TEST_DIR, f));
      }
    });
    expect(() => consolidateResults(TEMP_TEST_DIR, TEST_SHA)).toThrow(/Faltan viewports/);
  });

  it('falla si un archivo tiene SHA incorrecto (resultado stale)', () => {
    writeValidSet();
    // Corrupt one file SHA
    const files = fs.readdirSync(TEMP_TEST_DIR).filter(f => !f.startsWith('collision_'));
    const filePath = path.join(TEMP_TEST_DIR, files[0]);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.head_sha = 'STALE_OLD_COMMIT_SHA';
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    expect(() => consolidateResults(TEMP_TEST_DIR, TEST_SHA)).toThrow(/tiene HEAD SHA/);
  });

  it('detecta fallos por critical violations', () => {
    writeValidSet();
    // Inject a critical violation in one case
    const files = fs.readdirSync(TEMP_TEST_DIR).filter(f => !f.startsWith('collision_'));
    const filePath = path.join(TEMP_TEST_DIR, files[0]);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.axe_critical = 1;
    data.result = 'FAIL';
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    const summary = consolidateResults(TEMP_TEST_DIR, TEST_SHA);
    expect(summary.hasFailures).toBe(true);
    expect(summary.axeCritical).toBe(1);
  });

  it('detecta fallos por contrast violations', () => {
    writeValidSet();
    const files = fs.readdirSync(TEMP_TEST_DIR).filter(f => !f.startsWith('collision_'));
    const filePath = path.join(TEMP_TEST_DIR, files[0]);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.color_contrast = 1;
    data.result = 'FAIL';
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    const summary = consolidateResults(TEMP_TEST_DIR, TEST_SHA);
    expect(summary.hasFailures).toBe(true);
    expect(summary.colorContrast).toBe(1);
  });

  it('detecta fallos por horizontal overflow (reflow)', () => {
    writeValidSet();
    const files = fs.readdirSync(TEMP_TEST_DIR).filter(f => !f.startsWith('collision_'));
    const filePath = path.join(TEMP_TEST_DIR, files[0]);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.horizontal_overflow = true;
    data.result = 'FAIL';
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    const summary = consolidateResults(TEMP_TEST_DIR, TEST_SHA);
    expect(summary.hasFailures).toBe(true);
    expect(summary.reflowFailures).toBe(1);
  });

  it('falla si falta un escenario de widget en la matriz de colisión', () => {
    writeValidSet();
    // Delete the cookie consent open collision file
    fs.readdirSync(TEMP_TEST_DIR).forEach(f => {
      if (f.includes('collision_cookie_consent_open')) {
        fs.unlinkSync(path.join(TEMP_TEST_DIR, f));
      }
    });
    expect(() => consolidateResults(TEMP_TEST_DIR, TEST_SHA)).toThrow(/Falta el escenario del widget/);
  });
});
