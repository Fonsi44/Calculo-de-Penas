/**
 * Fase 3D — Determinismo del service worker y del script bump-sw-cache.
 *
 * Cubre el contrato documentado en `public/sw.js` (comentario CONTRATO fase3d)
 * y en `scripts/bump-sw-cache.mjs`:
 *
 *   1. El archivo commiteado SIEMPRE lleva el placeholder `'pineda-pwa-'`
 *      (nunca un BUILD_ID real). Si se commitea un BUILD_ID inyectado, el árbol
 *      aparece "sucio" tras cada build porque el postbuild reescribe la línea.
 *   2. `bump-sw-cache.mjs` es idempotente: dos ejecuciones con el mismo
 *      `.next/BUILD_ID` producen el mismo `public/sw.js`.
 *   3. Falla de forma controlada si falta `.next/BUILD_ID`.
 *   4. `--check` no escribe en disco.
 *
 * El test NO depende de un `next build` real: simula BUILD_ID con un tmp dir y
 * ejecuta el script como child process. Así es rápido y determinista en CI.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SW_PATH = resolve(ROOT, 'public/sw.js');
const SCRIPT_PATH = resolve(ROOT, 'scripts/bump-sw-cache.mjs');

// Patrón canónico que debe existir en el archivo commiteado (estado base).
// NO debe contener ningún BUILD_ID real inyectado.
const PLACEHOLDER_LINE =
  "const CACHE = 'pineda-pwa-' + ('__BUILD_ID__' === '__BUILD_ID__'";
const REAL_BUILD_ID_LINE = (id: string) =>
  `const CACHE = 'pineda-pwa-${id}' + ('__BUILD_ID__' === '__BUILD_ID__'`;

const FIXTURE_BUILD_ID = 'fase3d-test-build-id-001';

function readSw(): string {
  return readFileSync(SW_PATH, 'utf8');
}

/**
 * Ejecuta `scripts/bump-sw-cache.mjs` con un BUILD_ID fijo, sin tocar el
 * `.next/BUILD_ID` real del entorno. Crea un `.next` temporal en un tmp dir y
 * invoca el script con cwd = tmpRoot, habiendo copiado `public/sw.js` y el
 * script a ese tmpRoot. Devuelve el contenido del sw.js resultante.
 */
