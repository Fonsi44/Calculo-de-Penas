import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { submitForReview, approveVersion, publishVersion, withdrawSource } from '@/lib/sgie/knowledge-service';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { accessService } from '@/lib/access-service';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

const actionSchema = z.object({
  sourceId: z.string().uuid(),
  motivo: z.string().min(10).max(500).optional(),
});

async function checkFlag() {
  await isFlagEnabled('sgie.knowledge.enabled', {}).catch(() => { throw Object.assign(new Error('Knowledge disabled'), { status: 403 }); });
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    await checkFlag();

    const rl = await rateLimit(`sgie:knowledge:${action}:${auth.userId}`, { max: 10, windowMs: 60000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = actionSchema.parse(await req.json());

    switch (action) {
      case 'review':
        await accessService.assertSgieAccess(auth.userId, 'knowledge.review');
        await submitForReview(body.sourceId);
        break;
      case 'approve':
        await accessService.assertSgieAccess(auth.userId, 'knowledge.approve');
        const versions = await db.execute(sql`SELECT version FROM knowledge_versions WHERE source_id=${body.sourceId}::uuid AND estado='pending_legal_review' ORDER BY version DESC LIMIT 1`);
        const v = (versions as unknown as { rows: Array<{ version: number }> }).rows[0];
        if (!v) throw Object.assign(new Error('No pending version'), { status: 404 });
        await approveVersion(body.sourceId, v.version, auth.userId);
        break;
      case 'publish':
        await accessService.assertSgieAccess(auth.userId, 'knowledge.publish');
        const pubVersions = await db.execute(sql`SELECT version FROM knowledge_versions WHERE source_id=${body.sourceId}::uuid AND estado='approved' ORDER BY version DESC LIMIT 1`);
        const pv = (pubVersions as unknown as { rows: Array<{ version: number }> }).rows[0];
        if (!pv) throw Object.assign(new Error('No approved version'), { status: 404 });
        await publishVersion(body.sourceId, pv.version, auth.userId);
        break;
      case 'withdraw':
        await accessService.assertSgieAccess(auth.userId, 'knowledge.withdraw');
        await withdrawSource(body.sourceId);
        break;
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    return Response.json({ ok: true, action });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'Validación', details: e.issues }, { status: 422 });
    const err = e as { status?: number; message?: string };
    return Response.json({ error: err.message || 'Error' }, { status: err.status || 500 });
  }
}
