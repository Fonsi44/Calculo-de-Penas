/**
 * POST /api/legal/context — Fragmentos relevantes para inyectar en un prompt de IA externa.
 *
 * No usa embeddings ni proveedores de pago: búsqueda full-text local sobre el corpus.
 *
 * Body: { "query": "pensión alimenticia", "max_chars": 12000, "limit": 8 }
 */
import { z } from 'zod';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { buildContextForQuery } from '@/lib/legal/corpus-api';
import { requireLegalCorpusApiKey } from '@/lib/legal/corpus-route-auth';

export const runtime = 'nodejs';

const bodySchema = z.object({
  query: z.string().min(2).max(500),
  max_chars: z.number().int().min(500).max(50000).optional(),
  limit: z.number().int().min(1).max(15).optional(),
});

export async function POST(request: Request) {
  const authErr = requireLegalCorpusApiKey(request);
  if (authErr) return authErr;

  const ip = getClientIp(request);
  const rl = await rateLimit(ip, { keyPrefix: 'legal_corpus_ctx', windowMs: 60_000, max: 30 });
  if (!rl.ok) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validación fallida', details: parsed.error.flatten() }, { status: 400 });
  }

  const { query, max_chars, limit } = parsed.data;
  const result = buildContextForQuery(query, { maxChars: max_chars, limit });

  return Response.json({
    ...result,
    mode: 'fulltext',
    aviso:
      'Contexto recuperado del corpus local. La IA externa debe citar norma e ID; verificar contra PDF oficial.',
    instructions_for_ai: [
      'Citar siempre el id de norma (ej. HN-CP-130-2017) y el decreto cuando aplique.',
      'Si la información no está en el contexto, indicar que no consta en el corpus consultado.',
      'No afirmar vigencia de reformas no incluidas en el corpus.',
    ],
  });
}
