/**
 * Tests de búsqueda híbrida (Sprint 4, tarea 5).
 * Funciones puras — sin DB.
 */
import { describe, it, expect } from 'vitest';
import { normalizarTexto, tokenizar, puntuarDocumento, rankear, type DocumentoBuscable } from '../lib/sgie/busqueda-hibrida';

describe('normalizarTexto', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(normalizarTexto('Nacaomé VALLE')).toBe('nacaome valle');
    expect(normalizarTexto('María Pérez')).toBe('maria perez');
  });

  it('reemplaza signos por espacios', () => {
    expect(normalizarTexto('EXP-2026/001')).toBe('exp 2026 001');
  });
});

describe('tokenizar', () => {
  it('elimina stopwords y tokens cortos', () => {
    const t = tokenizar('la solicitud de divorcio del cliente');
    expect(t).toContain('solicitud');
    expect(t).toContain('divorcio');
    expect(t).toContain('cliente');
    expect(t).not.toContain('la');
    expect(t).not.toContain('de');
    expect(t).not.toContain('del');
  });

  it('filtra tokens de longitud < 2', () => {
    expect(tokenizar('a b cc')).toEqual(['cc']);
  });
});

describe('puntuarDocumento', () => {
  const doc: DocumentoBuscable = {
    id: '1', tipo: 'expediente', titulo: 'Divorcio Pérez',
    subtitulo: 'Cliente María', cuerpo: 'Solicitud de divorcio voluntario',
    href: '/exp/1',
  };

  it('puntúa más alto las coincidencias en título', () => {
    const { puntaje } = puntuarDocumento(doc, ['divorcio']);
    expect(puntaje).toBe(3 + 1); // título (3) + cuerpo (1)
  });

  it('acumula puntaje por múltiples tokens', () => {
    const { puntaje, coincidencias } = puntuarDocumento(doc, ['divorcio', 'maria']);
    expect(puntaje).toBe(3 + 1 + 2); // divorcio(título+cuerpo) + maria(subtitulo)
    expect(coincidencias).toContain('divorcio');
    expect(coincidencias).toContain('maria');
  });

  it('devuelve 0 si no hay coincidencias', () => {
    const { puntaje, coincidencias } = puntuarDocumento(doc, ['imponible']);
    expect(puntaje).toBe(0);
    expect(coincidencias).toHaveLength(0);
  });
});

describe('rankear', () => {
  const docs: DocumentoBuscable[] = [
    { id: '1', tipo: 'expediente', titulo: 'Divorcio', subtitulo: null, cuerpo: null, href: '/1' },
    { id: '2', tipo: 'documento', titulo: 'Acta', subtitulo: null, cuerpo: 'divorcio voluntario', href: '/2' },
    { id: '3', tipo: 'expediente', titulo: 'Penal', subtitulo: null, cuerpo: 'robo agravado', href: '/3' },
  ];

  it('ordena por puntaje descendente', () => {
    const r = rankear(docs, 'divorcio');
    expect(r).toHaveLength(2);
    expect(r[0].id).toBe('1'); // título, puntaje 3
    expect(r[1].id).toBe('2'); // cuerpo, puntaje 1
  });

  it('excluye documentos sin coincidencias', () => {
    const r = rankear(docs, 'divorcio');
    expect(r.find((d) => d.id === '3')).toBeUndefined();
  });

  it('devuelve vacío para término no tokenizable', () => {
    expect(rankear(docs, 'a')).toEqual([]);
    expect(rankear(docs, 'la de')).toEqual([]);
  });
});
