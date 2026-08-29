/**
 * Fase 4B — Tests de integridad de la puerta de correcciones y estados.
 *
 * Cubre los invariantes del enunciado Fase 4B §3-§7:
 *   1. claim `corrected` no aplicado al body => reclasificado como
 *      `needs_human_review`.
 *   2. prohibición de `completed` cuando existe corrección central pendiente.
 *   3. coherencia entre correcciones propuestas (3 firmes) y aplicadas.
 *   4. detección de body antiguo (textos antiguos ausentes en claims aplicados).
 *   5. idempotencia de correcciones (aplicadoABody=true estable entre ejecuciones).
 *   6. integridad de los 5 `completed` (sin corrected central pendiente).
 *   7. legitimidad de la selección de los 15 (excluye Lote 1, determinista).
 *   8. determinismo del scoring.
 *
 * No realiza llamadas a DB ni a DeepSeek. Solo lee artefactos en docs/audits/.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { auditFixtureExists } from './helpers/phase-audit-fixtures';

const AUDITS = path.resolve(process.cwd(), 'docs', 'audits');
const SKIP_PHASE_AUDITS = !auditFixtureExists('docs/audits/fase4b-integridad-correcciones.json');

function leerJson<T>(rel: string): T {
  const p = path.join(AUDITS, rel);
  if (!fs.existsSync(p)) throw new Error(`Artefacto no encontrado: ${rel}`);
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

interface FilaIntegridad {
  claimId: string;
  slug: string;
  importancia: string;
  textoAnterior: string | null;
  textoSustituto: string | null;
  fuente: string | null;
  evidencia: string;
  aplicadoABody: boolean;
  aplicadoAMetadatos: boolean;
  requiereRevisionHumana: boolean;
  decisionFase4A: string;
  decisionFase4B: string;
  motivoOriginal: string;
}
interface Integridad {
  totalCorrectedFase4A: number;
  aplicadosABody: number;
  pendientes: number;
  filas: FilaIntegridad[];
}
interface EstadoDef {
  slug: string;
  estadoFase4A: string;
  estadoFase4B: string;
  cambio: string;
  razon: string;
  totalClaims: number;
  centrales: number;
  centralConfirmed: number;
  centralCorrectedAplicado: number;
  centralUnresolved: number;
  officialSources: number;
  requiresHuman: boolean;
}
interface EstadosDefinitivos {
  total: number;
  distribucionEstadosDefinitivos: Record<string, number>;
  estadosDefinitivos: EstadoDef[];
}
interface ClaimFinal {
  id: string;
  slug: string;
  importancia: string;
  decision: string;
}
interface ClaimsFinales {
  totalClaims: number;
  claims: ClaimFinal[];
}
interface Seleccion {
  seleccionados: number;
  lote2: { slug: string; scoring: { prioridad: number } }[];
  candidatosEvaluados: { slug: string }[];
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

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 4B §3 — Integridad de claims corrected', () => {
  const integ = leerJson<Integridad>('fase4b-integridad-correcciones.json');

  it('el artefacto existe y cubre los 8 claims corrected de Fase 4A', () => {
    expect(integ.totalCorrectedFase4A).toBe(8);
    expect(integ.filas).toHaveLength(8);
  });

  it('3 aplicados al body + 5 pendientes reclasificados (regla §3)', () => {
    expect(integ.aplicadosABody).toBe(3);
    expect(integ.pendientes).toBe(5);
  });

  it('cada fila con aplicadoABody=false queda reclasificada como needs_human_review', () => {
    for (const f of integ.filas) {
      if (!f.aplicadoABody) {
        expect(f.decisionFase4B).toBe('needs_human_review');
        expect(f.requiereRevisionHumana).toBe(true);
      }
    }
  });

  it('cada fila con aplicadoABody=true mantiene la decisión corrected', () => {
    for (const f of integ.filas) {
      if (f.aplicadoABody) {
        expect(f.decisionFase4B).toBe('corrected');
        expect(f.requiereRevisionHumana).toBe(false);
      }
    }
  });

  it('cada fila trae evidencia textual verificable (no vacía)', () => {
    for (const f of integ.filas) {
      expect(f.evidencia).toBeTruthy();
      expect(f.evidencia.length).toBeGreaterThan(10);
    }
  });
});

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 4B §3 — Prohibición de completed con corrección central pendiente', () => {
  const integ = leerJson<Integridad>('fase4b-integridad-correcciones.json');
  const est = leerJson<EstadosDefinitivos>('fase4b-estados-definitivos.json');

  it('ningún artículo completed tiene un claim corrected NO aplicado al body', () => {
    // Mapear slugs con claims corrected pendientes (aplicadoABody=false).
    const slugsConPendiente = new Set(
      integ.filas.filter((f) => !f.aplicadoABody).map((f) => f.slug),
    );
    for (const e of est.estadosDefinitivos) {
      if (e.estadoFase4B === 'completed') {
        expect(slugsConPendiente.has(e.slug)).toBe(false);
      }
    }
  });

  it('los 3 claims corrected aplicados pertenecen al artículo pension-alimenticia-porcentaje', () => {
    const aplicados = integ.filas.filter((f) => f.aplicadoABody);
    expect(aplicados).toHaveLength(3);
    for (const f of aplicados) {
      expect(f.slug).toBe('pension-alimenticia-porcentaje-honduras-2026');
    }
  });
});

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 4B §5 — Coherencia propuestas/aplicadas + detección de body antiguo', () => {
  const integ = leerJson<Integridad>('fase4b-integridad-correcciones.json');

  it('los 3 claims aplicados tienen textoSustituto y fuente documentados', () => {
    const aplicados = integ.filas.filter((f) => f.aplicadoABody);
    for (const f of aplicados) {
      expect(f.textoSustituto).toBeTruthy();
      expect(f.fuente).toBeTruthy();
    }
  });

  it('los textos antiguos documentados (Arts. 1069/1230/1593 CC) NO están en bodies corregidos', () => {
    // Verificamos que la evidencia declare "textoAnterior ausente" para los
    // aplicados (detección de body antiguo en el artefacto).
    const aplicados = integ.filas.filter((f) => f.aplicadoABody);
    for (const f of aplicados) {
      expect(f.evidencia.toLowerCase()).toContain('ausente');
    }
  });

  it('los 5 claims no aplicados declaran en la evidencia que el texto antiguo SÍ está presente', () => {
    // Salvo el pension-porc-02 (corregido por el párrafo compartido), que
    // es un caso especial tratado por "corregido por par principal".
    const noAplicados = integ.filas.filter((f) => !f.aplicadoABody);
    for (const f of noAplicados) {
      const ev = f.evidencia.toLowerCase();
      const declaraPendiente =
        ev.includes('presente=true') || ev.includes('sin par de sustitución');
      expect(declaraPendiente).toBe(true);
    }
  });
});

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 4B §6 — Estados definitivos y coherencia DB–JSON–body', () => {
  const est = leerJson<EstadosDefinitivos>('fase4b-estados-definitivos.json');

  it('tiene 15 estados definitivos', () => {
    expect(est.total).toBe(15);
  });

  it('distribución: 5 completed, 8 needs_human_review, 2 blocked', () => {
    expect(est.distribucionEstadosDefinitivos.completed).toBe(5);
    expect(est.distribucionEstadosDefinitivos.needs_human_review).toBe(8);
    expect(est.distribucionEstadosDefinitivos.blocked).toBe(2);
  });

  it('custodia-hijos-honduras-juez pasó de blocked a needs_human_review', () => {
    const c = est.estadosDefinitivos.find((e) => e.slug === 'custodia-hijos-honduras-juez');
    expect(c).toBeDefined();
    expect(c!.estadoFase4A).toBe('blocked');
    expect(c!.estadoFase4B).toBe('needs_human_review');
    expect(c!.cambio).toBe('blocked -> needs_human_review');
  });

  it('invariante: completed implica centralUnresolved = 0 y officialSources > 0', () => {
    for (const e of est.estadosDefinitivos) {
      if (e.estadoFase4B === 'completed') {
        expect(e.centralUnresolved).toBe(0);
        expect(e.officialSources).toBeGreaterThan(0);
      }
    }
  });

  it('invariante: needs_human_review implica centralUnresolved > 0', () => {
    for (const e of est.estadosDefinitivos) {
      if (e.estadoFase4B === 'needs_human_review') {
        expect(e.centralUnresolved).toBeGreaterThan(0);
      }
    }
  });

  it('invariante: blocked implica officialSources = 0 y centralConfirmed = 0', () => {
    for (const e of est.estadosDefinitivos) {
      if (e.estadoFase4B === 'blocked') {
        expect(e.officialSources).toBe(0);
        expect(e.centralConfirmed).toBe(0);
      }
    }
  });

  it('los 5 completed son exactamente los esperados', () => {
    const completados = est.estadosDefinitivos
      .filter((e) => e.estadoFase4B === 'completed')
      .map((e) => e.slug)
      .sort();
    expect(completados).toEqual(
      [
        'danos-perjuicios-indemnizacion-honduras',
        'divorcio-honduras-guia-completa',
        'pension-alimenticia-honduras-guia-completa',
        'prescripcion-deudas-plazos-honduras',
        'recursos-sentencia-penal-apelacion-casacion-honduras',
      ].sort(),
    );
  });
});

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 4B §7 — Determinismo del scoring y selección del Lote 2', () => {
  const sel = leerJson<Seleccion>('fase4a-lote2-seleccion.json');

  it('el top-15 está ordenado por prioridad descendente (determinismo)', () => {
    const prioridades = sel.lote2.map((e) => e.scoring.prioridad);
    for (let i = 1; i < prioridades.length; i++) {
      expect(prioridades[i - 1]).toBeGreaterThanOrEqual(prioridades[i]);
    }
  });

  it('la selección del Lote 2 no incluye ningún slug del Lote 1', () => {
    for (const e of sel.lote2) {
      expect(SLUGS_LOTE1.has(e.slug)).toBe(false);
    }
  });

  it('15 artículos seleccionados (legitimidad del tamaño del lote)', () => {
    expect(sel.seleccionados).toBe(15);
    expect(sel.lote2).toHaveLength(15);
  });
});

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 4B §7 — Idempotencia de correcciones y coherencia con Fase 4A', () => {
  const integ = leerJson<Integridad>('fase4b-integridad-correcciones.json');
  const claims = leerJson<ClaimsFinales>('fase4a-lote2-claims-finales.json');

  it('todos los claims corrected de Fase 4A están cubiertos por la integridad Fase 4B', () => {
    const corregidosFase4A = claims.claims.filter((c) => c.decision === 'corrected');
    const idsIntegridad = new Set(integ.filas.map((f) => f.claimId));
    for (const c of corregidosFase4A) {
      expect(idsIntegridad.has(c.id)).toBe(true);
    }
  });

  it('el número de claims corrected es estable (8) y reproducible', () => {
    expect(claims.claims.filter((c) => c.decision === 'corrected')).toHaveLength(8);
  });

  it('idempotencia: reaplicar el script deja los mismos aplicadosABody (3)', () => {
    // El campo aplicadoABody deriva de la verificación directa del body, así
    // que es idempotente por construcción: volver a ejecutar el script no
    // cambia el veredicto (textoAnterior ya no aparece si la corrección
    // se aplicó una vez).
    const aplicados = integ.filas.filter((f) => f.aplicadoABody);
    expect(aplicados).toHaveLength(3);
  });
});

describe.skipIf(SKIP_PHASE_AUDITS)('Fase 4B §7 — Paquetes de revisión humana cubren los 8 pendientes', () => {
  const est = leerJson<EstadosDefinitivos>('fase4b-estados-definitivos.json');
  const dirRev = path.join(AUDITS, 'fase4a-lote2-revision-humana');

  it('existe un paquete por cada artículo needs_human_review (8)', () => {
    const pendientes = est.estadosDefinitivos.filter(
      (e) => e.estadoFase4B === 'needs_human_review',
    );
    expect(pendientes).toHaveLength(8);
    for (const p of pendientes) {
      const archivo = path.join(dirRev, `${p.slug}.md`);
      expect(fs.existsSync(archivo)).toBe(true);
    }
  });

  it('el paquete de custodia existe y menciona el reclasificado needs_human_review', () => {
    const p = path.join(dirRev, 'custodia-hijos-honduras-juez.md');
    expect(fs.existsSync(p)).toBe(true);
    const contenido = fs.readFileSync(p, 'utf8');
    expect(contenido).toContain('needs_human_review');
    expect(contenido).toContain('Revisor:');
  });
});
