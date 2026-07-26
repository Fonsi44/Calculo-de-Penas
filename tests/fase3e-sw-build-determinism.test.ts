/**
 * Fase 3E — Determinismo del service worker con arquitectura plantilla + artefacto.
 *
 * Cubre el CONTRATO fase3e documentado en `public/sw.js`:
 *
 *   1. `public/sw.js` es una PLANTILLA versionada: siempre contiene el
 *      placeholder `'__BUILD_ID__'` y NUNCA un BUILD_ID real inyectado.
 *   2. `scripts/build-sw.mjs` lee la plantilla, reemplaza el placeholder por
 *      el BUILD_ID real y escribe `public/sw.generated.js` (artefacto).
 *   3. Dos ejecuciones de build-sw con el mismo BUILD_ID producen artefactos
 *      idénticos (idempotencia del artefacto).
 *   4. La plantilla `public/sw.js` NUNCA es modificada por build-sw (la fuente
 *      versionada permanece intacta → árbol de Git limpio tras cada build).
 *   5. `--check` no escribe en disco.
 *   6. Si falta `.next/BUILD_ID`, usa el fallback `'dev'` (no falla, no congela).
 *
 * El test NO depende de un `next build` real: simula BUILD_ID con un tmp dir y
 * ejecuta el script como child process. Así es rápido y determinista en CI.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEMPLATE_PATH = resolve(ROOT, 'public/sw.js');
const SCRIPT_PATH = resolve(ROOT, 'scripts/build-sw.mjs');

const PLACEHOLDER_LINE =
  "const CACHE = 'pineda-pwa-' + ('__BUILD_ID__' === '__BUILD_ID__'";

function readTemplate(): string {
  return readFileSync(TEMPLATE_PATH, 'utf8');
}

/**
 * Ejecuta `scripts/build-sw.mjs` en un tmp repo aislado, con una plantilla y
 * BUILD_ID controlados. No toca el `.next/BUILD_ID` real del entorno.
 */
