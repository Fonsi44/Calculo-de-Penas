import { describe, it, expect, vi } from 'vitest';

const returningMock = vi.fn();
const onConflictDoUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictDoUpdateMock });

vi.mock('../lib/db', () => ({
  db: { select: vi.fn(), insert: (...args: unknown[]) => valuesMock(...args) },
}));

vi.mock('../lib/schema', () => ({}));

import { POST as PostBlogCategories } from '../app/api/admin/categorias-blog/route';
import { POST as PostTags } from '../app/api/admin/tags/route';
import { POST as PostRedirects } from '../app/api/admin/redirects/route';
import { POST as PostAreas } from '../app/api/admin/areas-juridicas/route';

describe('Admin API endpoints - auth protection', () => {
  it('POST /categorias-blog retorna 401 sin token', async () => {
    const req = new Request('http://x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    const r = await PostBlogCategories(req);
    expect(r.status).toBe(401);
  });

  it('POST /tags retorna 401 sin token', async () => {
    const req = new Request('http://x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    const r = await PostTags(req);
    expect(r.status).toBe(401);
  });

  it('POST /redirects retorna 401 sin token', async () => {
    const req = new Request('http://x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    const r = await PostRedirects(req);
    expect(r.status).toBe(401);
  });

  it('POST /areas-juridicas retorna 401 sin token', async () => {
    const req = new Request('http://x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    const r = await PostAreas(req);
    expect(r.status).toBe(401);
  });
});
