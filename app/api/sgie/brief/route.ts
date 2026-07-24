import { requireAbogado } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertCapability } from '@/lib/access-service';
import { generateBrief, getBrief, getBriefHistory, upsertPreferences, getPreferences } from '@/lib/sgie/brief-service';
import { getRecommendations } from '@/lib/sgie/recommendation-service';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { httpErrorResponse } from '@/lib/http-errors';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`brief:${abogado.userId}`, { max: 20, windowMs: 60000 });
    if (!rl.ok) return rateLimitResponse(rl);
    await assertCapability(abogado.userId, 'brief.read');
    const enabled = await isFlagEnabled('sgie.daily_brief.enabled', { userId: abogado.userId });
    if (!enabled) return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    const result = await generateBrief(abogado.userId);
    return NextResponse.json(result);
  } catch (e) { return httpErrorResponse(e, request); }
}

export async function GET(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    await assertCapability(abogado.userId, 'brief.read');
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('fecha') || undefined;
    const hist = searchParams.get('historial');
    if (hist === 'true') {
      const history = await getBriefHistory(abogado.userId);
      return NextResponse.json(history);
    }
    const brief = await getBrief(abogado.userId, date);
    const recs = await getRecommendations(abogado.userId);
    return NextResponse.json({ brief, recommendations: recs });
  } catch (e) { return httpErrorResponse(e, request); }
}

export async function PATCH(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    validateCsrf(request);
    await assertCapability(abogado.userId, 'brief.configure');
    const body = await request.json();
    await upsertPreferences(abogado.userId, body);
    return NextResponse.json({ ok: true });
  } catch (e) { return httpErrorResponse(e, request); }
}
