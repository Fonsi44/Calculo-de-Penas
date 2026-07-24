import { requireAbogado } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertCapability } from '@/lib/access-service';
import { compareDocuments, getComparison } from '@/lib/sgie/document-comparison-service';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { httpErrorResponse } from '@/lib/http-errors';
import { NextResponse } from 'next/server';

const compareSchema = z.object({ sourceDocId: z.string().uuid(), targetDocId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`comp:${abogado.userId}`, { max: 20, windowMs: 60000 });
    if (!rl.ok) return rateLimitResponse(rl);
    await assertCapability(abogado.userId, 'document_intelligence.run');
    const enabled = await isFlagEnabled('sgie.document_comparison.enabled', { userId: abogado.userId });
    if (!enabled) return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    const { sourceDocId, targetDocId } = compareSchema.parse(await request.json());
    const result = await compareDocuments(sourceDocId, targetDocId);
    return NextResponse.json(result);
  } catch (e) { return httpErrorResponse(e, request); }
}
