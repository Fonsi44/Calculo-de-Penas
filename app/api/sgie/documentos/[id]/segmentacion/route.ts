import { requireAbogado } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertCapability } from '@/lib/access-service';
import { runDocumentSegmentation, getSegmentationRun, reviewSegment, reviewAllSegments } from '@/lib/sgie/document-segmentation-service';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { requestSegmentation } from '@/lib/sgie/document-intelligence-jobs';
import { httpErrorResponse } from '@/lib/http-errors';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`seg:${abogado.userId}`, { max: 20, windowMs: 60000 });
    if (!rl.ok) return rateLimitResponse(rl);
    await assertCapability(abogado.userId, 'document_intelligence.run');
    const enabled = await isFlagEnabled('sgie.document_segmentation.enabled', { userId: abogado.userId });
    if (!enabled) return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const docId = parts[parts.indexOf('documentos') + 1];
    const result = await runDocumentSegmentation(docId, '', abogado.userId);
    return NextResponse.json(result);
  } catch (e) { return httpErrorResponse(e, request); }
}

export async function GET(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    await assertCapability(abogado.userId, 'document_intelligence.read');
    const runId = new URL(request.url).searchParams.get('run_id');
    if (runId) {
      const result = await getSegmentationRun(runId);
      return NextResponse.json(result ?? { error: 'No encontrado' }, { status: result ? 200 : 404 });
    }
    return NextResponse.json({ error: 'Especificar run_id' }, { status: 400 });
  } catch (e) { return httpErrorResponse(e, request); }
}

export async function PATCH(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    validateCsrf(request);
    await assertCapability(abogado.userId, 'document_intelligence.review');
    const body = await request.json();
    if (body.segment_id) {
      await reviewSegment(body.segment_id, { decision: body.decision, correctedStartPage: body.start_page, correctedEndPage: body.end_page, correctedType: body.type, motivo: body.motivo, reviewedBy: abogado.userId });
    } else if (body.run_id && body.decision) {
      await reviewAllSegments(body.run_id, body.decision, abogado.userId);
    }
    return NextResponse.json({ ok: true });
  } catch (e) { return httpErrorResponse(e, request); }
}
