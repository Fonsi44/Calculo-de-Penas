import { describe, it, expect } from 'vitest';
import { contactoSchema, consultaSchema, validate } from '../lib/validation';

describe('validation.ts - contactoSchema', () => {
  const baseValido = {
    nombre: 'Juan Pérez',
    telefono: '+504 9536-3724',
    email: 'juan@example.com',
    asunto: 'Cita para consulta' as const,
    mensaje: 'Necesito orientación sobre un caso penal.',
    acepta: true as const,
  };

  it('acepta un payload válido', () => {
    const r = validate(contactoSchema, baseValido);
    expect(r.success).toBe(true);
  });

  it('acepta email vacío (opcional)', () => {
    const r = validate(contactoSchema, { ...baseValido, email: '' });
    expect(r.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const r = validate(contactoSchema, { ...baseValido, nombre: '   ' });
    expect(r.success).toBe(false);
  });

  it('rechaza mensaje < 10 caracteres', () => {
    const r = validate(contactoSchema, { ...baseValido, mensaje: 'corto' });
    expect(r.success).toBe(false);
  });

  it('rechaza asunto fuera del enum', () => {
    const r = validate(contactoSchema, { ...baseValido, asunto: 'Otro tema' });
    expect(r.success).toBe(false);
  });

  it('rechaza acepta=false', () => {
    const r = validate(contactoSchema, { ...baseValido, acepta: false });
    expect(r.success).toBe(false);
  });

  it('rechaza email inválido', () => {
    const r = validate(contactoSchema, { ...baseValido, email: 'no-es-email' });
    expect(r.success).toBe(false);
  });

  it('hace trim de nombre y teléfono', () => {
    const r = validate(contactoSchema, { ...baseValido, nombre: '  Ana  ', telefono: '  +504 9999  ' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.nombre).toBe('Ana');
      expect(r.data.telefono).toBe('+504 9999');
    }
  });
});

describe('validation.ts - consultaSchema', () => {
  const baseValido = {
    nombre: 'María López',
    telefono: '+504 9999-0000',
    email: 'maria@example.com',
    motivo: 'Asesoría preventiva' as const,
    resumen: 'Necesito orientación preventiva sobre un contrato laboral.',
    acepta: true as const,
  };

  it('acepta un payload válido', () => {
    const r = validate(consultaSchema, baseValido);
    expect(r.success).toBe(true);
  });

  it('rechaza resumen demasiado corto', () => {
    const r = validate(consultaSchema, { ...baseValido, resumen: 'muy corto' });
    expect(r.success).toBe(false);
  });
});
