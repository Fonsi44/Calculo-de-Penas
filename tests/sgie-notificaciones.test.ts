/**
 * Tests de normalización de notificaciones SGIE (Sprint 2, tarea 5).
 * Función pura — sin DB.
 */
import { describe, it, expect } from 'vitest';
import { normalizarNotificaciones } from '../lib/sgie/notificaciones';

describe('normalizarNotificaciones', () => {
  it('devuelve array vacío sin entradas', () => {
    expect(normalizarNotificaciones({})).toEqual([]);
  });

  it('construye notificaciones de tarea vencida', () => {
    const out = normalizarNotificaciones({
      tareasVencidas: [{ id: 't1', titulo: 'Preparar escrito', fechaVencimiento: '2026-06-20T10:00:00Z' }],
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: 'tarea_vencida:t1',
      tipo: 'tarea_vencida',
      severidad: 'danger',
      href: '/intranet/sgie/tareas',
    });
    expect(out[0].titulo).toContain('Preparar escrito');
  });

  it('ordena por prioridad: alertas críticas antes que documentos pendientes', () => {
    const out = normalizarNotificaciones({
      documentosPendientes: [{ id: 'd1', nombreOriginal: 'doc.pdf', expedienteId: 'e1' }],
      alertasCriticas: [{ id: 'a1', titulo: 'Inconsistencia', mensaje: 'algo' }],
    });
    expect(out).toHaveLength(2);
    expect(out[0].tipo).toBe('alerta_critica');
    expect(out[1].tipo).toBe('documento_pendiente');
  });

  it('ordena tarea_vencida antes que evento_proximo', () => {
    const out = normalizarNotificaciones({
      eventosProximos: [{ id: 'ev1', titulo: 'Audiencia', fecha: '2026-06-30T10:00:00Z' }],
      tareasVencidas: [{ id: 't1', titulo: 'Vencida', fechaVencimiento: null }],
    });
    expect(out[0].tipo).toBe('tarea_vencida');
    expect(out[1].tipo).toBe('evento_proximo');
  });

  it('deduplica por id', () => {
    const out = normalizarNotificaciones({
      tareasVencidas: [
        { id: 't1', titulo: 'A', fechaVencimiento: null },
        { id: 't1', titulo: 'A duplicada', fechaVencimiento: null },
      ],
    });
    expect(out).toHaveLength(1);
  });

  it('construye notificación de enlace expirando con severidad warning', () => {
    const out = normalizarNotificaciones({
      enlacesExpirando: [{ id: 'en1', expiraEn: '2026-06-29T00:00:00Z' }],
    });
    expect(out[0]).toMatchObject({ tipo: 'enlace_expirando', severidad: 'warning' });
    expect(out[0].subtitulo).toContain('Expira');
  });

  it('incluye href correcto por tipo', () => {
    const out = normalizarNotificaciones({
      documentosPendientes: [{ id: 'd1', nombreOriginal: 'x.pdf', expedienteId: 'e99' }],
      eventosProximos: [{ id: 'ev1', titulo: 'X', fecha: '2026-06-30T10:00:00Z' }],
    });
    expect(out.find((n) => n.tipo === 'documento_pendiente')?.href).toBe('/intranet/sgie/expedientes/e99');
    expect(out.find((n) => n.tipo === 'evento_proximo')?.href).toBe('/intranet/sgie/agenda');
  });
});
