/**
 * Fase 7 — Tests de inventario y coherencia
 *
 * Validan que el inventario extraído desde Neon es coherente,
 * que los lotes cubren todos los artículos elegibles,
 * y que no hay duplicados ni huecos.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { auditFixtureExists } from './helpers/phase-audit-fixtures';

const AUDIT_DIR = path.resolve('docs/audits');
const SKIP_PHASE_AUDITS = !auditFixtureExists('docs/audits/fase7-inventario-global.json');

function loadJson(filename: string) {
  const filePath = path.join(AUDIT_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 7 — Inventario global', () => {
  const inventario = loadJson('fase7-inventario-global.json');
  it('el inventario global existe y tiene estructura correcta', () => {
    expect(inventario).not.toBeNull();
    expect(inventario.metadata).toBeDefined();
    expect(inventario.metadata.total_registros).toBeGreaterThan(0);
    expect(inventario.elegibles).toBeInstanceOf(Array);
    expect(inventario.excluidos).toBeInstanceOf(Array);
  });

  it('total_registros = elegibles + excluidos', () => {
    expect(inventario.metadata.total_registros).toBe(
      inventario.elegibles.length + inventario.excluidos.length
    );
  });

  it('todos los elegibles tienen campos obligatorios', () => {
    for (const r of inventario.elegibles as Array<Record<string, unknown>>) {
      expect(r.slug).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.url).toBeTruthy();
      expect(r.category).toBeTruthy();
      expect(r.elegible).toBe(true);
      expect(r.bodyHash).toBeTruthy();
    }
  });

  it('todos los excluidos tienen motivo', () => {
    for (const r of inventario.excluidos as Array<Record<string, unknown>>) {
      expect(r.motivo).toBeTruthy();
      expect(r.elegible).toBe(false);
    }
  });

  it('no hay slugs duplicados entre elegibles y excluidos', () => {
    const elegibleSlugs = new Set((inventario.elegibles as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => r.slug as string));
    const excluidoSlugs = (inventario.excluidos as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => r.slug as string);
    for (const slug of excluidoSlugs) {
      expect(elegibleSlugs.has(slug)).toBe(false);
    }
  });

  it('todos los slugs son únicos dentro de elegibles', () => {
    const slugs = (inventario.elegibles as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => r.slug as string);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('las URLs de elegibles tienen el formato correcto', () => {
    for (const r of inventario.elegibles as Array<Record<string, unknown>>) {
      expect(r.url).toMatch(/^https:\/\/www\.pinedayasociadoshn\.com\/blog\/.+\/.+$/);
    }
  });
});

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 7 — Plan de lotes', () => {
  const inventario = loadJson('fase7-inventario-global.json');
  const planLotes = loadJson('fase7-plan-lotes.json');

  it('el plan de lotes existe', () => {
    expect(planLotes).not.toBeNull();
    expect(planLotes.lotes).toBeInstanceOf(Array);
    expect(planLotes.lotes.length).toBeGreaterThan(0);
  });

  it('cubre todos los artículos elegibles sin duplicados', () => {
    const allSlugsPlan: string[] = [];
    for (const lote of planLotes.lotes as Array<{ articulos: string[] }>) {
      allSlugsPlan.push(...lote.articulos);
    }
    
    const elegibleSlugs = (inventario.elegibles as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => r.slug as string);
    
    // Todos los del plan están en elegibles
    for (const slug of allSlugsPlan) {
      expect(elegibleSlugs).toContain(slug);
    }
    
    // Todos los elegibles están en el plan
    for (const slug of elegibleSlugs) {
      expect(allSlugsPlan).toContain(slug);
    }
    
    // No hay duplicados en el plan
    expect(new Set(allSlugsPlan).size).toBe(allSlugsPlan.length);
  });

  it('cada lote tiene máximo 15 artículos', () => {
    for (const lote of planLotes.lotes as Array<{ count: number; articulos: string[] }>) {
      expect(lote.count).toBeLessThanOrEqual(15);
      expect(lote.articulos.length).toBe(lote.count);
    }
  });

  it('los lotes tienen nombres secuenciales A-I', () => {
    const expectedLotes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const actualLotes = (planLotes.lotes as Array<{ lote: string }>).map((l: { lote: string }) => l.lote);
    expect(actualLotes).toEqual(expectedLotes);
  });
});

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 7 — Artefactos de auditoría', () => {
  const planLotes = loadJson('fase7-plan-lotes.json');
  const allSlugs: string[] = [];
  for (const lote of planLotes.lotes) {
    allSlugs.push(...lote.articulos);
  }

  it('existen directorios para cada artículo en cada lote', () => {
    for (const lote of planLotes.lotes) {
      for (const slug of lote.articulos) {
        const dir = path.join(AUDIT_DIR, 'fase7', `lote-${lote.lote}`, slug);
        expect(fs.existsSync(dir)).toBe(true);
      }
    }
  });

  it('los artefactos JSON son parseables', () => {
    const artefactos = findArtifacts();
    for (const filePath of artefactos) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    }
  });

  it('los decision-final.json completados tienen estructura correcta', () => {
    const decisiones = findArtifacts().filter(f => f.endsWith('decision-final.json'));
    for (const filePath of decisiones) {
      const d = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(d.slug).toBeTruthy();
      expect(d.puntuaciones).toBeDefined();
      expect(d.puntuaciones.legal).toBeGreaterThanOrEqual(0);
      expect(d.puntuaciones.seo).toBeGreaterThanOrEqual(0);
      expect(d.puntuaciones.geo).toBeGreaterThanOrEqual(0);
      expect(d.puntuacion_ponderada).toBeGreaterThanOrEqual(0);
      expect(d.estado_final).toBeTruthy();
    }
  });

  it('ningún decision-final tiene puntuación > 10', () => {
    const decisiones = findArtifacts().filter(f => f.endsWith('decision-final.json'));
    for (const filePath of decisiones) {
      const d = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(d.puntuaciones.legal).toBeLessThanOrEqual(10);
      expect(d.puntuaciones.seo).toBeLessThanOrEqual(10);
      expect(d.puntuaciones.geo).toBeLessThanOrEqual(10);
      expect(d.puntuacion_ponderada).toBeLessThanOrEqual(10);
    }
  });
});

function findArtifacts(): string[] {
  const results: string[] = [];
  const baseDir = path.join(AUDIT_DIR, 'fase7');
  if (!fs.existsSync(baseDir)) return results;
  
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.json')) {
        results.push(fullPath);
      }
    }
  }
  
  walk(baseDir);
  return results;
}
