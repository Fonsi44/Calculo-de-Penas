import { db } from '@/lib/db';
import { pageContent } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { sanitizeHtml } from '@/lib/sanitize';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const upsertSchema = z.object({
  page: z.string().min(1).max(200),
  section: z.string().min(1).max(200),
  field: z.string().min(1).max(100),
  content: z.string(),
});

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const section = searchParams.get('section');

    let rows;
    if (page && section) {
      rows = await db.select().from(pageContent)
        .where(and(eq(pageContent.page, page), eq(pageContent.section, section), eq(pageContent.lang, 'es-HN')));
    } else if (page) {
      rows = await db.select().from(pageContent)
        .where(and(eq(pageContent.page, page), eq(pageContent.lang, 'es-HN')));
    } else {
      const grouped = await db.select({
        page: pageContent.page,
        sections: sql<number>`count(distinct ${pageContent.section})::int`,
        fields: sql<number>`count(*)::int`,
        updatedAt: sql<string>`max(${pageContent.updatedAt})`,
      })
        .from(pageContent)
        .groupBy(pageContent.page)
        .orderBy(pageContent.page);
      return Response.json({ pages: grouped });
    }

    const grouped: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      if (!grouped[row.section]) grouped[row.section] = {};
      grouped[row.section][row.field] = row.content;
    }
    return Response.json({ entries: rows, grouped });
  } catch (err) {
    return authFailureResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`pages:upsert:${auth.userId}`, { max: 60, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = await request.json();
    const parsed = upsertSchema.parse(body);

    const content = parsed.content.length > 0 ? sanitizeHtml(parsed.content) : '';

    const existing = await db.select({ id: pageContent.id })
      .from(pageContent)
      .where(and(
        eq(pageContent.page, parsed.page),
        eq(pageContent.section, parsed.section),
        eq(pageContent.field, parsed.field),
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
        section: parsed.section,
        field: parsed.field,
        content,
        updatedBy: auth.userId,
      });
    }

    await logAudit({
      usuarioId: auth.userId,
      accion: 'site_config_updated',
      recurso: 'page_content',
      recursoId: `${parsed.page}.${parsed.section}.${parsed.field}`,
      metadata: { page: parsed.page, section: parsed.section, field: parsed.field },
      request,
    });

    let revalidated = false;
    try {
      const pageRoutes: Record<string, string> = {
        home: '/',
        despacho: '/despacho',
        'solicitar-consulta': '/solicitar-consulta',
        'como-llegar': '/como-llegar',
        terminos: '/terminos',
        'aviso-legal': '/aviso-legal',
        'politica-privacidad': '/politica-privacidad',
        'politica-cookies': '/politica-cookies',
        disclaimer: '/disclaimer',
        'servicios-juridicos': '/servicios-juridicos',
        'derecho-penal': '/derecho-penal',
        'hondurenos-en-espana': '/hondurenos-en-espana',
      };
      const route = pageRoutes[parsed.page];
      if (route) {
        revalidatePath(route);
        revalidated = true;
      }
    } catch {}

    return Response.json({ ok: true, revalidated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
