/**
 * GET /api/legal/search?q=... — Búsqueda por texto (sin embeddings / sin costo de IA).
 *
 * POST acepta JSON: { "q": "...", "limit": 10, "ids": ["HN-CP-130-2017"] }
 */
import { z } from 'zod';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { searchCorpus } from '@/lib/legal/corpus-api';
import { requireLegalCorpusApiKey } from '@/lib/legal/corpus-route-auth';

export const runtime = 'nodejs';

const postSchema = z.object({
  q: z.string().min(2).max(500),
  limit: z.number().int().min(1).max(30).optional(),
  ids: z.array(z.string().min(2).max(80)).max(20).optional(),
});

export async function GET(request: Request) {
  const authErr = requireLegalCorpusApiKey(request);
  if (authErr) return authErr;

  const ip = getClientIp(request);
  const rl = await rateLimit(ip, { keyPrefix: 'legal_corpus_search', windowMs: 60_000, max: 60 });
  if (!rl.ok) return rateLimitResponse(rl);

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return Response.json({ error: 'Parámetro q requerido (mín. 2 caracteres)' }, { status: 400 });
  }
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 10) || 10, 30);

  const results = searchCorpus(q, { limit });
  return Response.json({
    query: q,
    count: results.length,
    results,
    mode: 'fulltext',
  });
}

export async function POST(request: Request) {
  const authErr = requireLegalCorpusApiKey(request);
  if (authErr) return authErr;

  const ip = getClientIp(request);
  const rl = await rateLimit(ip, { keyPrefix: 'legal_corpus_search', windowMs: 60_000, max: 60 });
  if (!rl.ok) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validación fallida', details: parsed.error.flatten() }, { status: 400 });
  }

  const { q, limit, ids } = parsed.data;
  const results = searchCorpus(q, { limit, ids });
  return Response.json({
    query: q,
    count: results.length,
    results,
    mode: 'fulltext',
  });
}
