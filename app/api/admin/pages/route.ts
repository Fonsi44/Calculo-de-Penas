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
import { upsertPageContent, duplicateSection, setPageStatus } from '@/lib/page-content-db';

const upsertSchema = z.object({
  page: z.string().min(1).max(200),
  section: z.string().min(1).max(200),
  field: z.string().min(1).max(100),
  content: z.string(),
});

const metaSchema = z.object({
  page: z.string().min(1).max(200),
  meta: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    canonical: z.string().optional(),
    robots: z.string().optional(),
    noindex: z.boolean().optional(),
    keywords: z.string().optional(),
    slug: z.string().optional(),
    parent: z.string().optional(),
    sortOrder: z.number().optional(),
    lang: z.string().optional(),
  }),
});

const statusSchema = z.object({
  page: z.string().min(1).max(200),
  status: z.enum(['published', 'draft', 'inactive']),
});

const blockDuplicateSchema = z.object({
  page: z.string().min(1).max(200),
  sourceSection: z.string().min(1).max(200),
  targetSection: z.string().min(1).max(200),
});

const blockDeleteSchema = z.object({
  page: z.string().min(1).max(200),
  section: z.string().min(1).max(200),
});

const PAGE_ROUTES: Record<string, string> = {
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

function getRouteForPage(page: string): string | undefined {
  return PAGE_ROUTES[page];
}

function revalidatePage(page: string) {
  const route = getRouteForPage(page);
  if (route) {
    try { revalidatePath(route); } catch {}
  }
}

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const section = searchParams.get('section');
    const meta = searchParams.get('meta');

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

    revalidatePage(parsed.page);

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

/** PUT: Batch save metadata for a page. */
export async function PUT(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const body = await request.json();
    const parsed = metaSchema.parse(body);

    const meta = parsed.meta;
    const fieldMap: Record<string, string> = {};
    if (meta.metaTitle !== undefined) fieldMap.meta_title = meta.metaTitle;
    if (meta.metaDescription !== undefined) fieldMap.meta_description = meta.metaDescription;
    if (meta.ogTitle !== undefined) fieldMap.og_title = meta.ogTitle;
    if (meta.ogDescription !== undefined) fieldMap.og_description = meta.ogDescription;
    if (meta.ogImage !== undefined) fieldMap.og_image = meta.ogImage;
    if (meta.canonical !== undefined) fieldMap.canonical = meta.canonical;
    if (meta.robots !== undefined) fieldMap.robots = meta.robots;
    if (meta.noindex !== undefined) fieldMap.noindex = String(meta.noindex);
    if (meta.keywords !== undefined) fieldMap.keywords = meta.keywords;
    if (meta.slug !== undefined) fieldMap.slug = meta.slug;
    if (meta.parent !== undefined) fieldMap.parent = meta.parent;
    if (meta.sortOrder !== undefined) fieldMap.sort_order = String(meta.sortOrder);
    if (meta.lang !== undefined) fieldMap.lang = meta.lang;
    fieldMap.updated_at = new Date().toISOString();

    for (const [field, content] of Object.entries(fieldMap)) {
      await upsertPageContent({ page: parsed.page, section: '_meta', field, content, updatedBy: auth.userId });
    }

    await logAudit({
      usuarioId: auth.userId,
      accion: 'site_config_updated',
      recurso: 'page_content',
      recursoId: `${parsed.page}._meta`,
      metadata: { page: parsed.page, section: '_meta', fields: Object.keys(fieldMap) },
      request,
    });

    revalidatePage(parsed.page);

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

/** PATCH: change page status or duplicate/delete blocks. */
export async function PATCH(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const body = await request.json();
    const { action } = body;

    if (action === 'set-status') {
      const parsed = statusSchema.parse(body);
      await setPageStatus(parsed.page, parsed.status, auth.userId);
      await logAudit({
        usuarioId: auth.userId,
        accion: 'site_config_updated',
        recurso: 'page_content',
        recursoId: `${parsed.page}._meta.status`,
        metadata: { page: parsed.page, status: parsed.status },
        request,
      });
      revalidatePage(parsed.page);
      return Response.json({ ok: true, status: parsed.status });
    }

    if (action === 'duplicate-section') {
      const parsed = blockDuplicateSchema.parse(body);
      await duplicateSection(parsed.page, parsed.sourceSection, parsed.targetSection);
      await logAudit({
        usuarioId: auth.userId,
        accion: 'site_config_updated',
        recurso: 'page_content',
        recursoId: `${parsed.page}.${parsed.targetSection}`,
        metadata: { page: parsed.page, source: parsed.sourceSection, target: parsed.targetSection },
        request,
      });
      revalidatePage(parsed.page);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

/** DELETE: remove a block/section and all its fields. */
export async function DELETE(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const section = searchParams.get('section');

    if (!page || !section) {
      return Response.json({ error: 'page and section are required' }, { status: 400 });
    }

    const parsed = blockDeleteSchema.parse({ page, section });

    await db.delete(pageContent)
      .where(and(
        eq(pageContent.page, parsed.page),
        eq(pageContent.section, parsed.section),
        eq(pageContent.lang, 'es-HN'),
      ));

    await logAudit({
      usuarioId: auth.userId,
      accion: 'site_config_updated',
      recurso: 'page_content',
      recursoId: `${parsed.page}.${parsed.section}`,
      metadata: { page: parsed.page, section: parsed.section, deleted: true },
      request,
    });

    revalidatePage(parsed.page);

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
