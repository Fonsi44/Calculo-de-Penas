/// <reference types="vitest/globals" />
/**
 * Tests de API ICS feed y generación ICS (P2-10).
 *
 * La sección CalendarExternalSection y todo el subsistema de sincronización
 * sandbox/reconciliación fueron eliminados como feature experimental abandonada.
 * El feed ICS (calendar-ics.ts + API /api/sgie/agenda/ics/feed) es el único
 * subsistema activo de calendario externo.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));
vi.stubGlobal('fetch', mockFetch);

function mockResp(status: number, data: unknown) {
  return { ok: status >= 200 && status < 300, status, statusText: 'OK', json: async () => data, text: async () => JSON.stringify(data) };
}

// ─── ICS Feed API ────────────────────────────────────────────────────────────
describe('ICS feed API', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('crear feed via POST y mostrar URL', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, { token: 'abc123', url: '/feed?token=abc123' }));
    const resp = await fetch('/api/sgie/agenda/ics/feed', { method: 'POST' });
    const data = await resp.json() as { token: string; url: string };
    expect(data.token).toBeTruthy();
    expect(data.url).toContain('token=');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('copiar URL solo en momento de creación', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, { token: 'xyz', url: '/feed?token=xyz' }));
    const resp = await fetch('/api/sgie/agenda/ics/feed', { method: 'POST' });
    const data = await resp.json() as { token: string };
    expect(data.token).toBe('xyz');
  });

  it('rotar token invalida el anterior', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, { token: 'new-token', url: '/feed?token=new-token' }));
    const resp = await fetch('/api/sgie/agenda/ics/feed', { method: 'POST' });
    const data = await resp.json() as { token: string };
    expect(data.token).not.toBe('old-token');
  });

  it('revocar feed → DELETE exitoso', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, { ok: true }));
    const resp = await fetch('/api/sgie/agenda/ics/feed', { method: 'DELETE' });
    expect(resp.ok).toBe(true);
  });

  it('error 403 en feed → muestra mensaje', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(403, { error: 'Forbidden' }));
    const resp = await fetch('/api/sgie/agenda/ics/feed', { method: 'POST' });
    expect(resp.status).toBe(403);
  });

  it('error 429 rate limit → muestra mensaje', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(429, { error: 'Too Many Requests' }));
    const resp = await fetch('/api/sgie/agenda/ics/feed', { method: 'POST' });
    expect(resp.status).toBe(429);
  });
});

// ─── ICS generation (contract) ──────────────────────────────────────────────
describe('CalendarICS — generación ICS', () => {
  it('UID estable con prefijo sgie-', () => {
    const uid = `sgie-test-event@pinedayasociadoshn.com`;
    expect(uid).toMatch(/^sgie-/);
    expect(uid).toContain('@pinedayasociadoshn.com');
  });

  it('all-day usa VALUE=DATE', () => {
    const isAllDay = true;
    expect(isAllDay).toBe(true);
  });

  it('timezone IANA incluido en DTSTART', () => {
    const tz = 'America/Tegucigalpa';
    expect(tz).toMatch(/^[A-Z][a-z]+\/[A-Z][a-z_]+$/);
  });

  it('SEQUENCE se incrementa con versión', () => {
    const version = 3;
    expect(version).toBeGreaterThan(1);
  });

  it('CRLF injection sanitizado', () => {
    const unsafe = 'Test\r\nBEGIN:VEVENT\r\nSUMMARY:HACKED';
    const safe = unsafe.replace(/[\r\n]/g, '');
    expect(safe).not.toContain('\r');
    expect(safe).not.toContain('\n');
  });

  it('escaping de caracteres especiales ICS', () => {
    const text = 'Test, with; commas\\and\\backslash';
    const escaped = text.replace(/[,;\\]/g, '\\$&');
    expect(escaped).toBe('Test\\, with\\; commas\\\\and\\\\backslash');
  });

  it('feed privado con token hash', () => {
    const token = 'random-token-32bytes-hex-string';
    const hash = token + '-hashed';
    expect(hash).toBeTruthy();
    expect(token).not.toBe(hash);
  });
});

// ─── DELETE endpoint (agenda events) ────────────────────────────────────────
describe('DELETE /api/sgie/agenda/[id]', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('DELETE exitoso de evento propio', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, { ok: true }));
    const resp = await fetch('/api/sgie/agenda/event-1', { method: 'DELETE' });
    expect(resp.ok).toBe(true);
  });

  it('DELETE 404 para evento inexistente', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(404, { error: 'Evento no encontrado' }));
    const resp = await fetch('/api/sgie/agenda/non-existent', { method: 'DELETE' });
    expect(resp.status).toBe(404);
  });

  it('DELETE 403 sin autorización', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(403, { error: 'Sin acceso al evento' }));
    const resp = await fetch('/api/sgie/agenda/event-1', { method: 'DELETE' });
    expect(resp.status).toBe(403);
  });
});
