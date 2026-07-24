import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAPABILITIES, defaultCapabilitiesForRole } from '../lib/access-service';
import { buildAgendaQuery, visibleAgendaRange } from '../lib/sgie/agenda-query';
import { generateInvitationToken, hashInvitationToken } from '../lib/invitations';
import { POST as register } from '../app/api/auth/register/route';
import { resolveEventMutationScope } from '@/lib/agenda-helpers';

describe('Fase 1 — invitaciones', () => {
  it('genera tokens criptográficos distintos y almacenable solo por hash', () => {
    const first = generateInvitationToken();
    const second = generateInvitationToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashInvitationToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInvitationToken(first)).not.toContain(first);
  });

  it('mantiene deshabilitado el registro público', async () => {
    const response = await register(new Request('http://localhost/api/auth/register', { method: 'POST' }));
    expect(response.status).toBe(403);
  });
});

describe('Fase 1 — roles y capacidades', () => {
  it('administrador recibe todas las capacidades canónicas', () => {
    expect(defaultCapabilitiesForRole('admin')).toEqual(new Set(CAPABILITIES));
  });

  it('abogado no puede asignar a terceros ni leer todos los expedientes', () => {
    const capabilities = defaultCapabilitiesForRole('abogado');
    expect(capabilities.has('cases.create')).toBe(true);
    expect(capabilities.has('cases.assign')).toBe(false);
    expect(capabilities.has('cases.read_all')).toBe(false);
    expect(capabilities.has('calendar.write')).toBe(true);
  });

  it('supervisor puede asignar y gestionar calendario de equipo', () => {
    const capabilities = defaultCapabilitiesForRole('supervisor');
    expect(capabilities.has('cases.assign')).toBe(true);
    expect(capabilities.has('calendar.manage_team')).toBe(true);
  });
});

describe('Fase 1 — calendario por rango', () => {
  it('no permite promover un evento propio a equipo sin capacidad ni dejar un expediente incompleto', () => {
    const current = { visibilidad: 'privado' as const, expedienteId: null };
    expect(() => resolveEventMutationScope(current, { visibilidad: 'equipo' }, false)).toThrow('calendar.manage_team');
    expect(() => resolveEventMutationScope(current, { visibilidad: 'expediente' }, false)).toThrow('requiere expediente');
  });
  it('la vista mensual consulta el rango visible y nunca envía limit=200', () => {
    const reference = new Date(2026, 6, 18);
    const query = new URLSearchParams(buildAgendaQuery(reference, 'mes'));
    expect(query.get('limit')).toBe('100');
    expect(query.get('desde')).toBeTruthy();
    expect(query.get('hasta')).toBeTruthy();
    expect(query.get('page')).toBe('1');
  });

  it('el rango mensual incluye las 42 celdas completas', () => {
    const { desde, hasta } = visibleAgendaRange(new Date(2026, 6, 18), 'mes');
    expect((hasta.getTime() - desde.getTime()) / 86_400_000).toBeCloseTo(42, 1);
    expect(desde.getDay()).toBe(1);
    expect(hasta.getDay()).toBe(0);
  });

  it('la UI no conserva la petición inválida histórica', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/intranet/sgie/agenda/page.tsx'), 'utf8');
    expect(source).not.toContain('limit=200');
    expect(source).toContain('buildAgendaQuery');
  });
});

describe('Fase 1 — retirada del CMS Admin', () => {
  it('elimina rutas editoriales administrativas sin retirar lecturas públicas', () => {
    expect(existsSync(resolve(process.cwd(), 'app/intranet/admin/blog/page.tsx'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'app/api/admin/blog/route.ts'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'lib/blog-db.ts'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'lib/faq-db.ts'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'lib/page-content-db.ts'))).toBe(true);
  });
});
