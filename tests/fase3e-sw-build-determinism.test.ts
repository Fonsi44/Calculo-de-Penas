/**
 * Fase 3E — Determinismo del service worker con arquitectura route handler.
 *
 * Arquitectura activa (post-migración desde build-sw.mjs):
 *   - `public/sw.template.js` es la PLANTILLA versionada con placeholder `__BUILD_ID__`.
 *   - `app/sw.js/route.ts` (Next.js route handler) sirve `/sw.js` dinámicamente,
 *     inyectando BUILD_ID desde VERCEL_DEPLOYMENT_ID o `.next/BUILD_ID`.
 *   - No hay script de build separado ni artefacto generado en disco.
 *
 * Este test valida:
 *   1. La plantilla commiteada conserva el placeholder `__BUILD_ID__`.
 *   2. El route handler existe y es la única fuente del SW.
 *   3. La plantilla no contiene BUILD_ID reales inyectados.
 *   4. La plantilla protege rutas privadas (R6).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEMPLATE_PATH = resolve(ROOT, 'public/sw.template.js');
const ROUTE_HANDLER_PATH = resolve(ROOT, 'app/sw.js/route.ts');

const PLACEHOLDER_LINE =
  "const CACHE = 'pineda-pwa-' + ('__BUILD_ID__' === '__BUILD_ID__'";

function readTemplate(): string {
  return readFileSync(TEMPLATE_PATH, 'utf8');
}

describe('Fase 3E — Service worker determinista (route handler + template)', () => {
  // ─── Contrato 1: la plantilla commiteada lleva el placeholder ─────────────
  it('public/sw.template.js contiene el placeholder __BUILD_ID__ puro', () => {
    expect(existsSync(TEMPLATE_PATH)).toBe(true);
    const sw = readTemplate();
    expect(sw).toContain(PLACEHOLDER_LINE);
    // No debe contener un BUILD_ID real ya inyectado.
    const injected = sw.match(
      /const CACHE = 'pineda-pwa-([A-Za-z0-9_-]+)' \+ \('__BUILD_ID__' === '__BUILD_ID__'/,
    );
    if (injected) {
      expect(injected[1]).toBe('');
    }
  });

  // ─── Contrato 2: el route handler existe y es la fuente canónica ──────────
  it('app/sw.js/route.ts existe como fuente canónica del SW', () => {
    expect(existsSync(ROUTE_HANDLER_PATH)).toBe(true);
    const handler = readFileSync(ROUTE_HANDLER_PATH, 'utf8');
    // Debe leer la plantilla desde public/sw.template.js.
    expect(handler).toContain('sw.template.js');
    // Debe reemplazar el placeholder __BUILD_ID__.
    expect(handler).toContain('__BUILD_ID__');
  });

  // ─── Contrato 3: la plantilla no tiene BUILD_ID real inyectado ────────────
  it('la plantilla NO contiene BUILD_ID reales hardcodeados', () => {
    const sw = readTemplate();
    // El único BUILD_ID que debe aparecer es el placeholder.
    const buildIdPattern = /pineda-pwa-[a-f0-9]{8,}/;
    expect(sw).not.toMatch(buildIdPattern);
    // El placeholder literal sí debe aparecer.
    expect(sw).toContain('__BUILD_ID__');
  });

  // ─── Contrato 4: la plantilla protege rutas privadas (R6) ─────────────────
  it('la plantilla incluye exclusiones de rutas privadas (R6)', () => {
    const sw = readTemplate();
    expect(sw).toContain('PRIVATE_ROUTES');
    expect(sw).toContain('/intranet');
    expect(sw).toContain('/api');
  });

  // ─── Contrato 5: no existe el script obsoleto build-sw.mjs ────────────────
  it('scripts/build-sw.mjs ha sido retirado (arquitectura migrada a route handler)', () => {
    const oldScript = resolve(ROOT, 'scripts/build-sw.mjs');
    expect(existsSync(oldScript)).toBe(false);
  });

  // ─── Contrato 6: no existe el artefacto generado obsoleto ─────────────────
  it('public/sw.generated.js no existe (artefacto obsoleto retirado)', () => {
    const oldArtifact = resolve(ROOT, 'public/sw.generated.js');
    expect(existsSync(oldArtifact)).toBe(false);
  });
});
