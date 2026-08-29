/**
 * Fase 3D — Tests del script de reconstrucción de claims ausentes.
 *
 * Valida:
 *   1. El JSON generado tiene los 16 claims esperados (7 + 9).
 *   2. Cada claim tiene todos los campos obligatorios del esquema 3C.
 *   3. IDs estables y únicos.
 *   4. Las decisiones están reconciliadas con evidencia canónica
 *      (los claims que citaban Arts. 218-226 como "estafa" están corregidos).
 *   5. Los claims sin fuente verificable están marcados needs_human_review
 *      (no confirmados artificialmente — R12).
 *   6. Idempotencia: el script produce JSON idéntico en dos ejecuciones.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { auditFixtureExists } from './helpers/phase-audit-fixtures';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_PATH = resolve(ROOT, 'docs/audits/fase3d-claims-reconstruidos.json');
const SCRIPT = resolve(ROOT, 'scripts/fase3d-reconstruir-claims-ausentes.ts');
const SKIP_PHASE_AUDITS = !auditFixtureExists('docs/audits/fase3d-claims-reconstruidos.json');

interface ClaimReconstruido {
  id: string;
  slug: string;
  textoActual: string;
  tipoClaim: string;
  importancia: string;
  fuenteAnterior: string;
  fuenteNueva: string;
  procedencia: string;
  norma: string;
  articulo: string;
  pagina: number | null;
  url: string;
  fragmento: string;
  decision: string;
  motivo: string;
  confianza: string;
}

const CAMPOS_OBLIGATORIOS: (keyof ClaimReconstruido)[] = [
  'id',
  'slug',
  'textoActual',
  'tipoClaim',
  'importancia',
  'fuenteAnterior',
  'fuenteNueva',
  'procedencia',
  'norma',
  'articulo',
  'url',
  'fragmento',
  'decision',
  'motivo',
  'confianza',
];

function cargarClaims(): ClaimReconstruido[] {
  if (!existsSync(OUT_PATH)) {
    throw new Error(
      `Falta ${OUT_PATH}. Ejecutar: npx tsx scripts/fase3d-reconstruir-claims-ausentes.ts --aplicar`,
    );
  }
  const raw = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
  return raw.claims as ClaimReconstruido[];
}

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 3D — Reconstrucción de claims ausentes', () => {
  const claims = cargarClaims();

  // ─── Estructura general ──────────────────────────────────────────────────
  it('contiene exactamente 16 claims (7 delitos + 9 estafas)', () => {
    expect(claims).toHaveLength(16);
    const porSlug = claims.reduce<Record<string, number>>((acc, c) => {
      acc[c.slug] = (acc[c.slug] ?? 0) + 1;
      return acc;
    }, {});
    expect(porSlug['delitos-mas-comunes-honduras']).toBe(7);
    expect(porSlug['estafas-fraudes-tipos-penales-honduras']).toBe(9);
  });

  it('cada claim tiene todos los campos obligatorios del esquema 3C', () => {
    for (const c of claims) {
      for (const campo of CAMPOS_OBLIGATORIOS) {
        expect(c[campo], `${c.id}.${campo}`).toBeDefined();
        // articulo, motivo, fuenteNueva NO deben ser string vacío.
        if (['articulo', 'motivo', 'fuenteNueva', 'textoActual'].includes(campo)) {
          expect(String(c[campo]).length, `${c.id}.${campo} no vacío`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('IDs estables y únicos con prefijo de slug', () => {
    const ids = claims.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length); // únicos
    for (const c of claims) {
      const prefix = c.slug.startsWith('delitos')
        ? 'delitos'
        : c.slug.startsWith('estafas')
          ? 'estafas'
          : null;
      expect(prefix, `${c.id} prefijo reconocido`).not.toBeNull();
      expect(c.id).toMatch(new RegExp(`^${prefix}-\\d{2}$`));
    }
  });

  it('importancia solo toma valores canónicos (central|supporting|contextual)', () => {
    const validos = new Set(['central', 'supporting', 'contextual']);
    for (const c of claims) {
      expect(validos.has(c.importancia), `${c.id}.importancia=${c.importancia}`).toBe(true);
    }
  });

  it('decision solo toma valores canónicos', () => {
    const validas = new Set([
      'confirmed',
      'corrected',
      'unsupported',
      'ambiguous',
      'needs_human_review',
    ]);
    for (const c of claims) {
      expect(validas.has(c.decision), `${c.id}.decision=${c.decision}`).toBe(true);
    }
  });

  it('procedencia solo toma valores de la taxonomía de fuentes', () => {
    const validas = new Set([
      'official_primary',
      'official_secondary',
      'institutional_academic',
      'canonical_internal_verified',
      'canonical_internal_unverified',
      'commercial_secondary',
      'unverified',
    ]);
    for (const c of claims) {
      expect(validas.has(c.procedencia), `${c.id}.procedencia=${c.procedencia}`).toBe(true);
    }
  });

  // ─── Reconciliación con evidencia canónica (data/articulos_cp.json) ───────
  it('los claims que citaban Arts. 218-226 como "estafa" están corrected', () => {
    // Estos claims originalmente decían "estafa en arts 218-226" pero esos
    // artículos tratan de TRATA DE PERSONAS, no estafa. Deben estar corrected.
    const arts218 = claims.filter((c) =>
      /218.*226|218 al 226|218-226/.test(c.textoActual),
    );
    expect(arts218.length).toBeGreaterThan(0);
    for (const c of arts218) {
      expect(c.decision, `${c.id} debe estar corrected`).toBe('corrected');
    }
  });

  it('el claim de "apropiación indebida Arts. 253-254" está needs_human_review', () => {
    // Arts. 253-254 tratan de delitos sexuales contra menores, no apropiación
    // indebida. Sin fuente verificable, debe ser needs_human_review (no inventar).
    const c = claims.find((x) =>
      /apropiación indebida|253 y 254/i.test(x.textoActual),
    );
    expect(c, 'claim de apropiación indebida debe existir').toBeDefined();
    expect(c!.decision).toBe('needs_human_review');
    expect(c!.procedencia).toBe('unverified');
  });

  it('no hay claims confirmed sin fuente trazable (R12: honestidad)', () => {
    // Todo claim confirmed debe tener una URL no vacía Y un artículo != N/A,
    // o procedencia canonical_internal_verified / official_*.
    for (const c of claims) {
      if (c.decision === 'confirmed') {
        const tieneUrl = c.url.length > 0;
        const tieneArt = c.articulo !== 'N/A' && c.articulo.length > 0;
        const procOficial = [
          'official_primary',
          'official_secondary',
          'canonical_internal_verified',
        ].includes(c.procedencia);
        expect(
          (tieneUrl && tieneArt) || procOficial,
          `${c.id} confirmed sin trazabilidad`,
        ).toBe(true);
      }
    }
  });

  // ─── Idempotencia del script ─────────────────────────────────────────────
  it('el script es idempotente: dos ejecuciones producen JSON idéntico', () => {
    // Ejecutar dos veces y comparar hash. Es un test de integración lento
    // pero necesario para garantizar reproducibilidad del recálculo.
    const run = (): string => {
      execFileSync('npx', ['tsx', SCRIPT, '--aplicar'], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60_000,
      });
      return createHash('sha256')
        .update(readFileSync(OUT_PATH))
        .digest('hex');
    };

    const h1 = run();
    const h2 = run();
    expect(h2).toBe(h1);
  }, 150_000);
});
