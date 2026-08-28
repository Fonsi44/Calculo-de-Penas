/**
 * GET /api/legal/corpus — Catálogo de normas indexadas (sin texto completo).
 *
 * Autenticación: Bearer LEGAL_CORPUS_API_KEY o header X-API-Key
 */
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { listCorpusEntries, getCorpusStats } from '@/lib/legal/corpus-api';
import { requireLegalCorpusApiKey } from '@/lib/legal/corpus-route-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authErr = requireLegalCorpusApiKey(request);
  if (authErr) return authErr;

  const ip = getClientIp(request);
  const rl = await rateLimit(ip, { keyPrefix: 'legal_corpus', windowMs: 60_000, max: 60 });
  if (!rl.ok) return rateLimitResponse(rl);

  const entries = listCorpusEntries().map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    decreto: e.decreto,
    status: e.status,
    pdf_path: e.pdf_path,
    article_count: e.article_count,
    has_text: Boolean(e.extracted_txt || e.canonical_json || e.structured_json || e.id === 'HN-LPDP'),
  }));

  return Response.json({
    ...getCorpusStats(),
    entries,
    usage: {
      document: 'GET /api/legal/corpus/{id}',
      search: 'GET /api/legal/search?q=...',
      context: 'POST /api/legal/context { "query": "..." }',
    },
  });
}
