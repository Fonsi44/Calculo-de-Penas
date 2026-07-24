import { requireAbogado } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertCapability } from '@/lib/access-service';
import { listContradictions, getContradiction, reviewContradiction, createContradictionCandidate } from '@/lib/sgie/document-contradictions-service';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { httpErrorResponse } from '@/lib/http-errors';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    await assertCapability(abogado.userId, 'document_intelligence.read');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) { const r = await getContradiction(id); return NextResponse.json(r ?? { error: 'No encontrado' }, { status: r ? 200 : 404 }); }
    const expedienteId = searchParams.get('expediente_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const results = await listContradictions(expedienteId, status);
    return NextResponse.json(results);
  } catch (e) { return httpErrorResponse(e, request); }
}

export async function POST(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`contra:${abogado.userId}`, { max: 20, windowMs: 60000 });
    if (!rl.ok) return rateLimitResponse(rl);
    await assertCapability(abogado.userId, 'document_intelligence.run');
    const enabled = await isFlagEnabled('sgie.document_contradictions.enabled', { userId: abogado.userId });
    if (!enabled) return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    if (action === 'review') {
      await reviewContradiction(body.id, body.decision, abogado.userId, body.motivo);
      return NextResponse.json({ ok: true });
    }
    const result = await createContradictionCandidate(body);
    return NextResponse.json({ id: result });
  } catch (e) { return httpErrorResponse(e, request); }
}
