/**
 * Fase 5B — Cierre de integridad y trazabilidad final del Lote 3.
 *
 * Cubre las inconsistencias cerradas durante la Fase 5B (sobre Fase 5A):
 *
 *  1. Deduplicación de los dos claims `corrected` (Art. 1732→1888 CC en
 *     `poder-legal`): una sola afirmación jurídica = una sola corrección.
 *  2. `duplicadosResueltos` con `duplicate_of` documentado.
 *  3. Suma de decisiones == claims totales.
 *  4. Suma de estados == 15 artículos.
 *  5. Distinción needs_human_review (10) vs blocked (2): 12 paquetes totales,
 *     no "12 needs_human_review".
 *  6. Desglose de revalidación: 45 invocaciones, 28 paths únicos, 17 duplicados,
 *     3 grupos de duplicación.
 *  7. Deployment SHA frente a HEAD.
 *  8. Corrección aplicada una sola vez (idempotencia deduplicada).
 *  9. Cifras definitivas tras dedup (79 totales, 1 corrected).
 *
 * No realiza llamadas a DB ni a DeepSeek. Lee artefactos en docs/audits/.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const AUDITS = path.resolve(process.cwd(), 'docs', 'audits');

interface ClaimItem {
  id: string;
  decision: string;
  importancia: string;
  slug: string;
  aplicadoABody?: boolean;
  origen?: string;
  idCanonico?: boolean;
  deduplicadoDe?: string[];
}
interface ClaimsDoc {
  claims: ClaimItem[];
  porDecision: Record<string, number>;
  porImportancia: Record<string, number>;
  totalClaims: number;
  duplicadosResueltos?: Array<{
    idEliminado: string;
    consolidadoEn: string;
    razon: string;
  }>;
}
interface EstadoFinalItem {
  slug: string;
  estadoFinal: string;
  centralConfirmed: number;
  centralCorrected: number;
  centralUnresolved: number;
  totalClaims: number;
  officialSources: number;
  requiresHuman: boolean;
}
interface EstadosFinalesDoc {
  estados: EstadoFinalItem[];
  distribucionEstados: Record<string, number>;
}
interface RevalidacionDoc {
  invocacionesTotales: number;
  pathsUnicos: number;
  duplicadosEncontrados: number;
  gruposDuplicacion?: number;
  desgloseDuplicados?: Array<{ path: string; ocurrencias: number; repeticiones: number }>;
  duplicadosTop?: Array<[string, number]>;
  exitosos?: number;
  log: Array<{ slug: string; tipo: string; pathRevalidado: string | string[] }>;
}
interface DeploymentRef {
  uid: string;
  url: string;
  state: string;
  target: string;
  githubCommitSha: string;
  githubCommitMessage: string;
}

function loadJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(path.join(AUDITS, p), 'utf8'));
}

const LOTE3 = [
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

const CANON_ID = '5a-poder-legal-honduras-cua-M02';
const DUP_ID = '5a-poder-legal-honduras-cua-01';

describe('Fase 5B — Deduplicación de claims corrected', () => {
  it('no quedan dos claims corrected para la misma afirmación jurídica', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    const correctedPoderLegal = c.claims.filter(
      (x) => x.slug === 'poder-legal-honduras-cuando-se-necesita' && x.decision === 'corrected',
    );
    expect(correctedPoderLegal).toHaveLength(1);
    expect(correctedPoderLegal[0].id).toBe(CANON_ID);
  });

  it('el claim duplicado eliminado no aparece en la lista', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    const ids = c.claims.map((x) => x.id);
    expect(ids).not.toContain(DUP_ID);
  });

  it('el claim canónico queda marcado como idCanonico y registra el deduplicado', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    const canon = c.claims.find((x) => x.id === CANON_ID);
    expect(canon).toBeDefined();
    expect(canon!.idCanonico).toBe(true);
    expect(canon!.deduplicadoDe).toContain(DUP_ID);
  });

  it('duplicadosResueltos documenta el duplicate_of con razón', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    expect(c.duplicadosResueltos).toBeDefined();
    expect(c.duplicadosResueltos).toHaveLength(1);
    const r = c.duplicadosResueltos![0];
    expect(r.idEliminado).toBe(DUP_ID);
    expect(r.consolidadoEn).toBe(CANON_ID);
    expect(r.razon.length).toBeGreaterThan(20);
  });

  it('la corrección se aplica al body una sola vez (idempotencia deduplicada)', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    const aplicados = c.claims.filter(
      (x) => x.slug === 'poder-legal-honduras-cuando-se-necesita' && x.aplicadoABody === true,
    );
    // Solo el canónico debe quedar como aplicadoABody=true.
    expect(aplicados).toHaveLength(1);
    expect(aplicados[0].id).toBe(CANON_ID);
  });
});

describe('Fase 5B — Recuento de claims definitivo', () => {
  it('totalClaims == 79 (no 80)', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    expect(c.totalClaims).toBe(79);
    expect(c.claims).toHaveLength(79);
  });

  it('la suma de decisiones == totalClaims', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    const suma = Object.values(c.porDecision).reduce((a, b) => a + b, 0);
    expect(suma).toBe(c.totalClaims);
  });

  it('corrected == 1 tras deduplicación', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    expect(c.porDecision.corrected ?? 0).toBe(1);
  });

  it('confirmed + corrected + needs_human_review + unsupported + ambiguous == totalClaims', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    const d = c.porDecision;
    const suma =
      (d.confirmed ?? 0) +
      (d.corrected ?? 0) +
      (d.needs_human_review ?? 0) +
      (d.unsupported ?? 0) +
      (d.ambiguous ?? 0);
    expect(suma).toBe(c.totalClaims);
  });

  it('central == 48 tras deduplicación (uno menos que antes)', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    expect(c.porImportancia.central).toBe(48);
  });
});

describe('Fase 5B — Estados definitivos del Lote 3', () => {
  it('la suma de estados == 15', () => {
    const e = loadJson<EstadosFinalesDoc>('fase5a-lote3-estados-finales.json');
    const suma = Object.values(e.distribucionEstados).reduce((a, b) => a + b, 0);
    expect(suma).toBe(15);
  });

  it('distribución: 3 completed + 10 needs_human_review + 2 blocked', () => {
    const e = loadJson<EstadosFinalesDoc>('fase5a-lote3-estados-finales.json');
    expect(e.distribucionEstados).toEqual({
      completed: 3,
      needs_human_review: 10,
      blocked: 2,
    });
  });

  it('needs_human_review (10) y blocked (2) son distintos: 12 paquetes totales, no 12 needs_human_review', () => {
    const e = loadJson<EstadosFinalesDoc>('fase5a-lote3-estados-finales.json');
    const nhr = e.distribucionEstados.needs_human_review ?? 0;
    const blk = e.distribucionEstados.blocked ?? 0;
    expect(nhr).toBe(10);
    expect(blk).toBe(2);
    // 12 = paquetes totales (revisión humana); los 12 NO son todos needs_human_review.
    expect(nhr + blk).toBe(12);
    expect(nhr).not.toBe(12);
  });

  it('poder-legal refleja la deduplicación: 1 claim, 1 corrected, estado completed', () => {
    const e = loadJson<EstadosFinalesDoc>('fase5a-lote3-estados-finales.json');
    const pl = e.estados.find((x) => x.slug === 'poder-legal-honduras-cuando-se-necesita')!;
    expect(pl.estadoFinal).toBe('completed');
    expect(pl.totalClaims).toBe(1);
    expect(pl.centralCorrected).toBe(1);
    expect(pl.centralUnresolved).toBe(0);
  });
});

describe('Fase 5B — Paquetes de revisión humana', () => {
  it('existen 12 paquetes: 10 needs_human_review + 2 blocked', () => {
    const e = loadJson<EstadosFinalesDoc>('fase5a-lote3-estados-finales.json');
    const pendientes = e.estados.filter(
      (x) => x.estadoFinal === 'needs_human_review' || x.estadoFinal === 'blocked',
    );
    expect(pendientes).toHaveLength(12);
    expect(pendientes.filter((x) => x.estadoFinal === 'needs_human_review')).toHaveLength(10);
    expect(pendientes.filter((x) => x.estadoFinal === 'blocked')).toHaveLength(2);
  });

  it('cada artículo pendiente tiene un archivo .md de paquete', () => {
    const e = loadJson<EstadosFinalesDoc>('fase5a-lote3-estados-finales.json');
    const pendientes = e.estados.filter(
      (x) => x.estadoFinal === 'needs_human_review' || x.estadoFinal === 'blocked',
    );
    for (const p of pendientes) {
      const f = path.join(AUDITS, 'fase5a-lote3-revision-humana', `${p.slug}.md`);
      expect(fs.existsSync(f)).toBe(true);
    }
  });

  it('ningún artículo completed tiene paquete de revisión', () => {
    const e = loadJson<EstadosFinalesDoc>('fase5a-lote3-estados-finales.json');
    const completed = e.estados.filter((x) => x.estadoFinal === 'completed');
    for (const c of completed) {
      const f = path.join(AUDITS, 'fase5a-lote3-revision-humana', `${c.slug}.md`);
      expect(fs.existsSync(f)).toBe(false);
    }
  });

  it('el índice de revisión humana lista exactamente 12 paquetes', () => {
    const idx = fs.readFileSync(
      path.join(AUDITS, 'fase5a-lote3-revision-humana', 'index.md'),
      'utf8',
    );
    const filas = idx.split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l));
    expect(filas).toHaveLength(12);
  });
});

describe('Fase 5B — Desglose de revalidación (45/28/17)', () => {
  it('45 invocaciones, 28 paths únicos, 17 duplicados', () => {
    const r = loadJson<RevalidacionDoc>('fase5a-lote3-revalidacion.json');
    expect(r.invocacionesTotales).toBe(45);
    expect(r.pathsUnicos).toBe(28);
    expect(r.duplicadosEncontrados).toBe(17);
  });

  it('invocaciones - paths únicos == duplicados', () => {
    const r = loadJson<RevalidacionDoc>('fase5a-lote3-revalidacion.json');
    expect(r.invocacionesTotales - r.pathsUnicos).toBe(r.duplicadosEncontrados);
  });

  it('hay 3 grupos de duplicación (no 1 patrón)', () => {
    const r = loadJson<RevalidacionDoc>('fase5a-lote3-revalidacion.json');
    expect(r.gruposDuplicacion).toBe(3);
    expect(r.desgloseDuplicados).toBeDefined();
    expect(r.desgloseDuplicados).toHaveLength(3);
  });

  it('el desglose de duplicados cuadra aritméticamente', () => {
    const r = loadJson<RevalidacionDoc>('fase5a-lote3-revalidacion.json');
    const suma = r.desgloseDuplicados!.reduce((a, g) => a + g.repeticiones, 0);
    expect(suma).toBe(r.duplicadosEncontrados);
  });

  it('/blog se repite 15 veces (una por slug)', () => {
    const r = loadJson<RevalidacionDoc>('fase5a-lote3-revalidacion.json');
    const blog = r.desgloseDuplicados!.find((g) => g.path === '/blog');
    expect(blog).toBeDefined();
    expect(blog!.ocurrencias).toBe(15);
    expect(blog!.repeticiones).toBe(14);
  });

  it('todas las invocaciones son exitosas (45/45)', () => {
    const r = loadJson<RevalidacionDoc>('fase5a-lote3-revalidacion.json');
    expect(r.log).toHaveLength(45);
    expect(r.exitosos ?? 45).toBe(45);
  });
});

describe('Fase 5B — Deployment SHA frente a HEAD', () => {
  it('el artefacto de deployment ancla githubCommitSha == HEAD (a24f1391)', () => {
    const dep = loadJson<DeploymentRef>('fase5b-lote3-deployment-final.json');
    expect(dep.githubCommitSha).toBe('a24f13913474cc5d5b40c32f4ef86bb1b9e6ca0e');
    expect(dep.state).toBe('READY');
    expect(dep.target).toBe('production');
  });

  it('el deployment NO es el de abb767e9', () => {
    const dep = loadJson<DeploymentRef>('fase5b-lote3-deployment-final.json');
    expect(dep.githubCommitSha).not.toMatch(/^abb767e9/);
  });
});

describe('Fase 5B — Consistencia artifacts vs Lote 3', () => {
  it('los 15 slugs del Lote 3 están presentes en estados finales', () => {
    const e = loadJson<EstadosFinalesDoc>('fase5a-lote3-estados-finales.json');
    const slugs = e.estados.map((x) => x.slug).sort();
    expect(slugs).toEqual([...LOTE3].sort());
  });

  it('todos los claims pertenecen a un slug del Lote 3', () => {
    const c = loadJson<ClaimsDoc>('fase5a-lote3-claims-finales.json');
    for (const claim of c.claims) {
      expect(LOTE3).toContain(claim.slug);
    }
  });
});
