/**
 * Tests de magic links SGIE — almacenamiento por hash (Fase 1 MVP).
 *
 * Objetivo: garantizar que el token NUNCA se persiste en claro.
 * - hashToken: determinismo, formato y no reversibilidad trivial.
 * - crearEnlace: persiste solo tokenHash (no token), devuelve token en claro
 *   únicamente en el objeto retornado.
 * - validarEnlace: busca por hash del token recibido, códigos de error.
 *
 * DB mockeada con vi.mock: estos tests no requieren conexión real.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mock de la BD antes de importar el módulo bajo test ---
// Capturamos los valores insertados para aserciones.
const insertedValues: Array<Record<string, unknown>> = [];
const selectReturn: Array<Record<string, unknown>> = [];

vi.mock('../lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn((row: Record<string, unknown>) => {
        insertedValues.push(row);
        return {
          returning: vi.fn(async () => [
            { id: 'enlace-1', expedienteId: row.expedienteId, expiraEn: row.expiraEn, usosMaximos: row.usosMaximos ?? null },
          ]),
        };
      }),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => selectReturn.slice()),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn(async () => ({})) })),
    })),
  },
}));

vi.mock('../lib/schema', () => ({
  enlacesMagicos: {
    id: 'id',
    tokenHash: 'token_hash',
    expedienteId: 'expediente_id',
    requisitoExpedienteId: 'requisito_expediente_id',
    clienteEmail: 'cliente_email',
    expiraEn: 'expira_en',
    usosMaximos: 'usos_maximos',
    usosActuales: 'usos_actuales',
    revocadoEn: 'revocado_en',
  },
}));

import { hashToken } from '../lib/sgie/util';
import { crearEnlace, validarEnlace } from '../lib/sgie/enlaces-magicos';

const TOKEN_VALIDO = 'abc123-token-de-prueba';

describe('hashToken', () => {
  it('es determinista: mismo token → mismo hash', () => {
    expect(hashToken(TOKEN_VALIDO)).toBe(hashToken(TOKEN_VALIDO));
  });

  it('produce hex lowercase de 64 caracteres (SHA-256)', () => {
    const h = hashToken(TOKEN_VALIDO);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('no es reversible: el hash no contiene el token', () => {
    const h = hashToken(TOKEN_VALIDO);
    expect(h).not.toContain(TOKEN_VALIDO);
  });

  it('tokens distintos producen hashes distintos', () => {
    expect(hashToken('token-A')).not.toBe(hashToken('token-B'));
  });
});

describe('crearEnlace — persiste solo hash', () => {
  beforeEach(() => {
    insertedValues.length = 0;
  });

  it('almacena tokenHash y NO guarda token en claro', async () => {
    await crearEnlace({ expedienteId: 'exp-1' }, 'user-1');

    expect(insertedValues).toHaveLength(1);
    const inserted = insertedValues[0];

    expect(inserted).toHaveProperty('tokenHash');
    expect(inserted).not.toHaveProperty('token');
    expect(inserted.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('devuelve el token en claro SOLO en la respuesta (para email/copiar)', async () => {
    const enlace = await crearEnlace({ expedienteId: 'exp-1' }, 'user-1');

    expect(enlace).toHaveProperty('token');
    expect(typeof enlace.token).toBe('string');
    expect(enlace.token.length).toBeGreaterThan(0);
    // El hash del token devuelto debe coincidir con el persistido.
    const inserted = insertedValues[insertedValues.length - 1];
    expect(hashToken(enlace.token)).toBe(inserted.tokenHash);
  });
});

describe('validarEnlace — busca por hash', () => {
  beforeEach(() => {
    selectReturn.length = 0;
  });

  it('token no encontrado → no_encontrado', async () => {
    selectReturn.length = 0;
    const r = await validarEnlace('token-inexistente');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe('no_encontrado');
  });

  it('token revocado → revocado', async () => {
    selectReturn.push({
      id: 'enlace-1',
      expedienteId: 'exp-1',
      requisitoExpedienteId: null,
      clienteEmail: null,
      expiraEn: new Date(Date.now() + 86_400_000),
      usosMaximos: 5,
      usosActuales: 0,
      revocadoEn: new Date(),
    });
    const r = await validarEnlace('token-revocado');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe('revocado');
  });

  it('token expirado → expirado', async () => {
    selectReturn.push({
      id: 'enlace-1',
      expedienteId: 'exp-1',
      requisitoExpedienteId: null,
      clienteEmail: null,
      expiraEn: new Date(Date.now() - 86_400_000),
      usosMaximos: 5,
      usosActuales: 0,
      revocadoEn: null,
    });
    const r = await validarEnlace('token-expirado');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe('expirado');
  });

  it('token agotado → agotado', async () => {
    selectReturn.push({
      id: 'enlace-1',
      expedienteId: 'exp-1',
      requisitoExpedienteId: null,
      clienteEmail: null,
      expiraEn: new Date(Date.now() + 86_400_000),
      usosMaximos: 1,
      usosActuales: 1,
      revocadoEn: null,
    });
    const r = await validarEnlace('token-agotado');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe('agotado');
  });

  it('token válido → ok y no incluye token en claro en el resultado', async () => {
    selectReturn.push({
      id: 'enlace-1',
      expedienteId: 'exp-1',
      requisitoExpedienteId: null,
      clienteEmail: null,
      expiraEn: new Date(Date.now() + 86_400_000),
      usosMaximos: 5,
      usosActuales: 0,
      revocadoEn: null,
    });
    const r = await validarEnlace('token-valido');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.enlace.id).toBe('enlace-1');
      // El resultado de validación nunca debe contener el token.
      expect(r.enlace).not.toHaveProperty('token');
    }
  });
});
