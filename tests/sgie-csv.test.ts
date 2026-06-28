/**
 * Tests de exportación CSV SGIE (Sprint 2, tarea 2).
 * Funciones puras — sin DB, sin dependencias.
 */
import { describe, it, expect } from 'vitest';
import { escaparCelda, generarCsv, conBom, nombreArchivoExport, type ColumnaCsv } from '../lib/sgie/csv';

describe('escaparCelda', () => {
  it('devuelve cadena vacía para null/undefined', () => {
    expect(escaparCelda(null)).toBe('');
    expect(escaparCelda(undefined)).toBe('');
  });

  it('convierte números y booleanos a string', () => {
    expect(escaparCelda(42)).toBe('42');
    expect(escaparCelda(true)).toBe('true');
  });

  it('no entrecomilla texto simple', () => {
    expect(escaparCelda('María Pérez')).toBe('María Pérez');
  });

  it('entrecomilla valores con coma', () => {
    expect(escaparCelda('Pérez, María')).toBe('"Pérez, María"');
  });

  it('entrecomilla y escapa comillas internas', () => {
    expect(escaparCelda('Dijo "hola"')).toBe('"Dijo ""hola"""');
  });

  it('entrecomilla valores con salto de línea', () => {
    expect(escaparCelda('línea1\nlínea2')).toBe('"línea1\nlínea2"');
  });
});

describe('generarCsv', () => {
  const columnas: ColumnaCsv[] = [
    { clave: 'nombre', etiqueta: 'Nombre' },
    { clave: 'edad', etiqueta: 'Edad' },
    { clave: 'ciudad', etiqueta: 'Ciudad' },
  ];

  it('genera cabecera + filas con CRLF', () => {
    const csv = generarCsv(
      [{ nombre: 'Ana', edad: 30, ciudad: 'Tegucigalpa' }],
      columnas,
    );
    expect(csv).toBe('Nombre,Edad,Ciudad\r\nAna,30,Tegucigalpa');
  });

  it('maneja múltiples filas', () => {
    const csv = generarCsv(
      [
        { nombre: 'Ana', edad: 30, ciudad: 'Tegus' },
        { nombre: 'Beto', edad: 25, ciudad: 'SPS' },
      ],
      columnas,
    );
    const lineas = csv.split('\r\n');
    expect(lineas).toHaveLength(3);
    expect(lineas[1]).toBe('Ana,30,Tegus');
    expect(lineas[2]).toBe('Beto,25,SPS');
  });

  it('escapa correctamente valores con coma en celdas', () => {
    const csv = generarCsv([{ nombre: 'Pérez, Ana', edad: 1, ciudad: 'X' }], columnas);
    expect(csv.split('\r\n')[1]).toBe('"Pérez, Ana",1,X');
  });

  it('soporta paths anidados (a.b)', () => {
    const csv = generarCsv(
      [{ cliente: { nombre: 'Ana' } }],
      [{ clave: 'cliente.nombre', etiqueta: 'Cliente' }],
    );
    expect(csv.split('\r\n')[1]).toBe('Ana');
  });

  it('maneja filas vacías', () => {
    const csv = generarCsv([], columnas);
    expect(csv).toBe('Nombre,Edad,Ciudad');
  });

  it('maneja valores ausentes como cadena vacía', () => {
    const csv = generarCsv([{ nombre: 'Ana' }], columnas);
    expect(csv.split('\r\n')[1]).toBe('Ana,,');
  });
});

describe('conBom', () => {
  it('añade BOM UTF-8 al inicio', () => {
    expect(conBom('hola')).toBe('\uFEFFhola');
    expect(conBom('hola').charCodeAt(0)).toBe(0xFEFF);
  });
});

describe('nombreArchivoExport', () => {
  it('genera nombre con timestamp y extensión', () => {
    const nombre = nombreArchivoExport('reporte-expedientes', 'csv');
    expect(nombre).toMatch(/^reporte-expedientes_\d{8}_\d{4}\.csv$/);
  });

  it('sanitiza el prefijo (solo a-z0-9-)', () => {
    const nombre = nombreArchivoExport('Reporte Expedientes!', 'csv');
    expect(nombre).toMatch(/^reporte-expedientes_/);
    expect(nombre).not.toContain('!');
    expect(nombre).not.toContain(' ');
  });

  it('usa extensión por defecto csv', () => {
    expect(nombreArchivoExport('x')).toMatch(/\.csv$/);
  });
});
