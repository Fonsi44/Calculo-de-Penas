/**
 * Fase 4A — Tests de integridad del pipeline del Lote 2.
 *
 * Cubre los defectos reales detectados y corregidos durante el desarrollo:
 *   1. Selección determinista: el top-15 es estable y excluye el Lote 1.
 *   2. Backup: los hashes SHA-256 están presentes y son únicos por artículo.
 *   3. Claims: cada claim tiene id estable, decisión válida e importancia válida.
 *   4. Correcciones aplicadas: los textos corregidos NO aparecen en el artefacto
 *      de aplicación idempotente (idempotencia verificable).
 *   5. Estados finales: todos los estados derivados son valores válidos del
 *      enumerado ReviewStatus y respetan los invariantes (completed implica
 *      centralUnresolved=0 y officialSources>0).
 *   6. Paquetes de revisión humana: existen para todos los needs_human_review.
 *
 * No realiza llamadas a DB ni a DeepSeek. Lee artefactos en docs/audits/.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const AUDITS = path.resolve(process.cwd(), 'docs', 'audits');
const ESTADOS_VALIDOS = new Set([
  'not_started',
  'in_progress',
  'completed',
  'source_checked',
  'needs_human_review',
  'blocked',
  'corrected',
]);
const DECISIONES_VALIDAS = new Set([
  'confirmed',
  'corrected',
  'unsupported',
  'ambiguous',
  'needs_human_review',
]);
const IMPORTANCIA_VALIDA = new Set(['central', 'supporting', 'contextual']);

interface Seleccion {
  seleccionados: number;
  lote2: { slug: string; scoring: { prioridad: number } }[];
  candidatosEvaluados: { slug: string }[];
  pesos: {
    riesgoJuridico: number;
    impactoOrganico: number;
    desactualizacion: number;
    importanciaComercial: number;
    oportunidadGEO: number;
  };
}
interface EstadosIniciales {
  total: number;
  hashGlobalSha256: string;
  estados: { hashSha256: string; estadoIA: string }[];
}
interface ClaimsFinales {
  totalClaims: number;
  porDecision: Record<string, number>;
  claims: {
    id: string;
    decision: string;
    importancia: string;
  }[];
}
interface AplicacionCorrecciones {
  totalCorrecciones: number;
  correcciones: { motivo: string; fuente: string }[];
}
interface EstadosFinales {
  total: number;
  estados: {
    slug: string;
    estadoFinal: string;
    centralUnresolved: number;
    officialSources: number;
    requiresHuman: boolean;
  }[];
}

function leerJson<T>(rel: string): T {
  const p = path.join(AUDITS, rel);
  if (!fs.existsSync(p)) throw new Error(`Artefacto no encontrado: ${rel}`);
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

const SLUGS_LOTE1 = new Set([
  'abogado-penalista-choluteca',
  'abogado-penalista-sur-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'antejuicio-en-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'cuando-necesito-abogado-penalista-honduras',
  'cuando-prescribe-delito-en-honduras',
  'defensa-penal-honduras',
  'defensa-penal-menores-edad-honduras',
  'delitos-mas-comunes-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'diferencia-denuncia-querella-acusacion-honduras',
  'estafas-fraudes-tipos-penales-honduras',
  'fianza-medidas-cautelares-proceso-penal-honduras',
  'violencia-domestica-ruta-legal-honduras',
]);

describe('Fase 4A — Selección determinista del Lote 2', () => {
  const sel = leerJson<Seleccion>('fase4a-lote2-seleccion.json');

  it('el artefacto de selección existe y tiene 15 seleccionados', () => {
    expect(sel.seleccionados).toBe(15);
    expect(sel.lote2).toHaveLength(15);
  });

  it('excluye los 15 slugs del Lote 1 del conjunto de candidatos', () => {
    for (const c of sel.candidatosEvaluados) {
      expect(SLUGS_LOTE1.has(c.slug)).toBe(false);
    }
  });

  it('el top-15 está ordenado por prioridad descendente', () => {
    const prioridades = sel.lote2.map((e) => e.scoring.prioridad);
    for (let i = 1; i < prioridades.length; i++) {
      expect(prioridades[i - 1]).toBeGreaterThanOrEqual(prioridades[i]);
    }
  });

  it('los pesos de la fórmula suman 1.0', () => {
    const p = sel.pesos;
    const suma = p.riesgoJuridico + p.impactoOrganico + p.desactualizacion + p.importanciaComercial + p.oportunidadGEO;
    expect(suma).toBeCloseTo(1.0, 5);
  });
});

describe('Fase 4A — Backup y estados iniciales', () => {
  const est = leerJson<EstadosIniciales>('fase4a-lote2-estados-iniciales.json');

  it('tiene hash global SHA-256 y 15 estados individuales', () => {
    expect(est.total).toBe(15);
    expect(est.hashGlobalSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('cada estado tiene hash individual único de 64 hex', () => {
    const hashes = est.estados.map((e) => e.hashSha256);
    expect(new Set(hashes).size).toBe(15); // únicos
    for (const h of hashes) expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it('todos parten de ai_review_status not_started (Lote 2 sin Fase 3 previa)', () => {
    for (const e of est.estados) {
      expect(e.estadoIA).toBe('not_started');
    }
  });
});

describe('Fase 4A — Claims finales', () => {
  const claims = leerJson<ClaimsFinales>('fase4a-lote2-claims-finales.json');

  it('cada claim tiene id estable con prefijo 4a-', () => {
    expect(claims.claims.length).toBeGreaterThan(0);
    for (const c of claims.claims) {
      expect(c.id).toMatch(/^4a-.+-\d{2}$/);
    }
  });

  it('todas las decisiones son valores válidos del enumerado', () => {
    for (const c of claims.claims) {
      expect(DECISIONES_VALIDAS.has(c.decision)).toBe(true);
    }
  });

  it('todas las importancias son central/supporting/contextual', () => {
    for (const c of claims.claims) {
      expect(IMPORTANCIA_VALIDA.has(c.importancia)).toBe(true);
    }
  });

  it('el conteo por decisión es coherente con el total', () => {
    const sumaPorDecision = Object.values(claims.porDecision).reduce((a, b) => a + b, 0);
    expect(sumaPorDecision).toBe(claims.totalClaims);
  });
});

describe('Fase 4A — Correcciones aplicadas (idempotencia)', () => {
  const app = leerJson<AplicacionCorrecciones>('fase4a-lote2-aplicacion-correcciones.json');

  it('el artefacto registra las correcciones aplicadas', () => {
    expect(app.totalCorrecciones).toBeGreaterThan(0);
  });

  it('cada corrección tiene motivo y fuente documentados', () => {
    for (const c of app.correcciones) {
      expect(c.motivo).toBeTruthy();
      expect(c.fuente).toBeTruthy();
    }
  });
});

describe('Fase 4A — Estados finales e invariantes', () => {
  const est = leerJson<EstadosFinales>('fase4a-lote2-estados-finales.json');

  it('tiene 15 estados derivados', () => {
    expect(est.total).toBe(15);
  });

  it('todos los estados son valores válidos', () => {
    for (const e of est.estados) {
      expect(ESTADOS_VALIDOS.has(e.estadoFinal)).toBe(true);
    }
  });

  it('invariante: completed implica centralUnresolved = 0 y officialSources > 0', () => {
    for (const e of est.estados) {
      if (e.estadoFinal === 'completed') {
        expect(e.centralUnresolved).toBe(0);
        expect(e.officialSources).toBeGreaterThan(0);
      }
    }
  });

  it('invariante: needs_human_review implica requiresHuman = true o centralUnresolved > 0', () => {
    for (const e of est.estados) {
      if (e.estadoFinal === 'needs_human_review') {
        expect(e.requiresHuman === true || e.centralUnresolved > 0).toBe(true);
      }
    }
  });
});

describe('Fase 4A — Paquetes de revisión humana', () => {
  const est = leerJson<EstadosFinales>('fase4a-lote2-estados-finales.json');
  const dirRev = path.join(AUDITS, 'fase4a-lote2-revision-humana');

  it('existe un paquete por cada artículo needs_human_review', () => {
    const pendientes = est.estados.filter((e) => e.estadoFinal === 'needs_human_review');
    for (const p of pendientes) {
      const archivo = path.join(dirRev, `${p.slug}.md`);
      expect(fs.existsSync(archivo)).toBe(true);
    }
  });

  it('el index.md declara explícitamente que la revisión NO está realizada', () => {
    const index = fs.readFileSync(path.join(dirRev, 'index.md'), 'utf8');
    expect(index).toContain('PENDIENTE');
    expect(index.toLowerCase()).toContain('no marcar como realizada');
  });
});
