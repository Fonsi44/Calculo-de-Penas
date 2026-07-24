import { requireAbogado } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertCapability } from '@/lib/access-service';
import { calculateAutonomy, getAutonomyHistory } from '@/lib/sgie/autonomy-metrics-service';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { httpErrorResponse } from '@/lib/http-errors';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`autonomy:${abogado.userId}`, { max: 10, windowMs: 60000 });
    if (!rl.ok) return rateLimitResponse(rl);
    await assertCapability(abogado.userId, 'metrics.read');
    const enabled = await isFlagEnabled('sgie.autonomy_metrics.enabled', { userId: abogado.userId });
    if (!enabled) return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    const body = await request.json();
    const result = await calculateAutonomy(body.organizationId || 'global', body.periodStart || new Date().toISOString().split('T')[0], body.periodEnd || new Date().toISOString().split('T')[0]);
    return NextResponse.json(result);
  } catch (e) { return httpErrorResponse(e, request); }
}

export async function GET(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    await assertCapability(abogado.userId, 'metrics.read');
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id') || 'global';
    const limit = Number(searchParams.get('limit')) || 30;
    const history = await getAutonomyHistory(orgId, limit);
    return NextResponse.json(history);
  } catch (e) { return httpErrorResponse(e, request); }
}
