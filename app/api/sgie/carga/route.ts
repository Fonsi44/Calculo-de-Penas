import { requireAbogado } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertCapability } from '@/lib/access-service';
import { calculateAndPersistWorkload, getLatestWorkload } from '@/lib/sgie/workload-service';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { httpErrorResponse } from '@/lib/http-errors';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    validateCsrf(request);

    const rl = await rateLimit(`carga:${abogado.userId}`, { max: 30, windowMs: 60000 });
    if (!rl.ok) return rateLimitResponse(rl);

    await assertCapability(abogado.userId, 'workload.read');

    const enabled = await isFlagEnabled('sgie.workload.enabled', { userId: abogado.userId });
    if (!enabled) {
      return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    }

    const result = await calculateAndPersistWorkload(abogado.userId);
    return NextResponse.json(result);
  } catch (error) {
    return httpErrorResponse(error, request);
  }
}

export async function GET(request: Request) {
  try {
    const abogado = await requireAbogado(request);

    await assertCapability(abogado.userId, 'workload.read');

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') ?? abogado.userId;

    const result = await getLatestWorkload(userId);
    if (!result) {
      return NextResponse.json({ error: 'Sin datos de carga' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return httpErrorResponse(error, request);
  }
}
