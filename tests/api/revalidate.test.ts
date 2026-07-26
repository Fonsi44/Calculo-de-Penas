/**
 * Fase 3D — Tests del endpoint POST /api/revalidate.
 *
 * Cubre:
 *   1. 401 si falta el header Authorization o el secret es incorrecto.
 *   2. 400 si el body no valida contra el esquema Zod.
 *   3. 200 con `type: 'path'` → revalida la ruta literal.
 *   4. 200 con `type: 'slug'` → resuelve categoría y revalida 3 rutas.
 *   5. 200 con `type: 'slug'` y post no publicado → error en la respuesta.
 *   6. GET reenvía a POST (compatibilidad Vercel Cron).
 *
 * NO hace llamadas reales: mockea `next/cache.revalidatePath` y
 * `lib/blog-db.getPostBySlug`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const revalidatePathMock = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

const getPostBySlugMock = vi.fn();
vi.mock('@/lib/blog-db', () => ({
  getPostBySlug: (...args: unknown[]) => getPostBySlugMock(...args),
}));

import { POST, GET } from '@/app/api/revalidate/route';

function jsonRequest(
  body: unknown,
  opts: { auth?: string } = {},
): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.auth !== undefined) headers['authorization'] = opts.auth;
  return new Request('http://x/api/revalidate', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

const SECRET = 'test-cron-secret-fase3d';

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.CRON_SECRET = SECRET;
});

describe('POST /api/revalidate', () => {
  // ─── Autorización ────────────────────────────────────────────────────────
  it('devuelve 401 si falta el header Authorization', async () => {
    const req = jsonRequest({ type: 'path', value: '/blog' });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/autorizado/i);
  });

  it('devuelve 401 si el Bearer token es incorrecto', async () => {
    const req = jsonRequest(
      { type: 'path', value: '/blog' },
      { auth: 'Bearer token-incorrecto' },
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('devuelve 401 si CRON_SECRET no está configurado', async () => {
    delete process.env.CRON_SECRET;
    const req = jsonRequest(
      { type: 'path', value: '/blog' },
      { auth: 'Bearer whatever' },
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('acepta el Bearer token correcto', async () => {
    const req = jsonRequest(
      { type: 'path', value: '/blog' },
      { auth: `Bearer ${SECRET}` },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // ─── Validación Zod ──────────────────────────────────────────────────────
  it('devuelve 400 si el body no valida (type inválido)', async () => {
    const req = jsonRequest(
      { type: 'invalid', value: '/blog' },
      { auth: `Bearer ${SECRET}` },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/inválido/i);
    expect(Array.isArray(body.details)).toBe(true);
  });

  it('devuelve 400 si value es vacío', async () => {
    const req = jsonRequest(
      { type: 'path', value: '' },
      { auth: `Bearer ${SECRET}` },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ─── type: 'path' ────────────────────────────────────────────────────────
  it('revalida la ruta literal con type=path', async () => {
    const req = jsonRequest(
      { type: 'path', value: '/blog/penal/mi-slug' },
      { auth: `Bearer ${SECRET}` },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.revalidated).toContain('/blog/penal/mi-slug');
    expect(body.count).toBe(1);
    expect(revalidatePathMock).toHaveBeenCalledWith('/blog/penal/mi-slug', 'page');
  });

  it('acepta un array de paths', async () => {
    const req = jsonRequest(
      { type: 'path', value: ['/blog', '/blog/penal', '/blog/penal/a'] },
      { auth: `Bearer ${SECRET}` },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(3);
    expect(revalidatePathMock).toHaveBeenCalledTimes(3);
  });

  // ─── type: 'slug' ────────────────────────────────────────────────────────
  it('resuelve categoría desde getPostBySlug y revalida 3 rutas', async () => {
    getPostBySlugMock.mockResolvedValue({ slug: 'mi-slug', category: 'penal' });
    const req = jsonRequest(
      { type: 'slug', value: 'mi-slug' },
      { auth: `Bearer ${SECRET}` },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(3);
    expect(body.revalidated).toEqual([
      '/blog/penal/mi-slug',
      '/blog/penal',
      '/blog',
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith('/blog/penal/mi-slug', 'page');
    expect(revalidatePathMock).toHaveBeenCalledWith('/blog/penal', 'page');
    expect(revalidatePathMock).toHaveBeenCalledWith('/blog', 'page');
  });

  it('usa "penal" como categoría por defecto si el post no la tiene', async () => {
    getPostBySlugMock.mockResolvedValue({ slug: 'mi-slug', category: null });
    const req = jsonRequest(
      { type: 'slug', value: 'mi-slug' },
      { auth: `Bearer ${SECRET}` },
    );
    const res = await POST(req);
    const body = await res.json();
    expect(body.revalidated).toContain('/blog/penal/mi-slug');
  });

  it('reporta error si el post no está publicado (getPostBySlug=null)', async () => {
    getPostBySlugMock.mockResolvedValue(null);
    const req = jsonRequest(
      { type: 'slug', value: 'slug-privado' },
      { auth: `Bearer ${SECRET}` },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.count).toBe(0);
    expect(body.errores).toHaveLength(1);
    expect(body.errores[0].value).toBe('slug-privado');
    expect(body.errores[0].error).toMatch(/no encontrado/i);
  });

  // ─── GET devuelve 405 ───────────────────────────────────────────────────
  it('GET devuelve 405 (el endpoint requiere POST con body)', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.error).toMatch(/no permitido/i);
  });
});