function runBumpInTmpRepo(opts: {
  initialSw: string;
  buildId: string;
  args?: string[];
}): { sw: string; exitCode: number; stdout: string; stderr: string } {
  const tmpRoot = resolve(ROOT, '.tmp-fase3d-sw-test');
  rmSync(tmpRoot, { recursive: true, force: true });
  mkdirSync(resolve(tmpRoot, 'public'), { recursive: true });
  mkdirSync(resolve(tmpRoot, '.next'), { recursive: true });
  mkdirSync(resolve(tmpRoot, 'scripts'), { recursive: true });

  writeFileSync(resolve(tmpRoot, 'public/sw.js'), opts.initialSw, 'utf8');
  writeFileSync(
    resolve(tmpRoot, '.next/BUILD_ID'),
    opts.buildId,
    'utf8',
  );
  // Copiar el script real (no un mock) para testear su comportamiento exacto.
  writeFileSync(
    resolve(tmpRoot, 'scripts/bump-sw-cache.mjs'),
    readFileSync(SCRIPT_PATH, 'utf8'),
    'utf8',
  );

  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    stdout = execFileSync('node', [
      resolve(tmpRoot, 'scripts/bump-sw-cache.mjs'),
      ...(opts.args ?? []),
    ], {
      cwd: tmpRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    stdout = e.stdout ?? '';
    stderr = e.stderr ?? '';
    exitCode = e.status ?? 1;
  }

  const sw = existsSync(resolve(tmpRoot, 'public/sw.js'))
    ? readFileSync(resolve(tmpRoot, 'public/sw.js'), 'utf8')
    : '';

  return { sw, exitCode, stdout, stderr };
}

function cleanupTmp() {
  rmSync(resolve(ROOT, '.tmp-fase3d-sw-test'), {
    recursive: true,
    force: true,
  });
}

describe('Fase 3D — Service worker determinista', () => {
  beforeAll(() => cleanupTmp());

  // ─── Contrato 1: el archivo commiteado lleva el placeholder ───────────────
  it('public/sw.js commiteado contiene el placeholder puro (no un BUILD_ID real)', () => {
    const sw = readSw();
    expect(sw).toContain(PLACEHOLDER_LINE);
    // No debe contener un BUILD_ID real ya inyectado (patrón 'pineda-pwa-<algo>'
    // donde <algo> NO es el placeholder vacío ni 'dev').
    const injected = sw.match(
      /const CACHE = 'pineda-pwa-([A-Za-z0-9_-]+)' \+ \('__BUILD_ID__' === '__BUILD_ID__'/,
    );
    // El grupo capturado, si existe, debe estar vacío (placeholder) — NO un hash.
    if (injected) {
      expect(injected[1]).toBe('');
    }
  });

  // ─── Contrato 2: idempotencia — dos bumps con mismo BUILD_ID = mismo output ──
  it('dos ejecuciones consecutivas de bump-sw-cache producen sw.js idéntico', () => {
    const baseSw = `// header
${PLACEHOLDER_LINE}
  ? 'dev'
  : '__BUILD_ID__');
const PRECACHE = ['/', '/manifest.json'];
`;

    const r1 = runBumpInTmpRepo({
      initialSw: baseSw,
      buildId: FIXTURE_BUILD_ID,
    });
    expect(r1.exitCode).toBe(0);
    expect(r1.sw).toContain(REAL_BUILD_ID_LINE(FIXTURE_BUILD_ID));

    const r2 = runBumpInTmpRepo({
      initialSw: r1.sw,
      buildId: FIXTURE_BUILD_ID,
    });
    expect(r2.exitCode).toBe(0);
    expect(r2.sw).toBe(r1.sw);
  });

  // ─── Contrato 2b: el bump restaura un BUILD_ID real previo al placeholder ──
  it('restaura un BUILD_ID real commiteado al placeholder antes de inyectar el nuevo', () => {
    // Simula el estado previo (HEAD antiguo): BUILD_ID real en el archivo.
    const dirtySw = `// header
${REAL_BUILD_ID_LINE('old-build-id-stale')}
  ? 'dev'
  : '__BUILD_ID__');
const PRECACHE = ['/', '/manifest.json'];
`;
    const r = runBumpInTmpRepo({
      initialSw: dirtySw,
      buildId: FIXTURE_BUILD_ID,
    });
    expect(r.exitCode).toBe(0);
    expect(r.sw).toContain(REAL_BUILD_ID_LINE(FIXTURE_BUILD_ID));
    expect(r.sw).not.toContain('old-build-id-stale');
  });

  // ─── Contrato 3: falla si falta .next/BUILD_ID ────────────────────────────
  it('falla con exit != 0 si no existe .next/BUILD_ID', () => {
    const tmpRoot = resolve(ROOT, '.tmp-fase3d-sw-test-nobuildid');
    rmSync(tmpRoot, { recursive: true, force: true });
    mkdirSync(resolve(tmpRoot, 'public'), { recursive: true });
    mkdirSync(resolve(tmpRoot, 'scripts'), { recursive: true });
    writeFileSync(resolve(tmpRoot, 'public/sw.js'), PLACEHOLDER_LINE, 'utf8');
    writeFileSync(
      resolve(tmpRoot, 'scripts/bump-sw-cache.mjs'),
      readFileSync(SCRIPT_PATH, 'utf8'),
      'utf8',
    );
    // NO se crea .next/BUILD_ID

    let exitCode = 0;
    try {
      execFileSync('node', [
        resolve(tmpRoot, 'scripts/bump-sw-cache.mjs'),
      ], { cwd: tmpRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err: unknown) {
      exitCode = (err as { status?: number }).status ?? 1;
    }

    rmSync(tmpRoot, { recursive: true, force: true });
    expect(exitCode).not.toBe(0);
  });

  // ─── Contrato 4: --check no escribe en disco ─────────────────────────────
  it('--check no modifica public/sw.js', () => {
    const baseSw = `// header
${PLACEHOLDER_LINE}
  ? 'dev'
  : '__BUILD_ID__');
`;
    const r = runBumpInTmpRepo({
      initialSw: baseSw,
      buildId: FIXTURE_BUILD_ID,
      args: ['--check'],
    });
    expect(r.exitCode).toBe(0);
    expect(r.sw).toBe(baseSw); // sin cambios
    expect(r.sw).toContain(PLACEHOLDER_LINE);
    expect(r.sw).not.toContain(FIXTURE_BUILD_ID);
  });
});
