import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertCapability } from '@/lib/access-service';
import { getDashboard } from '@/lib/sgie/dashboard-service';
import { httpErrorResponse } from '@/lib/http-errors';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const abogado = await requireAbogado(request);
    const rl = await rateLimit(`dashboard:${abogado.userId}`, { max: 30, windowMs: 60000 });
    if (!rl.ok) return rateLimitResponse(rl);
    await assertCapability(abogado.userId, 'cases.read');
    const result = await getDashboard(undefined, abogado.userId);
    return NextResponse.json(result);
  } catch (e) { return httpErrorResponse(e, request); }
}
