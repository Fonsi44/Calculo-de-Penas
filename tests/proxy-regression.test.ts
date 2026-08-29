import { describe, it, expect } from 'vitest';
import { isPublicApiPath, isPublicPagePath, isSessionApiPath } from '../proxy';

describe('proxy — clasificación pública (sin auth)', () => {
  it('marca APIs públicas conocidas', () => {
    expect(isPublicApiPath('/api/chat')).toBe(true);
    expect(isPublicApiPath('/api/contacto')).toBe(true);
    expect(isPublicApiPath('/api/consulta')).toBe(true);
    expect(isPublicApiPath('/api/delitos')).toBe(true);
    expect(isPublicApiPath('/api/delitos/count')).toBe(true);
    expect(isPublicApiPath('/api/cp')).toBe(true);
    expect(isPublicApiPath('/api/revalidate')).toBe(true);
    expect(isPublicApiPath('/api/email/inbound')).toBe(true);
    expect(isPublicApiPath('/api/legal/search')).toBe(true);
  });

  it('no clasifica APIs inexistentes de intranet como públicas', () => {
    expect(isPublicApiPath('/api/admin/usuarios')).toBe(false);
    expect(isPublicApiPath('/api/sgie/expedientes')).toBe(false);
    expect(isPublicApiPath('/api/auth/login')).toBe(false);
  });

  it('isSessionApiPath solo aplica a /api no públicas', () => {
    expect(isSessionApiPath('/api/chat')).toBe(false);
    expect(isSessionApiPath('/blog')).toBe(false);
    expect(isSessionApiPath('/api/admin/foo')).toBe(true);
  });

  it('marca páginas públicas conocidas', () => {
    expect(isPublicPagePath('/')).toBe(true);
    expect(isPublicPagePath('/blog')).toBe(true);
    expect(isPublicPagePath('/blog/penal/slug')).toBe(true);
    expect(isPublicPagePath('/servicios-juridicos/penal')).toBe(true);
    expect(isPublicPagePath('/abogados-en-nacaome')).toBe(true);
  });
});
