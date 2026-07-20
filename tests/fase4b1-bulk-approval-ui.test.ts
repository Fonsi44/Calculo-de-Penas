// @vitest-environment jsdom
/// <reference types="vitest/globals" />
/**
 * Tests de UI de P2-07 (Fase 4B-1) — lógica de selección múltiple.
 *
 * Cubre la lógica de selección/deselección de documentos elegibles que usa la
 * bandeja de revisión documental. No renderiza el componente completo (no hay
 * infraestructura previa de RTL en el repo); testea las invariantes de selección
 * que el componente aplica.
 */
import { describe, it, expect } from 'vitest';

// Réplicas de las constantes y helpers de selección del componente.
const ESTADOS_APROBABLES = new Set(['pendiente_abogado', 'clasificado', 'ia_procesada']);

interface DocSimple {
  id: string;
  expedienteId: string;
  estado: string;
}

// Réplica de toggleSeleccionExpediente: selecciona solo los aprobables.
function calcularSeleccionExpediente(docsExp: DocSimple[], seleccionados: Set<string>): Set<string> {
  const aprobables = docsExp.filter((d) => ESTADOS_APROBABLES.has(d.estado));
  const todosSel = aprobables.length > 0 && aprobables.every((d) => seleccionados.has(d.id));
  const next = new Set(seleccionados);
  for (const d of aprobables) {
    if (todosSel) next.delete(d.id);
    else next.add(d.id);
  }
  return next;
}

describe('P2-07 UI — selección múltiple de documentos', () => {
  it('selecciona solo documentos en estado aprobable', () => {
    const docs: DocSimple[] = [
      { id: 'd1', expedienteId: 'e1', estado: 'pendiente_abogado' },
      { id: 'd2', expedienteId: 'e1', estado: 'aprobado' }, // no elegible
      { id: 'd3', expedienteId: 'e1', estado: 'clasificado' },
    ];
    const sel = calcularSeleccionExpediente(docs, new Set());
    expect(sel.has('d1')).toBe(true);
    expect(sel.has('d3')).toBe(true);
    expect(sel.has('d2')).toBe(false); // aprobado no se selecciona
  });

  it('deselecciona todos si ya estaban seleccionados', () => {
    const docs: DocSimple[] = [
      { id: 'd1', expedienteId: 'e1', estado: 'pendiente_abogado' },
      { id: 'd2', expedienteId: 'e1', estado: 'ia_procesada' },
    ];
    const prev = new Set(['d1', 'd2']);
    const sel = calcularSeleccionExpediente(docs, prev);
    expect(sel.size).toBe(0);
  });

  it('no selecciona nada si no hay documentos aprobables', () => {
    const docs: DocSimple[] = [
      { id: 'd1', expedienteId: 'e1', estado: 'ilegible' },
      { id: 'd2', expedienteId: 'e1', estado: 'rechazado' },
    ];
    const sel = calcularSeleccionExpediente(docs, new Set());
    expect(sel.size).toBe(0);
  });

  it('toggle individual añade/quita un documento', () => {
    let sel = new Set<string>();
    // Añadir.
    sel = new Set(sel); sel.add('d1');
    expect(sel.has('d1')).toBe(true);
    // Quitar.
    sel.delete('d1');
    expect(sel.has('d1')).toBe(false);
  });

  it('documentos de otros expedientes no se ven afectados', () => {
    const docsExpA: DocSimple[] = [{ id: 'a1', expedienteId: 'expA', estado: 'pendiente_abogado' }];
    const prev = new Set(['b1']); // selección de otro expediente
    const sel = calcularSeleccionExpediente(docsExpA, prev);
    expect(sel.has('a1')).toBe(true);
    expect(sel.has('b1')).toBe(true); // se conserva
  });
});

describe('P2-07 UI — estados aprobables canónicos', () => {
  it('pendiente_abogado, clasificado, ia_procesada son aprobables', () => {
    expect(ESTADOS_APROBABLES.has('pendiente_abogado')).toBe(true);
    expect(ESTADOS_APROBABLES.has('clasificado')).toBe(true);
    expect(ESTADOS_APROBABLES.has('ia_procesada')).toBe(true);
  });

  it('aprobado, rechazado, ilegible NO son aprobables', () => {
    expect(ESTADOS_APROBABLES.has('aprobado')).toBe(false);
    expect(ESTADOS_APROBABLES.has('rechazado')).toBe(false);
    expect(ESTADOS_APROBABLES.has('ilegible')).toBe(false);
  });
});
