import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signToken } from '../../lib/auth';

const returningMock = vi.fn();
const onConflictDoUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictDoUpdateMock });
const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

vi.mock('../../lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: (...args: unknown[]) => insertMock(...args),
  },
  isDbConfigured: () => true,
}));

vi.mock('../../lib/schema', () => ({
  delitos: { id: 'delitos.id' },
  rateLimits: { identifier: 'rate_limits.identifier', keyPrefix: 'rate_limits.key_prefix' },
}));

import { POST } from '../../app/api/calcular/route';
import { db } from '../../lib/db';

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> };

const delitoValido = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Hurto simple',
  articulo: 'Art. 363 CP',
  clasificacion: 'Patrimonio',
  penasAccesorias: ['Multa'],
  penaMinimaMeses: 6,
  penaMaximaMeses: 24,
  tienePenaAlternativa: false,
  penaAlternativaMin: 0,
  penaAlternativaMax: 0,
};

function authedRequest(body: unknown): Request {
  const t = signToken({ userId: 'test-user', email: 't@x.com', rol: 'abogado' });
  return new Request('http://x/api/calcular', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: `token=${t}` },
    body: JSON.stringify(body),
  });
}

const baseBody = {
  delitos: [{
    delito_id: delitoValido.id,
    pena_seleccionada: 'prision' as const,
    variables_activas: [],
    grado_autoria: 'autor_directo' as const,
    grado_ejecucion: 'consumado' as const,
    reduccion_tentativa: 1,
    agravantes: [],
    atenuantes: [],
    eximentes: [],
    eximente_completa: null,
  }],
  tipo_concurso: 'ninguno' as const,
};

describe('POST /api/calcular', () => {
  beforeEach(() => {
    mockDb.select.mockReset();
    returningMock.mockResolvedValue([{ count: 1, expiresAt: new Date(Date.now() + 60_000).toISOString() }]);
  });

  it('retorna 401 sin token', async () => {
    const req = new Request('http://x/api/calcular', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(baseBody),
    });
    const r = await POST(req);
    expect(r.status).toBe(401);
  });

  it('retorna 400 con body inválido (sin delito_id)', async () => {
    const req = authedRequest({ ...baseBody, delitos: [{ ...baseBody.delitos[0], delito_id: '' }] });
    const r = await POST(req);
    expect(r.status).toBe(400);
    const body = await r.json();
    expect(body.error).toBeTruthy();
  });

  it('retorna 400 con body inválido (JSON malformado)', async () => {
    const t = signToken({ userId: 'test-user-2', email: 't@x.com', rol: 'abogado' });
    const req = new Request('http://x/api/calcular', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `token=${t}` },
      body: '{esto no es json',
    });
    const r = await POST(req);
    expect(r.status).toBe(400);
  });

  it('retorna 400 con agravante de id inválido (zod)', async () => {
    const req = authedRequest({
      ...baseBody,
      delitos: [{ ...baseBody.delitos[0], agravantes: ['id_falso'] }],
    });
    const r = await POST(req);
    expect(r.status).toBe(400);
  });

  it('retorna 200 con cálculo válido y DB mockeada', async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([delitoValido]),
    };
    mockDb.select.mockReturnValue(chain);

    const req = authedRequest(baseBody);
    const r = await POST(req);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.delitos_analizados).toHaveLength(1);
    expect(body.analisis_juridico).toContain('Código Penal de Honduras');
  });

  it('retorna 404 si delito no existe en BD', async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    mockDb.select.mockReturnValue(chain);

    const req = authedRequest(baseBody);
    const r = await POST(req);
    expect(r.status).toBe(404);
    const body = await r.json();
    expect(body.error).toContain('no encontrado');
  });
});
