import { describe, it, expect } from 'vitest';
import { isAdminRole, normalizeRole, isSgieRole } from '@/lib/roles';

describe('lib/roles — isAdminRole', () => {
  it('acepta admin', () => {
    expect(isAdminRole('admin')).toBe(true);
  });

  it('acepta administrador', () => {
    expect(isAdminRole('administrador')).toBe(true);
  });

  it('rechaza abogado', () => {
    expect(isAdminRole('abogado')).toBe(false);
  });

  it('rechaza supervisor', () => {
    expect(isAdminRole('supervisor')).toBe(false);
  });

  it('rechaza null', () => {
    expect(isAdminRole(null)).toBe(false);
  });

  it('rechaza undefined', () => {
    expect(isAdminRole(undefined)).toBe(false);
  });

  it('rechaza pendiente', () => {
    expect(isAdminRole('pendiente')).toBe(false);
  });

  it('rechaza vacío', () => {
    expect(isAdminRole('')).toBe(false);
  });
});

describe('lib/roles — normalizeRole', () => {
  it('normaliza administrador a admin', () => {
    expect(normalizeRole('administrador')).toBe('admin');
  });

  it('admin se queda admin', () => {
    expect(normalizeRole('admin')).toBe('admin');
  });

  it('abogado sin cambios', () => {
    expect(normalizeRole('abogado')).toBe('abogado');
  });

  it('supervisor sin cambios', () => {
    expect(normalizeRole('supervisor')).toBe('supervisor');
  });
});

describe('lib/roles — isSgieRole', () => {
  it('acepta admin', () => {
    expect(isSgieRole('admin')).toBe(true);
  });

  it('acepta administrador', () => {
    expect(isSgieRole('administrador')).toBe(true);
  });

  it('acepta abogado', () => {
    expect(isSgieRole('abogado')).toBe(true);
  });

  it('acepta supervisor', () => {
    expect(isSgieRole('supervisor')).toBe(true);
  });

  it('rechaza cliente', () => {
    expect(isSgieRole('cliente')).toBe(false);
  });

  it('rechaza null', () => {
    expect(isSgieRole(null)).toBe(false);
  });
});
