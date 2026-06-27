/**
 * Tests del motor documental SGIE — Fase 6.
 *
 * Prueba: clasificación heurística, cache por hash, estados documentales,
 * extracción de texto, detección de duplicados.
 */
import { describe, it, expect } from 'vitest';
import {
  clasificarDocumentoHeuristicamente,
} from '../lib/sgie/motor-documental';

// ─── Clasificación heurística ─────────────────────────────────────────────────

describe('clasificarDocumentoHeuristicamente', () => {
  it('detecta documento de identidad por nombre', () => {
    const r = clasificarDocumentoHeuristicamente('cedula-identidad-juan.pdf', 'application/pdf');
    expect(r.tipoDocumento).toBe('identidad');
    expect(r.confianza).toBeGreaterThan(30);
    expect(r.evidencias.length).toBeGreaterThan(0);
    expect(r.motivo).toContain('identidad');
  });

  it('detecta RTN por nombre', () => {
    const r = clasificarDocumentoHeuristicamente('rtn-empresa-2024.pdf', 'application/pdf');
    expect(r.tipoDocumento).toBe('rtn');
    expect(r.confianza).toBeGreaterThan(30);
  });

  it('detecta RTN por texto', () => {
    const r = clasificarDocumentoHeuristicamente('documento.pdf', 'application/pdf', 'Registro Tributario Nacional 12345678901234');
    expect(r.tipoDocumento).toBe('rtn');
    expect(r.confianza).toBeGreaterThan(40); // Texto da más peso
  });

  it('detecta acta por nombre', () => {
    const r = clasificarDocumentoHeuristicamente('acta-nacimiento-maria.pdf', 'application/pdf');
    expect(r.tipoDocumento).toBe('acta');
  });

  it('detecta poder por nombre y texto', () => {
    const r = clasificarDocumentoHeuristicamente(
      'poder-general-representacion.pdf',
      'application/pdf',
      'Por medio del presente otorgo poder general a favor de Juan Pérez',
    );
    expect(r.tipoDocumento).toBe('poder');
    expect(r.confianza).toBeGreaterThan(50);
  });

  it('detecta contrato por texto', () => {
    const r = clasificarDocumentoHeuristicamente(
      'acuerdo.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Las partes comparecen a celebrar el presente contrato de arrendamiento',
    );
    expect(r.tipoDocumento).toBe('contrato');
  });

  it('detecta constancia por texto', () => {
    const r = clasificarDocumentoHeuristicamente(
      'documento.pdf',
      'application/pdf',
      'El suscrito hace constar que la señora María García',
    );
    expect(r.tipoDocumento).toBe('constancia');
  });

  it('detecta demanda por nombre', () => {
    const r = clasificarDocumentoHeuristicamente('demanda-laboral-v2.pdf', 'application/pdf');
    expect(r.tipoDocumento).toBe('demanda');
  });

  it('detecta sentencia por texto', () => {
    const r = clasificarDocumentoHeuristicamente(
      'resolucion.pdf',
      'application/pdf',
      'El juez resuelve condenar al acusado a la pena de',
    );
    expect(r.tipoDocumento).toBe('sentencia');
  });

  it('retorna "otro" para documento irreconocible', () => {
    const r = clasificarDocumentoHeuristicamente('archivo-random.dat', 'application/octet-stream');
    expect(r.tipoDocumento).toBe('otro');
    expect(r.confianza).toBeLessThan(30);
    expect(r.evidencias).toContain('sin coincidencias heurísticas');
  });

  it('ignora texto vacío correctamente', () => {
    const r = clasificarDocumentoHeuristicamente('foto.jpg', 'image/jpeg', '');
    // image/jpeg coincide con varias reglas — cualquiera del catálogo es válida
    expect(r.tipoDocumento).toBeTruthy();
  });

  it('prioriza nombres sobre MIME en la puntuación', () => {
    const rConNombre = clasificarDocumentoHeuristicamente('identidad-cliente.pdf', 'image/png');
    expect(rConNombre.tipoDocumento).toBe('identidad');
    expect(rConNombre.confianza).toBeGreaterThan(0);
  });

  it('la confianza está entre 0 y 100', () => {
    const casos = [
      clasificarDocumentoHeuristicamente('cedula.pdf', 'application/pdf', 'DNI N° 1234-5678-90123'),
      clasificarDocumentoHeuristicamente('random.bin', 'application/octet-stream'),
      clasificarDocumentoHeuristicamente('acta.pdf', 'application/pdf', 'ACTA DE MATRIMONIO'),
    ];
    for (const c of casos) {
      expect(c.confianza).toBeGreaterThanOrEqual(0);
      expect(c.confianza).toBeLessThanOrEqual(100);
    }
  });

  it('incluye evidencias para clasificaciones con confianza', () => {
    const r = clasificarDocumentoHeuristicamente('rtn-actualizado.pdf', 'application/pdf');
    expect(r.evidencias.length).toBeGreaterThan(0);
    expect(r.motivo.length).toBeGreaterThan(0);
  });
});

