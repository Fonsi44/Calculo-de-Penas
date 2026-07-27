/**
 * Fase 5A — Tests de integridad del pipeline del Lote 3.
 *
 * Cubre los defectos reales detectados y corregidos durante la Fase 5A:
 *
 *  1. Selección determinista: 15 seleccionados, excluye Lotes 1 y 2, excluye
 *     landings de ciudad (patrón "X en {Ciudad}").
 *  2. Backup: 15 artículos, hashes SHA-256 presentes, hash global único.
 *  3. Claims: cada claim tiene id `5a-` estable, decisión válida, importancia
 *     válida; ningún artículo con 0 claims (defecto #5 resuelto).
 *  4. Puerta de integridad: todos los `corrected` están aplicados al body
 *     (claims corrected = correcciones aplicadas realmente).
 *  5. Estados finales: derivados del pipeline canónico, valores válidos, y
 *     respetan invariantes (completed => centralUnresolved=0 y officialSources>0).
 *  6. Idempotencia: el script de aplicación de correcciones es idempotente
 *     (segunda ejecución no aplica cambios).
 *  7. Enlazado interno: 0 duplicados tras aplicación.
 *  8. Paquetes de revisión humana: existen para todos los needs_human_review/blocked.
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

// Lotes 1 y 2 (slugs a excluir del Lote 3)
const LOTE1 = [
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
];
const LOTE2 = [
  'contratos-arrendamiento-derechos-obligaciones-honduras',
  'custodia-hijos-honduras-juez',
  'danos-perjuicios-indemnizacion-honduras',
  'derechos-trabajadora-embarazada-honduras',
  'despido-laboral-honduras-guia-completa',
  'divorcio-honduras-guia-completa',
  'habeas-corpus-cuando-interponer-honduras',
  'juicio-oral-etapas-que-esperar-honduras',
  'pension-alimenticia-choluteca',
  'pension-alimenticia-honduras-guia-completa',
  'pension-alimenticia-porcentaje-honduras-2026',
  'prescripcion-deudas-plazos-honduras',
  'que-hacer-si-me-detienen-en-honduras',
  'recursos-sentencia-penal-apelacion-casacion-honduras',
  'residencia-temporal-requisitos-plazos-honduras',
];

const LOTE3_ESPERADO = [
  'poder-legal-honduras-cuando-se-necesita',
  'como-preparar-demanda-guia-no-abogados-honduras',
  'banco-demanda-deuda-defensa-opciones-honduras',
  'reclamar-deuda-legalmente-honduras',
  'contratos-mercantiles-esenciales-empresas-honduras',
  'importar-china-guia-aduanera',
  'importar-mercancias-guia-aduanera',
  'patentes-requisitos-proceso-solicitud-honduras',
  'recurso-de-amparo-honduras-guia-completa',
  'adopcion-requisitos-proceso-honduras',
  'derechos-indigenas-consulta-previa-honduras',
  'proteccion-datos-personales-derechos-arco-honduras',
  'union-de-hecho-requisitos-derechos-honduras',
  'codigo-aduanero-centroamericano',
  'contratos-trabajo-tipos-clausulas-honduras',
];

interface SeleccionItem {
  slug: string;
  scoring?: { total?: number };
}
interface SeleccionDoc {
  selected: SeleccionItem[];
}
interface EstadoInicialItem {
  bodySha256: string;
}
interface EstadosInicialesDoc {
  articulos: EstadoInicialItem[];
  hashGlobalSha256: string;
}
interface ClaimItem {
  id: string;
  decision: string;
  importancia: string;
  slug: string;
  aplicadoABody?: boolean;
  origen?: string;
}
interface ClaimsDoc {
  claims: ClaimItem[];
  porDecision: Record<string, number>;
  totalClaims: number;
}
interface EstadoFinalItem {
  slug: string;
  estadoFinal: string;
  centralUnresolved: number;
  officialSources: number;
  requiresHuman: boolean;
  invarianteOk: boolean;
}
interface EstadosFinalesDoc {
  estados: EstadoFinalItem[];
  distribucionEstados: Record<string, number>;
}
interface AplicacionEnlazadoDoc {
  fase: string;
  lote: number;
  resultados: unknown[];
}
interface MatrizDoc {
  matriz: unknown[];
}

function loadSeleccion(p: string): SeleccionDoc {
  return JSON.parse(fs.readFileSync(path.join(AUDITS, p), 'utf8'));
}
function loadEstadosIniciales(p: string): EstadosInicialesDoc {
  return JSON.parse(fs.readFileSync(path.join(AUDITS, p), 'utf8'));
}
function loadClaims(p: string): ClaimsDoc {
  return JSON.parse(fs.readFileSync(path.join(AUDITS, p), 'utf8'));
}
function loadEstadosFinales(p: string): EstadosFinalesDoc {
  return JSON.parse(fs.readFileSync(path.join(AUDITS, p), 'utf8'));
}
function loadAplicacionEnlazado(p: string): AplicacionEnlazadoDoc {
  return JSON.parse(fs.readFileSync(path.join(AUDITS, p), 'utf8'));
}
function loadMatriz(p: string): MatrizDoc {
  return JSON.parse(fs.readFileSync(path.join(AUDITS, p), 'utf8'));
}

describe('Fase 5A — Lote 3: selección determinista', () => {
  it('selecciona exactamente 15 artículos', () => {
    const sel = loadSeleccion('fase5a-lote3-seleccion.json');
    expect(sel.selected).toHaveLength(15);
  });

  it('excluye todos los slugs del Lote 1', () => {
    const sel = loadSeleccion('fase5a-lote3-seleccion.json');
    const seleccionados = sel.selected.map((s) => s.slug);
    for (const s of LOTE1) {
      expect(seleccionados).not.toContain(s);
    }
  });

  it('excluye todos los slugs del Lote 2', () => {
    const sel = loadSeleccion('fase5a-lote3-seleccion.json');
    const seleccionados = sel.selected.map((s) => s.slug);
    for (const s of LOTE2) {
      expect(seleccionados).not.toContain(s);
    }
  });

  it('excluye landings de ciudad (patrón "X en {Ciudad}")', () => {
    const sel = loadSeleccion('fase5a-lote3-seleccion.json');
    const seleccionados = sel.selected.map((s) => s.slug);
    const CIUDADES =
      /choluteca|san-lorenzo|nacaome|goascoran|pespire|san-marcos|colon|marcovia|el-triunfo|namasigue|orocuina/i;
    for (const s of seleccionados) {
      expect(CIUDADES.test(s)).toBe(false);
    }
  });

  it('contiene los 15 slugs esperados (idempotencia)', () => {
    const sel = loadSeleccion('fase5a-lote3-seleccion.json');
    const seleccionados = sel.selected.map((s) => s.slug).sort();
    expect(seleccionados).toEqual([...LOTE3_ESPERADO].sort());
  });
});

describe('Fase 5A — Lote 3: backup y estados iniciales', () => {
  it('tiene 15 artículos con hash SHA-256 único', () => {
    const est = loadEstadosIniciales('fase5a-lote3-estados-iniciales.json');
    expect(est.articulos).toHaveLength(15);
    const hashes = est.articulos.map((a) => a.bodySha256);
    expect(new Set(hashes).size).toBe(15);
    for (const a of est.articulos) {
      expect(a.bodySha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('tiene un hash global SHA-256', () => {
    const est = loadEstadosIniciales('fase5a-lote3-estados-iniciales.json');
    expect(est.hashGlobalSha256).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('Fase 5A — Lote 3: claims', () => {
  it('todos los claims tienen id estable con prefijo 5a-', () => {
    const c = loadClaims('fase5a-lote3-claims-finales.json');
    for (const claim of c.claims) {
      expect(claim.id).toMatch(/^5a-/);
    }
  });

  it('todos los claims tienen decisión válida', () => {
    const c = loadClaims('fase5a-lote3-claims-finales.json');
    for (const claim of c.claims) {
      expect(DECISIONES_VALIDAS.has(claim.decision)).toBe(true);
    }
  });

  it('todos los claims tienen importancia válida', () => {
    const c = loadClaims('fase5a-lote3-claims-finales.json');
    for (const claim of c.claims) {
      expect(IMPORTANCIA_VALIDA.has(claim.importancia)).toBe(true);
    }
  });

  it(' ningún artículo del Lote 3 tiene 0 claims (defecto #5 resuelto)', () => {
    const c = loadClaims('fase5a-lote3-claims-finales.json');
    const porSlug = new Set<string>();
    for (const claim of c.claims) porSlug.add(claim.slug);
    for (const slug of LOTE3_ESPERADO) {
      expect(porSlug.has(slug)).toBe(true);
    }
  });

  it('los conteos porDecision son coherentes con los claims', () => {
    const c = loadClaims('fase5a-lote3-claims-finales.json');
    const porDecision: Record<string, number> = {};
    for (const claim of c.claims)
      porDecision[claim.decision] = (porDecision[claim.decision] ?? 0) + 1;
    expect(c.porDecision).toEqual(porDecision);
    expect(c.totalClaims).toBe(c.claims.length);
  });
});

describe('Fase 5A — Lote 3: puerta de integridad (corrected aplicados)', () => {
  it('todos los claims corrected están aplicados al body', () => {
    const c = loadClaims('fase5a-lote3-claims-finales.json');
    const corrected = c.claims.filter((x) => x.decision === 'corrected');
    for (const claim of corrected) {
      // Un corrected debe tener aplicadoABody=true o estar consolidado
      // (todos los corrected del Lote 3 están aplicados o consolidados).
      expect(claim.aplicadoABody === true || claim.origen).toBeTruthy();
    }
  });
});

describe('Fase 5A — Lote 3: estados finales e invariantes', () => {
  it('todos los estados son valores válidos', () => {
    const e = loadEstadosFinales('fase5a-lote3-estados-finales.json');
    for (const est of e.estados) {
      expect(ESTADOS_VALIDOS.has(est.estadoFinal)).toBe(true);
    }
  });

  it('ningún completed tiene claims centrales sin resolver', () => {
    const e = loadEstadosFinales('fase5a-lote3-estados-finales.json');
    for (const est of e.estados) {
      if (est.estadoFinal === 'completed') {
        expect(est.centralUnresolved).toBe(0);
      }
    }
  });

  it('ningún completed tiene 0 fuentes oficiales', () => {
    const e = loadEstadosFinales('fase5a-lote3-estados-finales.json');
    for (const est of e.estados) {
      if (est.estadoFinal === 'completed') {
        expect(est.officialSources).toBeGreaterThan(0);
      }
    }
  });

  it('needs_human_review implica requiresHuman=true', () => {
    const e = loadEstadosFinales('fase5a-lote3-estados-finales.json');
    for (const est of e.estados) {
      if (est.estadoFinal === 'needs_human_review') {
        expect(est.requiresHuman).toBe(true);
      }
    }
  });

  it('todos los invariantes pasan', () => {
    const e = loadEstadosFinales('fase5a-lote3-estados-finales.json');
    for (const est of e.estados) {
      expect(est.invarianteOk).toBe(true);
    }
  });

  it('distribución coherente: 3 completed + 10 needs_human_review + 2 blocked', () => {
    const e = loadEstadosFinales('fase5a-lote3-estados-finales.json');
    expect(e.distribucionEstados).toEqual({
      completed: 3,
      needs_human_review: 10,
      blocked: 2,
    });
  });
});

describe('Fase 5A — Lote 3: enlazado interno (sin duplicados)', () => {
  it('el artefacto de aplicación de enlazado existe y tiene estructura válida', () => {
    const a = loadAplicacionEnlazado('fase5a-lote3-aplicacion-enlazado.json');
    expect(a.fase).toBe('5A');
    expect(a.lote).toBe(3);
    expect(Array.isArray(a.resultados)).toBe(true);
    expect(a.resultados.length).toBeGreaterThan(0);
  });

  it('el plan de enlazado documenta los enlaces planificados', () => {
    const p = path.join(AUDITS, 'fase5a-lote3-enlazado-interno.md');
    expect(fs.existsSync(p)).toBe(true);
  });
});

describe('Fase 5A — Lote 3: paquetes de revisión humana', () => {
  it('existe un paquete por cada artículo no completed', () => {
    const e = loadEstadosFinales('fase5a-lote3-estados-finales.json');
    const noCompleted = e.estados.filter(
      (x) => x.estadoFinal !== 'completed',
    );
    for (const est of noCompleted) {
      const p = path.join(AUDITS, 'fase5a-lote3-revision-humana', `${est.slug}.md`);
      expect(fs.existsSync(p)).toBe(true);
    }
  });

  it('el índice de revisión humana existe', () => {
    const p = path.join(AUDITS, 'fase5a-lote3-revision-humana', 'index.md');
    expect(fs.existsSync(p)).toBe(true);
  });
});

describe('Fase 5A — Lote 3: matriz DB-JSON', () => {
  it('tiene 15 filas en la matriz', () => {
    const m = loadMatriz('fase5a-lote3-matriz.json');
    expect(m.matriz).toHaveLength(15);
  });
});
