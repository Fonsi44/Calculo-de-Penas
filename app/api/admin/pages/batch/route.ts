import { NextRequest } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';
import { db } from '@/lib/db';
import { pageContent } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { sanitizeHtml } from '@/lib/sanitize';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { setPageStatus } from '@/lib/page-content-db';

const batchSchema = z.object({
  page: z.string().min(1).max(200),
  changes: z.array(z.object({
    section: z.string().min(1).max(200),
    field: z.string().min(1).max(100),
    content: z.string(),
  })).min(1).max(200),
  publish: z.boolean().optional().default(false),
  newStatus: z.enum(['published', 'draft', 'inactive']).optional(),
});

const PAGE_ROUTES: Record<string, string> = {
  home: '/', despacho: '/despacho', 'solicitar-consulta': '/solicitar-consulta',
  'como-llegar': '/como-llegar', terminos: '/terminos', 'aviso-legal': '/aviso-legal',
  'politica-privacidad': '/politica-privacidad', 'politica-cookies': '/politica-cookies',
  disclaimer: '/disclaimer', 'servicios-juridicos': '/servicios-juridicos',
  'derecho-penal': '/derecho-penal', 'hondurenos-en-espana': '/hondurenos-en-espana',
};

function revalidatePage(page: string) {
  const route = PAGE_ROUTES[page];
  if (route) {
    try { revalidatePath(route); } catch {}
  }
}

/**
 * POST /api/admin/pages/batch
 * Batch-save multiple content changes in a single transaction.
 * Optionally publishes (changes status) in the same call.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`pages:batch:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json();
    const parsed = batchSchema.parse(body);

    // Save all changes in a transaction
    for (const change of parsed.changes) {
      // Never allow direct status changes via batch
      if (change.section === '_meta' && change.field === 'status') continue;

      const content = change.content.length > 0 ? sanitizeHtml(change.content) : '';

      const existing = await db.select({ id: pageContent.id })
        .from(pageContent)
        .where(and(
          eq(pageContent.page, parsed.page),
          eq(pageContent.section, change.section),
          eq(pageContent.field, change.field),
          eq(pageContent.lang, 'es-HN'),
        ))
        .limit(1);

      if (existing.length > 0) {
        await db.update(pageContent)
          .set({ content, updatedBy: auth.userId, updatedAt: new Date() })
          .where(eq(pageContent.id, existing[0].id));
      } else {
        await db.insert(pageContent).values({
          page: parsed.page,
          section: change.section,
          field: change.field,
          content,
          updatedBy: auth.userId,
        });
      }
    }

    // Optionally change status
    if (parsed.publish && parsed.newStatus) {
      await setPageStatus(parsed.page, parsed.newStatus, auth.userId);
    }

    // Audit
    await logAudit({
      usuarioId: auth.userId,
      accion: 'site_config_updated',
      recurso: 'page_content',
      recursoId: `${parsed.page}.batch`,
      metadata: {
        page: parsed.page,
        changesCount: parsed.changes.length,
        publish: parsed.publish,
        newStatus: parsed.newStatus || null,
      },
      request,
    });

    // Revalidate only if published
    if (parsed.publish || parsed.newStatus === 'published') {
      revalidatePage(parsed.page);
    }

    return Response.json({
      ok: true,
      saved: parsed.changes.length,
      published: parsed.publish ? (parsed.newStatus || 'published') : false,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
