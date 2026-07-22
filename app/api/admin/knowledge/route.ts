import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { createKnowledgeSource, submitForReview, approveVersion, publishVersion, withdrawSource } from '@/lib/sgie/knowledge-service';
import { isFlagEnabled } from '@/lib/sgie/feature-flags';
import { accessService } from '@/lib/access-service';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

const createSchema = z.object({
  title: z.string().min(3).max(500),
  type: z.enum(['norma','reforma','jurisprudencia','protocolo','formulario','plantilla','criterio_interno','checklist','guia','modelo_comunicacion']),
  content: z.string().min(1).max(50000),
  jurisdiction: z.string().optional(),
  authority: z.string().optional(),
  officialId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sensitivity: z.enum(['public','internal','restricted']).optional(),
});

const versionSchema = z.object({
  content: z.string().min(1).max(50000),
  changeMotivo: z.string().min(10).max(500).optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireAbogado(req);
    await isFlagEnabled('sgie.knowledge.enabled', {}).catch(() => { throw Object.assign(new Error('Knowledge disabled'), { status: 403 }); });
    await accessService.assertSgieAccess(auth.userId, 'knowledge.read');

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    const rows = await db.execute(sql`
      SELECT ks.*, kv.version, kv.estado as version_estado, kv.content_hash
      FROM knowledge_sources ks
      LEFT JOIN knowledge_versions kv ON kv.source_id = ks.id AND kv.version = (
        SELECT max(version) FROM knowledge_versions WHERE source_id = ks.id
      )
      ORDER BY ks.creado_en DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `);

    return Response.json({ sources: (rows as unknown as { rows: unknown[] }).rows, page, limit });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return Response.json({ error: err.message || 'Error' }, { status: err.status || 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const rl = await rateLimit(`sgie:knowledge:create:${auth.userId}`, { max: 10, windowMs: 60000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    await isFlagEnabled('sgie.knowledge.enabled', {}).catch(() => { throw Object.assign(new Error('Knowledge disabled'), { status: 403 }); });
    await accessService.assertSgieAccess(auth.userId, 'knowledge.create');

    const body = createSchema.parse(await req.json());
    const result = await createKnowledgeSource({ ...body, actorId: auth.userId });

    return Response.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'Validación', details: e.issues }, { status: 422 });
    const err = e as { status?: number; message?: string };
    return Response.json({ error: err.message || 'Error' }, { status: err.status || 500 });
  }
}
