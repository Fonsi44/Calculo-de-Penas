/**
 * Tests API corpus legal — autenticación por API key, sin RAG.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getCorpus } from '@/app/api/legal/corpus/route';
import { GET as getDoc } from '@/app/api/legal/corpus/[id]/route';
import { GET as searchGet, POST as searchPost } from '@/app/api/legal/search/route';
import { POST as contextPost } from '@/app/api/legal/context/route';

const SECRET = 'test-legal-corpus-key-32chars!!';

function authHeaders(extra: Record<string, string> = {}) {
  return {
    authorization: `Bearer ${SECRET}`,
    ...extra,
  };
}

beforeEach(() => {
  process.env.LEGAL_CORPUS_API_KEY = SECRET;
});

describe('GET /api/legal/corpus', () => {
  it('401 sin API key', async () => {
    const res = await getCorpus(new Request('http://x/api/legal/corpus'));
    expect(res.status).toBe(401);
  });

  it('200 con Bearer correcto', async () => {
    const res = await getCorpus(
      new Request('http://x/api/legal/corpus', { headers: authHeaders() }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total_norms).toBeGreaterThan(25);
    expect(Array.isArray(body.entries)).toBe(true);
  });

  it('acepta X-API-Key', async () => {
    const res = await getCorpus(
      new Request('http://x/api/legal/corpus', {
        headers: { 'x-api-key': SECRET },
      }),
    );
    expect(res.status).toBe(200);
  });
});

describe('GET /api/legal/corpus/[id]', () => {
  it('devuelve texto de una norma conocida', async () => {
    const res = await getDoc(
      new Request('http://x/api/legal/corpus/HN-CONST-131-1982', {
        headers: authHeaders(),
      }),
      { params: Promise.resolve({ id: 'HN-CONST-131-1982' }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('HN-CONST-131-1982');
    expect(body.text.length).toBeGreaterThan(1000);
  });

  it('referencia LPDP sin ley autónoma', async () => {
    const res = await getDoc(
      new Request('http://x/api/legal/corpus/HN-LPDP', { headers: authHeaders() }),
      { params: Promise.resolve({ id: 'HN-LPDP' }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.source).toBe('reference');
    expect(body.meta.related_norms).toContain('HN-LTAIP-170-2006');
  });
});

describe('GET /api/legal/search', () => {
  it('encuentra resultados por texto', async () => {
    const res = await searchGet(
      new Request('http://x/api/legal/search?q=constitucion', { headers: authHeaders() }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe('fulltext');
    expect(body.count).toBeGreaterThan(0);
  });
});

describe('POST /api/legal/context', () => {
  it('devuelve contexto para IA externa', async () => {
    const res = await contextPost(
      new Request('http://x/api/legal/context', {
        method: 'POST',
        headers: { ...authHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'despido laboral prestaciones', limit: 3 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe('fulltext');
    expect(body.context.length).toBeGreaterThan(50);
    expect(body.hits.length).toBeGreaterThan(0);
  });
});

describe('POST /api/legal/search', () => {
  it('valida body', async () => {
    const res = await searchPost(
      new Request('http://x/api/legal/search', {
        method: 'POST',
        headers: { ...authHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({ q: 'x' }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
