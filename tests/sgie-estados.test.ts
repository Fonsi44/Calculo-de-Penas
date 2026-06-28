/**
 * Tests de traducción de estados SGIE — Sprint 0 (tarea 5).
 *
 * Cubre: estados de expediente, documento, severidad, prioridad, tarea, agenda,
 * correo, fallback para estados desconocidos y normalización de nulos.
 *
 * Referencia: lib/sgie/estados.ts — sólo presentación, no muta DB.
 */
import { describe, it, expect } from 'vitest';
import {
  traducirEstadoExpediente,
  traducirEstadoDocumento,
  traducirSeveridad,
  traducirPrioridad,
  traducirEstadoTarea,
  traducirEstadoAgenda,
  traducirEstadoCorreo,
} from '../lib/sgie/estados';

describe('traducirEstadoExpediente', () => {
  it('traduce estados críticos con etiqueta legible', () => {
    expect(traducirEstadoExpediente('pendiente_validacion_abogado')).toBe('Pendiente de validación');
    expect(traducirEstadoExpediente('pendiente_de_firma')).toBe('Pendiente de firma');
    expect(traducirEstadoExpediente('en_tramite')).toBe('En trámite');
    expect(traducirEstadoExpediente('finalizado')).toBe('Finalizado');
    expect(traducirEstadoExpediente('archivado')).toBe('Archivado');
  });

  it('traduce estados iniciales e intermedios', () => {
    expect(traducirEstadoExpediente('creado')).toBe('Creado');
    expect(traducirEstadoExpediente('documentos_parcialmente_recibidos')).toBe('Documentos parcialmente recibidos');
    expect(traducirEstadoExpediente('inconsistencias_detectadas')).toBe('Inconsistencias detectadas');
  });

  it('no devuelve el enum crudo snake_case para estados conocidos', () => {
    const resultado = traducirEstadoExpediente('pendiente_validacion_abogado');
    expect(resultado).not.toContain('_');
  });

  it('aplica fallback capitalizado para estados desconocidos', () => {
    expect(traducirEstadoExpediente('nuevo_estado_futuro')).toBe('Nuevo Estado Futuro');
  });

  it('devuelve guion para valores nulos/vacíos', () => {
    expect(traducirEstadoExpediente(null)).toBe('—');
    expect(traducirEstadoExpediente(undefined)).toBe('—');
    expect(traducirEstadoExpediente('')).toBe('—');
  });
});

describe('traducirEstadoDocumento', () => {
  it('traduce estados documentales', () => {
    expect(traducirEstadoDocumento('pendiente_abogado')).toBe('Pendiente del abogado');
    expect(traducirEstadoDocumento('ia_procesada')).toBe('Procesado por IA');
    expect(traducirEstadoDocumento('texto_extraido')).toBe('Texto extraído');
    expect(traducirEstadoDocumento('aprobado')).toBe('Aprobado');
    expect(traducirEstadoDocumento('rechazado')).toBe('Rechazado');
  });

  it('aplica fallback para estados desconocidos', () => {
    expect(traducirEstadoDocumento('estado_nuevo')).toBe('Estado Nuevo');
  });
});

describe('traducirSeveridad', () => {
  it('traduce las 4 severidades del enum', () => {
    expect(traducirSeveridad('info')).toBe('Informativa');
    expect(traducirSeveridad('advertencia')).toBe('Advertencia');
    expect(traducirSeveridad('error')).toBe('Error');
    expect(traducirSeveridad('critico')).toBe('Crítica');
  });

  it('devuelve guion para nulo', () => {
    expect(traducirSeveridad(null)).toBe('—');
  });
});

describe('traducirPrioridad', () => {
  it('traduce las 4 prioridades del enum', () => {
    expect(traducirPrioridad('baja')).toBe('Baja');
    expect(traducirPrioridad('media')).toBe('Media');
    expect(traducirPrioridad('alta')).toBe('Alta');
    expect(traducirPrioridad('urgente')).toBe('Urgente');
  });
});

describe('traducirEstadoTarea', () => {
  it('traduce estados de tarea', () => {
    expect(traducirEstadoTarea('en_progreso')).toBe('En progreso');
    expect(traducirEstadoTarea('completada')).toBe('Completada');
    expect(traducirEstadoTarea('cancelada')).toBe('Cancelada');
  });
});

describe('traducirEstadoAgenda', () => {
  it('traduce estados de agenda', () => {
    expect(traducirEstadoAgenda('propuesta')).toBe('Propuesta');
    expect(traducirEstadoAgenda('confirmada')).toBe('Confirmada');
    expect(traducirEstadoAgenda('descartada')).toBe('Descartada');
    expect(traducirEstadoAgenda('completada')).toBe('Completada');
  });
});

describe('traducirEstadoCorreo', () => {
  it('traduce estados de correo', () => {
    expect(traducirEstadoCorreo('enviado')).toBe('Enviado');
    expect(traducirEstadoCorreo('fallido')).toBe('Fallido');
    expect(traducirEstadoCorreo('reintentando')).toBe('Reintentando');
    expect(traducirEstadoCorreo('pendiente')).toBe('Pendiente');
  });
});