function runBuildSwInTmpRepo(opts: {
  template: string;
  buildId?: string; // si se omite, no se crea .next/BUILD_ID (ejercicio fallback)
  args?: string[];
}): {
  generated: string;
  templateAfter: string;
  exitCode: number;
  stdout: string;
  stderr: string;
} {
  const tmpRoot = resolve(ROOT, '.tmp-fase3e-sw-test');
  rmSync(tmpRoot, { recursive: true, force: true });
  mkdirSync(resolve(tmpRoot, 'public'), { recursive: true });
  mkdirSync(resolve(tmpRoot, 'scripts'), { recursive: true });
  if (opts.buildId !== undefined) {
    mkdirSync(resolve(tmpRoot, '.next'), { recursive: true });
    writeFileSync(resolve(tmpRoot, '.next/BUILD_ID'), opts.buildId, 'utf8');
  }

  // Plantilla + script reales (no mocks) para testear comportamiento exacto.
  writeFileSync(resolve(tmpRoot, 'public/sw.js'), opts.template, 'utf8');
  writeFileSync(
    resolve(tmpRoot, 'scripts/build-sw.mjs'),
    readFileSync(SCRIPT_PATH, 'utf8'),
    'utf8',
  );

  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    stdout = execFileSync(
      'node',
      [resolve(tmpRoot, 'scripts/build-sw.mjs'), ...(opts.args ?? [])],
      { cwd: tmpRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    stdout = e.stdout ?? '';
    stderr = e.stderr ?? '';
    exitCode = e.status ?? 1;
  }

  const generatedPath = resolve(tmpRoot, 'public/sw.generated.js');
  const generated = existsSync(generatedPath)
    ? readFileSync(generatedPath, 'utf8')
    : '';
  // La plantilla en disco tras la ejecución (debe ser idéntica a la entrada).
  const templateAfter = readFileSync(resolve(tmpRoot, 'public/sw.js'), 'utf8');

  return { generated, templateAfter, exitCode, stdout, stderr };
}

function cleanupTmp() {
  rmSync(resolve(ROOT, '.tmp-fase3e-sw-test'), { recursive: true, force: true });
  rmSync(resolve(ROOT, '.tmp-fase3e-sw-test-nobuildid'), {
    recursive: true,
    force: true,
  });
}

describe('Fase 3E — Service worker determinista (plantilla + artefacto)', () => {
  beforeAll(() => cleanupTmp());
  afterAll(() => cleanupTmp());

  // ─── Contrato 1: la plantilla commiteada lleva el placeholder ─────────────
  it('public/sw.js (plantilla) contiene el placeholder __BUILD_ID__ puro', () => {
    const sw = readTemplate();
    expect(sw).toContain(PLACEHOLDER_LINE);
    // No debe contener un BUILD_ID real ya inyectado: el patrón
    // 'pineda-pwa-<hash>' donde <hash> NO es el placeholder vacío.
    const injected = sw.match(
      /const CACHE = 'pineda-pwa-([A-Za-z0-9_-]+)' \+ \('__BUILD_ID__' === '__BUILD_ID__'/,
    );
    if (injected) {
      // El grupo capturado debe estar vacío (placeholder literal), no un hash.
      expect(injected[1]).toBe('');
    }
  });

  // ─── Contrato 2: build-sw genera el artefacto con BUILD_ID correcto ──────
  it('build-sw.mjs genera sw.generated.js con el BUILD_ID inyectado en CACHE', () => {
    const buildId = 'fase3e-build-id-001';
    const template = `// header\n${PLACEHOLDER_LINE}\n  ? 'dev'\n  : '__BUILD_ID__');\n`;
    const r = runBuildSwInTmpRepo({ template, buildId });
    expect(r.exitCode).toBe(0);
    // El BUILD_ID reemplaza al placeholder en la comparación de fallback.
    expect(r.generated).toContain(
      `const CACHE = 'pineda-pwa-' + ('${buildId}' === '${buildId}'`,
    );
    // El BUILD_ID aparece también como valor devuelto (rama false del ternario).
    expect(r.generated).toContain(`: '${buildId}');`);
    // El placeholder NO debe aparecer en el artefacto generado.
    expect(r.generated).not.toContain('__BUILD_ID__');
  });

  // ─── Contrato 3: idempotencia del artefacto (mismo BUILD_ID = mismo output)
  it('dos ejecuciones de build-sw con el mismo BUILD_ID producen artefactos idénticos', () => {
    const buildId = 'fase3e-idem-002';
    const template = `// header\n${PLACEHOLDER_LINE}\n  ? 'dev'\n  : '__BUILD_ID__');\nconst X = 1;\n`;
    const r1 = runBuildSwInTmpRepo({ template, buildId });
    expect(r1.exitCode).toBe(0);
    const r2 = runBuildSwInTmpRepo({ template, buildId });
    expect(r2.exitCode).toBe(0);
    expect(r2.generated).toBe(r1.generated);
  });

  // ─── Contrato 4: la plantilla NUNCA se modifica (clave del determinismo) ──
  it('build-sw.mjs NO modifica la plantilla public/sw.js (fuente versionada intacta)', () => {
    const buildId = 'fase3e-intacto-003';
    const template = `// header canónico\n${PLACEHOLDER_LINE}\n  ? 'dev'\n  : '__BUILD_ID__');\n// fin\n`;
    const r = runBuildSwInTmpRepo({ template, buildId });
    expect(r.exitCode).toBe(0);
    // La plantilla en disco tras la ejecución debe ser byte-idéntica a la entrada.
    expect(r.templateAfter).toBe(template);
    expect(r.templateAfter).toContain('__BUILD_ID__');
  });

  // ─── Contrato 5: --check no escribe el artefacto ─────────────────────────
  it('--check no genera public/sw.generated.js', () => {
    const buildId = 'fase3e-check-004';
    const template = `// header\n${PLACEHOLDER_LINE}\n  ? 'dev'\n  : '__BUILD_ID__');\n`;
    const r = runBuildSwInTmpRepo({ template, buildId, args: ['--check'] });
    expect(r.exitCode).toBe(0);
    // Sin artefacto generado en disco.
    expect(r.generated).toBe('');
  });

  // ─── Contrato 6: fallback 'dev' si falta .next/BUILD_ID ──────────────────
  it('usa el fallback "dev" si no existe .next/BUILD_ID (no falla, no congela)', () => {
    const template = `// header\n${PLACEHOLDER_LINE}\n  ? 'dev'\n  : '__BUILD_ID__');\n`;
    // buildId undefined → no se crea .next/BUILD_ID.
    const r = runBuildSwInTmpRepo({ template });
    expect(r.exitCode).toBe(0);
    // El placeholder fue reemplazado por 'dev' en ambos sitios del ternario.
    // En runtime: ('dev' === 'dev') ? 'dev' : 'dev' → CACHE = 'pineda-pwa-dev'.
    expect(r.generated).toContain("'dev' === 'dev'");
    expect(r.generated).toContain(": 'dev');");
    expect(r.generated).not.toContain('__BUILD_ID__');
  });

  // ─── Contrato 7: la plantilla canónica del repo funciona end-to-end ──────
  it('la plantilla real public/sw.js del repo genera un artefacto coherente', () => {
    const realTemplate = readTemplate();
    const buildId = 'fase3e-real-repo-005';
    const r = runBuildSwInTmpRepo({ template: realTemplate, buildId });
    expect(r.exitCode).toBe(0);
    // El BUILD_ID reemplaza al placeholder en ambos sitios del ternario.
    expect(r.generated).toContain(`'${buildId}' === '${buildId}'`);
    expect(r.generated).not.toContain('__BUILD_ID__');
    // El artefacto conserva las protecciones R6 (PRIVATE_ROUTES).
    expect(r.generated).toContain('PRIVATE_ROUTES');
    expect(r.generated).toContain('/intranet');
  });
});