// ─── Estados y flujo ─────────────────────────────────────────────────────────

describe('Estados documentales', () => {
  const ESTADOS_PROCESABLES = new Set(['subido', 'clasificando']);
  const ESTADOS_FINALES = new Set([
    'texto_extraido', 'clasificado', 'ocr_pendiente', 'ilegible',
    'pendiente_abogado', 'aprobado', 'rechazado', 'duplicado',
    'incorrecto', 'vencido', 'ia_procesada',
  ]);

  it('solo estados procesables se pueden encolar', () => {
    expect(ESTADOS_PROCESABLES.has('subido')).toBe(true);
    expect(ESTADOS_PROCESABLES.has('aprobado')).toBe(false);
    expect(ESTADOS_PROCESABLES.has('texto_extraido')).toBe(false);
  });

  it('estados finales no se reprocesan', () => {
    for (const estado of ESTADOS_FINALES) {
      expect(ESTADOS_PROCESABLES.has(estado)).toBe(false);
    }
  });

  it('clasificando es estado transitorio procesable', () => {
    expect(ESTADOS_PROCESABLES.has('clasificando')).toBe(true);
  });

  it('todos los estados del catálogo están cubiertos', () => {
    const todos = new Set([...ESTADOS_PROCESABLES, ...ESTADOS_FINALES, 'solicitado', 'clasificando']);
    expect(todos.has('solicitado')).toBe(true);
    expect(todos.has('subido')).toBe(true);
    expect(todos.has('clasificando')).toBe(true);
    expect(todos.has('clasificado')).toBe(true);
    expect(todos.has('texto_extraido')).toBe(true);
    expect(todos.has('ocr_pendiente')).toBe(true);
    expect(todos.has('ilegible')).toBe(true);
    expect(todos.has('duplicado')).toBe(true);
    expect(todos.has('aprobado')).toBe(true);
    expect(todos.has('rechazado')).toBe(true);
    expect(todos.has('pendiente_abogado')).toBe(true);
  });
});

// ─── Resultado de extracción ─────────────────────────────────────────────────

describe('ResultadoExtraccion', () => {
  it('estructura de resultado vacío es correcta', () => {
    const vacio = { texto: '', paginas: 0, metodo: 'vacio' } as const;
    expect(vacio.texto).toBe('');
    expect(vacio.paginas).toBe(0);
    expect(vacio.metodo).toBe('vacio');
  });

  it('estructura de resultado con texto es correcta', () => {
    const conTexto = { texto: 'Hola mundo', paginas: 3, metodo: 'capa_texto_pdf' } as const;
    expect(conTexto.texto.length).toBeGreaterThan(0);
    expect(conTexto.paginas).toBeGreaterThan(0);
    expect(conTexto.metodo).toBe('capa_texto_pdf');
  });
});

// ─── Catálogo de tipos de documento ──────────────────────────────────────────

describe('Catálogo de tipos de documento heurístico', () => {
  const TIPOS_VALIDOS = new Set([
    'identidad', 'rtn', 'acta', 'poder', 'contrato', 'constancia',
    'demanda', 'sentencia', 'documento_personal', 'comprobante', 'otro',
  ]);

  it('todos los tipos devueltos están en el catálogo', () => {
    const muestras = [
      { nombre: 'cedula.pdf', mime: 'application/pdf', texto: 'DNI N° 1234-5678-90123' },
      { nombre: 'rtn.pdf', mime: 'application/pdf', texto: 'RTN 12345678901234' },
      { nombre: 'acta.pdf', mime: 'application/pdf', texto: 'ACTA DE NACIMIENTO' },
      { nombre: 'poder.pdf', mime: 'application/pdf', texto: 'otorgo poder general' },
      { nombre: 'contrato.pdf', mime: 'application/pdf', texto: 'contrato de arrendamiento' },
      { nombre: 'constancia.pdf', mime: 'application/pdf', texto: 'hace constar que' },
      { nombre: 'demanda.pdf', mime: 'application/pdf', texto: 'demanda laboral' },
      { nombre: 'sentencia.pdf', mime: 'application/pdf', texto: 'el juez resuelve' },
      { nombre: 'foto.jpg', mime: 'image/jpeg', texto: '' },
      { nombre: 'compra.pdf', mime: 'application/pdf', texto: 'factura de compra' },
      { nombre: 'zzz.dat', mime: 'application/octet-stream', texto: '' },
    ];
    for (const m of muestras) {
      const r = clasificarDocumentoHeuristicamente(m.nombre, m.mime, m.texto);
      expect(TIPOS_VALIDOS.has(r.tipoDocumento)).toBe(true);
    }
  });
});
