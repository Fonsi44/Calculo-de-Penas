/**
 * GET /api/legal/corpus/[id] — Texto completo de una norma (+ JSON estructurado si existe).
 */
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { getCorpusDocument } from '@/lib/legal/corpus-api';
import { requireLegalCorpusApiKey } from '@/lib/legal/corpus-route-auth';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const authErr = requireLegalCorpusApiKey(request);
  if (authErr) return authErr;

  const ip = getClientIp(request);
  const rl = await rateLimit(ip, { keyPrefix: 'legal_corpus_doc', windowMs: 60_000, max: 120 });
  if (!rl.ok) return rateLimitResponse(rl);

  const { id } = await context.params;
  const doc = getCorpusDocument(decodeURIComponent(id));
  if (!doc) {
    return Response.json({ error: 'Norma no encontrada', id }, { status: 404 });
  }

  const url = new URL(request.url);
  const includeStructured = url.searchParams.get('structured') === '1';

  return Response.json({
    id: doc.entry.id,
    title: doc.entry.title,
    decreto: doc.entry.decreto,
    type: doc.entry.type,
    status: doc.entry.status,
    pdf_path: doc.entry.pdf_path,
    meta: doc.meta,
    text: doc.text,
    ...(includeStructured && doc.structured ? { structured: doc.structured } : {}),
    aviso:
      'Corpus de referencia. Verificar citas contra PDF oficial en docs/reference/legal/. No constituye asesoría legal.',
  });
}
