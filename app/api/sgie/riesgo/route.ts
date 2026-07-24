import { requireAbogado } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertCapability } from '@/lib/access-service';
import { evaluateRisk, evaluateAndPersistRisk, getLatestRisk, listRisksByLevel } from '@/lib/sgie/risk-service';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { httpErrorResponse } from '@/lib/http-errors';
import { NextResponse } from 'next/server';

const evaluateSchema = z.object({
  expedienteId: z.string().uuid(),
  persist: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const abogado = await requireAbogado(request);

    const rl = await rateLimit(`riesgo:${abogado.userId}`, { max: 30, windowMs: 60000 });
    if (!rl.ok) return rateLimitResponse(rl);

    await assertCapability(abogado.userId, 'risk.read');

    const enabled = await isFlagEnabled('sgie.risk.enabled', { userId: abogado.userId });
    if (!enabled) {
      return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    }

    const body = evaluateSchema.parse(await request.json());
    const result = body.persist
      ? await evaluateAndPersistRisk(body.expedienteId)
      : await evaluateRisk(body.expedienteId);

    return NextResponse.json(result);
  } catch (error) {
    return httpErrorResponse(error, request);
  }
}

export async function GET(request: Request) {
  try {
    const abogado = await requireAbogado(request);

    await assertCapability(abogado.userId, 'risk.read');

    const { searchParams } = new URL(request.url);
    const expedienteId = searchParams.get('expediente_id');

    if (expedienteId) {
      const result = await getLatestRisk(expedienteId);
      return NextResponse.json(result ?? { error: 'Sin evaluación' }, { status: result ? 200 : 404 });
    }

    const level = searchParams.get('level') as 'low' | 'medium' | 'high' | 'critical' | 'unknown' | null;
    const limit = Number(searchParams.get('limit')) || 50;

    if (level) {
      const results = await listRisksByLevel(level, limit);
      return NextResponse.json(results);
    }

    return NextResponse.json({ error: 'Especificar expediente_id o level' }, { status: 400 });
  } catch (error) {
    return httpErrorResponse(error, request);
  }
}
