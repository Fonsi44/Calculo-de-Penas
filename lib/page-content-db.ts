import { db } from '@/lib/db';
import { isUsableDatabaseUrl } from '@/lib/database-url';
import { pageContent } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { cache } from 'react';
import { validateEditablePageContent } from '@/lib/content-policy';

export type PageContentRow = typeof pageContent.$inferSelect;
export type PageContentInsert = typeof pageContent.$inferInsert;

export async function getPageContent(page: string, options?: { includeUnpublished?: boolean }): Promise<Record<string, string>> {
  if (!isUsableDatabaseUrl(process.env.DATABASE_URL)) return {};
  // If the page is not published and we're not explicitly including unpublished, return empty
  if (!options?.includeUnpublished) {
    try {
      const meta = await getPageMeta(page);
      if (meta.status !== 'published') {
        return {};
      }
    } catch {}
  }
  const rows = await db.select().from(pageContent)
    .where(and(eq(pageContent.page, page), eq(pageContent.lang, 'es-HN')));
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[`${row.section}.${row.field}`] = row.content;
  }
  return map;
}

export async function getPageContentBySection(page: string, section: string): Promise<Record<string, string>> {
  if (!isUsableDatabaseUrl(process.env.DATABASE_URL)) return {};
  const rows = await db.select().from(pageContent)
    .where(and(eq(pageContent.page, page), eq(pageContent.section, section), eq(pageContent.lang, 'es-HN')));
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.field] = row.content;
  }
  return map;
}

export async function upsertPageContent(params: {
  page: string;
  section: string;
  field: string;
  content: string;
  updatedBy?: string;
}) {
  // Política de contenido administrable: bloquea claims comerciales no
  // autorizados y testimonios ficticios antes de persistir (AGENTS.md R24).
  validateEditablePageContent(params.page, params.section, params.field, params.content);

  const existing = await db.select({ id: pageContent.id })
    .from(pageContent)
    .where(and(
      eq(pageContent.page, params.page),
      eq(pageContent.section, params.section),
      eq(pageContent.field, params.field),
      eq(pageContent.lang, 'es-HN'),
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.update(pageContent)
      .set({ content: params.content, updatedBy: params.updatedBy ?? null, updatedAt: new Date() })
      .where(eq(pageContent.id, existing[0].id));
  } else {
    await db.insert(pageContent).values({
      page: params.page,
      section: params.section,
      field: params.field,
      content: params.content,
      updatedBy: params.updatedBy ?? null,
    });
  }
}

export const getPagesList = cache(async (): Promise<{ page: string; sections: number; fields: number; updatedAt: string | null }[]> => {
  const rows = await db.select({
    page: pageContent.page,
    sections: sql<number>`count(distinct ${pageContent.section})::int`,
    fields: sql<number>`count(*)::int`,
    updatedAt: sql<string>`max(${pageContent.updatedAt})`,
  })
    .from(pageContent)
    .groupBy(pageContent.page)
    .orderBy(pageContent.page);

  return rows.map(r => ({
    page: r.page,
    sections: r.sections,
    fields: r.fields,
    updatedAt: r.updatedAt,
  }));
});

type FieldDef = { key: string; label: string; type: 'text' | 'textarea' | 'richtext'; default?: string };
type SectionDef = { key: string; label: string; fields: FieldDef[] };
type PageDef = { page: string; label: string; sections: SectionDef[] };

// ─── Metadata helpers (SEO, status, layout) ─────────────────────

export type PageMetaData = {
  status: 'published' | 'draft' | 'inactive';
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  robots: string;
  noindex: boolean;
  keywords: string;
  slug: string;
  parent: string;
  sortOrder: number;
  lang: string;
  publishedAt: string | null;
  updatedAt: string | null;
};

export const DEFAULT_PAGE_META: PageMetaData = {
  status: 'draft',
  metaTitle: '',
  metaDescription: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  canonical: '',
  robots: 'index, follow',
  noindex: false,
  keywords: '',
  slug: '',
  parent: '',
  sortOrder: 0,
  lang: 'es-HN',
  publishedAt: null,
  updatedAt: null,
};

/** Check if a page has any content (non-meta fields). */
export async function pageHasContent(page: string): Promise<boolean> {
  const rows = await db.select({ id: pageContent.id }).from(pageContent)
    .where(and(
      eq(pageContent.page, page),
      eq(pageContent.lang, 'es-HN'),
      sql`${pageContent.section} != '_meta'`,
      sql`${pageContent.section} != '_layout'`,
      sql`${pageContent.section} != '_visibility'`,
    ))
    .limit(1);
  return rows.length > 0;
}

/** Load metadata for a page from `_meta.*` fields in page_content.
 *  Status is determined by explicit _meta.status. If not set, defaults to 'draft'.
 *  NEVER auto-publishes — status changes only happen via explicit PATCH set-status.
 */
export async function getPageMeta(page: string): Promise<PageMetaData> {
  if (!isUsableDatabaseUrl(process.env.DATABASE_URL)) return { ...DEFAULT_PAGE_META };
  const rows = await db.select().from(pageContent)
    .where(and(
      eq(pageContent.page, page),
      eq(pageContent.lang, 'es-HN'),
      sql`${pageContent.section} = '_meta'`,
    ));
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.field] = row.content;
  }

  const explicitStatus = map.status as PageMetaData['status'] | undefined;
  const status: PageMetaData['status'] =
    (explicitStatus && ['published', 'draft', 'inactive'].includes(explicitStatus))
      ? explicitStatus
      : DEFAULT_PAGE_META.status;

  return {
    status,
    metaTitle: map.meta_title ?? DEFAULT_PAGE_META.metaTitle,
    metaDescription: map.meta_description ?? DEFAULT_PAGE_META.metaDescription,
    ogTitle: map.og_title ?? DEFAULT_PAGE_META.ogTitle,
    ogDescription: map.og_description ?? DEFAULT_PAGE_META.ogDescription,
    ogImage: map.og_image ?? DEFAULT_PAGE_META.ogImage,
    canonical: map.canonical ?? DEFAULT_PAGE_META.canonical,
    robots: map.robots ?? DEFAULT_PAGE_META.robots,
    noindex: map.noindex ? map.noindex === 'true' : DEFAULT_PAGE_META.noindex,
    keywords: map.keywords ?? DEFAULT_PAGE_META.keywords,
    slug: map.slug ?? DEFAULT_PAGE_META.slug,
    parent: map.parent ?? DEFAULT_PAGE_META.parent,
    sortOrder: map.sort_order ? parseInt(map.sort_order, 10) : DEFAULT_PAGE_META.sortOrder,
    lang: map.lang ?? DEFAULT_PAGE_META.lang,
    publishedAt: map.published_at ?? null,
    updatedAt: map.updated_at ?? null,
  };
}

/** Save all metadata fields for a page (upsert each). */
export async function upsertPageMeta(page: string, meta: Partial<PageMetaData>, userId?: string) {
  const fieldMap: Record<string, string | undefined | null> = {
    status: meta.status,
    meta_title: meta.metaTitle,
    meta_description: meta.metaDescription,
    og_title: meta.ogTitle,
    og_description: meta.ogDescription,
    og_image: meta.ogImage,
    canonical: meta.canonical,
    robots: meta.robots,
    noindex: meta.noindex !== undefined ? String(meta.noindex) : undefined,
    keywords: meta.keywords,
    slug: meta.slug,
    parent: meta.parent,
    sort_order: meta.sortOrder !== undefined ? String(meta.sortOrder) : undefined,
    lang: meta.lang,
    published_at: meta.publishedAt,
    updated_at: new Date().toISOString(),
  };
  for (const [field, content] of Object.entries(fieldMap)) {
    if (content === undefined || content === null) continue;
    await upsertPageContent({ page, section: '_meta', field, content: String(content), updatedBy: userId });
  }
}

/** Get section order (layout) for a page from `_layout.sections`. */
export async function getPageLayout(page: string): Promise<string[]> {
  const rows = await db.select({ content: pageContent.content }).from(pageContent)
    .where(and(
      eq(pageContent.page, page),
      eq(pageContent.section, '_layout'),
      eq(pageContent.field, 'sections'),
      eq(pageContent.lang, 'es-HN'),
    )).limit(1);
  if (rows.length === 0 || !rows[0].content) return [];
  try { return JSON.parse(rows[0].content) as string[]; }
  catch { return []; }
}

/** Save section order for a page. */
export async function upsertPageLayout(page: string, sections: string[]) {
  await upsertPageContent({ page, section: '_layout', field: 'sections', content: JSON.stringify(sections) });
}

/** Get visibility map for a page sections. */
export async function getPageVisibility(page: string): Promise<Record<string, boolean>> {
  const rows = await db.select().from(pageContent)
    .where(and(
      eq(pageContent.page, page),
      eq(pageContent.section, '_visibility'),
      eq(pageContent.lang, 'es-HN'),
    ));
  const map: Record<string, boolean> = {};
  for (const row of rows) {
    map[row.field] = row.content === 'visible';
  }
  return map;
}

/** Set a section's visibility. */
export async function setSectionVisibility(page: string, section: string, visible: boolean, userId?: string) {
  await upsertPageContent({
    page, section: '_visibility', field: section,
    content: visible ? 'visible' : 'hidden',
    updatedBy: userId,
  });
}

/** Delete an entire section (all its fields) from page_content. */
export async function deleteSection(page: string, section: string) {
  await db.delete(pageContent)
    .where(and(
      eq(pageContent.page, page),
      eq(pageContent.section, section),
      eq(pageContent.lang, 'es-HN'),
    ));
}

/** Duplicate a section's fields under a new section key. */
export async function duplicateSection(page: string, sourceSection: string, targetSection: string) {
  const rows = await db.select().from(pageContent)
    .where(and(
      eq(pageContent.page, page),
      eq(pageContent.section, sourceSection),
      eq(pageContent.lang, 'es-HN'),
    ));
  for (const row of rows) {
    await upsertPageContent({
      page, section: targetSection, field: row.field,
      content: row.content,
    });
  }
}

/** Get the publication status for a page. */
export async function getPageStatus(page: string): Promise<'published' | 'draft' | 'inactive'> {
  const meta = await getPageMeta(page);
  return meta.status;
}

/** Set the publication status and optionally the published_at date. */
export async function setPageStatus(page: string, status: 'published' | 'draft' | 'inactive', userId?: string) {
  const updates: Record<string, string> = { status, updated_at: new Date().toISOString() };
  if (status === 'published') {
    updates.published_at = new Date().toISOString();
  }
  for (const [field, content] of Object.entries(updates)) {
    await upsertPageContent({ page, section: '_meta', field, content, updatedBy: userId });
  }
}

/** Get all pages with their status/metadata for the list view. */
export type PageListItem = {
  page: string;
  label: string;
  status: 'published' | 'draft' | 'inactive';
  sections: number;
  fields: number;
  updatedAt: string | null;
  publishedAt: string | null;
  hasSeo: boolean;
};

export const getAllPagesMeta = cache(async (): Promise<PageListItem[]> => {
  const pagesMeta = await getEditablePagesMeta();
  const stats = await getPagesList();
  const statMap = new Map(stats.map(s => [s.page, s]));

  const items: PageListItem[] = [];

  for (const pm of pagesMeta) {
    if (pm.page === 'configuracion') continue;
    const s = statMap.get(pm.page);
    let status: PageListItem['status'] = 'draft';
    let publishedAt: string | null = null;
    let hasSeo = false;

    try {
      const meta = await getPageMeta(pm.page);
      status = meta.status;
      publishedAt = meta.publishedAt;
      hasSeo = !!(meta.metaTitle || meta.metaDescription || meta.ogImage);
    } catch {}

    items.push({
      page: pm.page,
      label: pm.label,
      status,
      sections: pm.sections.length,
      fields: pm.sections.reduce((acc, s) => acc + s.fields.length, 0),
      updatedAt: s?.updatedAt ?? null,
      publishedAt,
      hasSeo,
    });
  }

  return items;
});

export const getEditablePagesMeta = cache(async (): Promise<PageDef[]> => {
  return [
    {
      page: 'home', label: 'Inicio (/)',
      sections: [
        {
          key: 'hero', label: 'Hero', fields: [
            { key: 'badge', label: 'Badge', type: 'text', default: 'Atención directa en Nacaome' },
            { key: 'title_line1', label: 'Título línea 1', type: 'text', default: 'Defensa penal y asesoría jurídica en Nacaome y Honduras' },
            { key: 'title_line2', label: 'Título línea 2', type: 'text', default: '' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Si un familiar está detenido, le citaron a audiencia o necesita orientar un asunto de familia, laboral o civil, hable con abogados de Pineda y Asociados. Defensa penal y asesoría jurídica en Nacaome, Valle y el sur de Honduras: le explicamos qué procede, qué no, y cuánto cuesta, por escrito.' },
            { key: 'check1', label: 'Check 1', type: 'text', default: 'Evaluación inicial confidencial' },
            { key: 'check2', label: 'Check 2', type: 'text', default: 'Atención directa de abogados en Nacaome' },
          ],
        },
        {
          key: 'contact_card', label: 'Tarjeta de contacto', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Contacto directo' },
            { key: 'whatsapp_msg', label: 'Mensaje WhatsApp', type: 'text', default: 'Hola, necesito una consulta jurídica.' },
            { key: 'form_text', label: 'Texto formulario', type: 'text', default: 'Formulario confidencial' },
            { key: 'form_hint', label: 'Hint formulario', type: 'text', default: 'Le respondemos en horario hábil' },
          ],
        },
        {
          key: 'questions', label: 'Preguntas rápidas', fields: [
            { key: 'eyebrow', label: 'Título de sección', type: 'text', default: '¿Tiene un problema legal y no sabe cómo actuar?' },
            { key: 'title', label: 'Título', type: 'text', default: 'Las preguntas que nos hacen a diario' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Respondemos con honestidad, sin importar el área del derecho. Si su pregunta no aparece aquí, escríbanos.' },
            { key: 'q1', label: 'Pregunta 1', type: 'text', default: '¿Me pueden detener sin orden judicial?' },
            { key: 'q1_badge', label: 'Badge 1', type: 'text', default: 'Penal' },
            { key: 'q2', label: 'Pregunta 2', type: 'text', default: '¿Cuánto me corresponde si me despiden sin justa causa?' },
            { key: 'q2_badge', label: 'Badge 2', type: 'text', default: 'Laboral' },
            { key: 'q3', label: 'Pregunta 3', type: 'text', default: '¿Cómo tramito mi divorcio en Honduras?' },
            { key: 'q3_badge', label: 'Badge 3', type: 'text', default: 'Familia' },
            { key: 'q4', label: 'Pregunta 4', type: 'text', default: '¿Me puede embargar el banco si no pago?' },
            { key: 'q4_badge', label: 'Badge 4', type: 'text', default: 'Bancario' },
            { key: 'q5', label: 'Pregunta 5', type: 'text', default: '¿Necesito licencia ambiental para mi negocio?' },
            { key: 'q5_badge', label: 'Badge 5', type: 'text', default: 'Ambiental' },
            { key: 'q6', label: 'Pregunta 6', type: 'text', default: '¿Cuánto tarda el registro de una marca?' },
            { key: 'q6_badge', label: 'Badge 6', type: 'text', default: 'Propiedad Intelectual' },
          ],
        },
        {
          key: 'specialties', label: 'Especialidades principales', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Cuatro áreas con presencia constante' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Penal, familia, laboral y civil: las consultas que más llegan al despacho. En cada una hay un abogado responsable, no un intermediario.' },
          ],
        },
        {
          key: 'services', label: 'Servicios jurídicos', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Nuestros Servicios Jurídicos' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Del derecho penal a la conciliación y arbitraje. Todas las ramas jurídicas que su caso pueda requerir bajo una misma dirección letrada.' },
          ],
        },
        {
          key: 'testimonials', label: 'Testimonios', fields: [
            { key: 'title', label: 'Título', type: 'text', default: '' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: '' },
            // Testimonios desactivados por política 2026-08-03: solo se pueden
            // publicar reseñas reales autorizadas (Plan Maestro §17.3). Los
            // defaults quedan VACÍOS para impedir la activación accidental de
            // contenido ficticio. No publicar hasta aportar datos reales.
            { key: 'testimonial1_name', label: 'Testimonio 1 — nombre', type: 'text', default: '' },
            { key: 'testimonial1_body', label: 'Testimonio 1 — texto', type: 'textarea', default: '' },
            { key: 'testimonial2_name', label: 'Testimonio 2 — nombre', type: 'text', default: '' },
            { key: 'testimonial2_body', label: 'Testimonio 2 — texto', type: 'textarea', default: '' },
            { key: 'testimonial3_name', label: 'Testimonio 3 — nombre', type: 'text', default: '' },
            { key: 'testimonial3_body', label: 'Testimonio 3 — texto', type: 'textarea', default: '' },
          ],
        },
        {
          key: 'process', label: 'Cómo trabajamos', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Cinco pasos, sin importar el área' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Primero le escuchamos. Después le decimos, con honestidad, qué se puede hacer y qué no. El presupuesto llega por escrito, antes de actuar.' },
            { key: 'step1_title', label: 'Paso 1 — título', type: 'text', default: 'Evaluación inicial' },
            { key: 'step1_desc', label: 'Paso 1 — descripción', type: 'textarea', default: 'Conversación confidencial. Nos cuenta lo que ocurrió; nosotros le decimos si hay margen legal y qué urgencia tiene.' },
            { key: 'step2_title', label: 'Paso 2 — título', type: 'text', default: 'Diagnóstico jurídico' },
            { key: 'step2_desc', label: 'Paso 2 — descripción', type: 'textarea', default: 'Revisamos documentos, plazos y riesgos. Le explicamos las opciones reales, no un escenario idealizado.' },
            { key: 'step3_title', label: 'Paso 3 — título', type: 'text', default: 'Propuesta por escrito' },
            { key: 'step3_desc', label: 'Paso 3 — descripción', type: 'textarea', default: 'Alcance, honorarios y actuaciones, por escrito, antes de iniciar. Usted decide con información clara.' },
            { key: 'step4_title', label: 'Paso 4 — título', type: 'text', default: 'Gestión y seguimiento' },
            { key: 'step4_desc', label: 'Paso 4 — descripción', type: 'textarea', default: 'El abogado responsable lleva el expediente y le informa en cada etapa, sin intermediarios.' },
            { key: 'step5_title', label: 'Paso 5 — título', type: 'text', default: 'Cierre' },
            { key: 'step5_desc', label: 'Paso 5 — descripción', type: 'textarea', default: 'Le entregamos un resumen de lo actuado y de los pasos posteriores, si los hay.' },
          ],
        },
        {
          key: 'why_us', label: 'Por qué elegirnos', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Por qué las familias del sur nos buscan' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'No vendemos milagros. Ofrecemos un abogado responsable, sede en Nacaome y más de 15 años de ejercicio en los juzgados de Valle y Choluteca.' },
            { key: 'reason1_title', label: 'Razón 1 — título', type: 'text', default: 'Estamos en Nacaome, no de visita' },
            { key: 'reason1_desc', label: 'Razón 1 — descripción', type: 'textarea', default: 'Sede física en Nacaome. Atendemos con regularidad en Valle, San Lorenzo, Choluteca y municipios vecinos. Conocemos la práctica local, no solo la ley en abstracto.' },
            { key: 'reason2_title', label: 'Razón 2 — título', type: 'text', default: 'Le decimos la verdad del caso' },
            { key: 'reason2_desc', label: 'Razón 2 — descripción', type: 'textarea', default: 'Si el asunto es débil, se lo decimos. Si hay margen, se lo explicamos. Nunca prometemos el resultado de un juez.' },
            { key: 'reason3_title', label: 'Razón 3 — título', type: 'text', default: 'Defensa penal desde el primer minuto' },
            { key: 'reason3_desc', label: 'Razón 3 — descripción', type: 'textarea', default: 'Detenciones, audiencias iniciales, medidas cautelares, juicio y recursos. La defensa temprana suele ser la que más protege.' },
            { key: 'reason4_title', label: 'Razón 4 — título', type: 'text', default: 'Habla con el abogado, no con un filtro' },
            { key: 'reason4_desc', label: 'Razón 4 — descripción', type: 'textarea', default: 'Danilo, Thania o Emil toman el asunto. Usted sabe quién lleva su expediente y cómo contactarlo.' },
            { key: 'reason5_title', label: 'Razón 5 — título', type: 'text', default: 'Presupuesto por escrito, antes de actuar' },
            { key: 'reason5_desc', label: 'Razón 5 — descripción', type: 'textarea', default: 'Honorarios, alcance y siguientes pasos, documentados. La evaluación inicial es confidencial; contratar es una decisión suya.' },
          ],
        },
        {
          key: 'multidisciplinary', label: 'Visión multidisciplinar', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Visión integral' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Un mismo problema jurídico puede tocar varias ramas del derecho a la vez.' },
            { key: 'description', label: 'Descripción', type: 'textarea', default: 'Atender su asunto con un equipo multidisciplinar evita que tenga que contratar abogados distintos para cada frente. Coordinamos estrategia, plazos y piezas procesales desde un solo bufete, con comunicación directa y un expediente unificado.' },
            { key: 'combo1_title', label: 'Combinación 1 — título', type: 'text', default: 'Penal + familia + civil' },
            { key: 'combo1_desc', label: 'Combinación 1 — descripción', type: 'textarea', default: 'Una acusación penal con hijos, bienes y familia de por medio exige coordinación inmediata entre las áreas.' },
            { key: 'combo2_title', label: 'Combinación 2 — título', type: 'text', default: 'Laboral + mercantil' },
            { key: 'combo2_desc', label: 'Combinación 2 — descripción', type: 'textarea', default: 'Despidos en empresas con contratos mercantiles requieren análisis simultáneo del derecho del trabajo y el societario.' },
            { key: 'combo3_title', label: 'Combinación 3 — título', type: 'text', default: 'Civil + tributario + bancario' },
            { key: 'combo3_desc', label: 'Combinación 3 — descripción', type: 'textarea', default: 'Embargos, cobros judiciales, contratos y obligaciones tributarias. Una defensa conjunta es más rápida y más barata.' },
            { key: 'combo4_title', label: 'Combinación 4 — título', type: 'text', default: 'Notarial + registral' },
            { key: 'combo4_desc', label: 'Combinación 4 — descripción', type: 'textarea', default: 'Compras, donaciones, sociedades y traspasos requieren acompañamiento notarial y registral. Lo resolvemos internamente.' },
          ],
        },
        {
          key: 'faq', label: 'Preguntas frecuentes', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Respuestas a sus dudas' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Las preguntas que más recibimos. Si tiene una diferente, escríbanos.' },
            { key: 'q1', label: 'Pregunta 1', type: 'text', default: '¿Atienden casos urgentes fuera del horario?' },
            { key: 'a1', label: 'Respuesta 1', type: 'richtext', default: 'Atendemos de lunes a sábado de 7:00 a 20:00. Para emergencias con persona detenida, contáctenos por WhatsApp y le orientaremos de inmediato durante el horario de atención.' },
            { key: 'q2', label: 'Pregunta 2', type: 'text', default: '¿Qué documentos necesito para la primera consulta?' },
            { key: 'a2', label: 'Respuesta 2', type: 'richtext', default: 'Identificación oficial, documentos relacionados con su caso (contratos, notificaciones, actas) y cualquier prueba que considere relevante. Nosotros le orientaremos sobre lo que hace falta.' },
            { key: 'q3', label: 'Pregunta 3', type: 'text', default: '¿Qué debo hacer si recibo una citación judicial?' },
            { key: 'a3', label: 'Respuesta 3', type: 'richtext', default: 'No la ignore. Contacte a un abogado de inmediato. Una citación tiene plazos que corren y, si no se atiende, puede generar sanciones o perjudicar su defensa.' },
            { key: 'q4', label: 'Pregunta 4', type: 'text', default: '¿Ofrecen asesoría preventiva para empresas?' },
            { key: 'a4', label: 'Respuesta 4', type: 'richtext', default: 'Sí. Asesoramos en cumplimiento normativo, contratos, gobierno corporativo y prevención de contingencias antes de que surja el conflicto.' },
            { key: 'q5', label: 'Pregunta 5', type: 'text', default: '¿Pueden llevar mi caso penal y mi caso laboral a la vez?' },
            { key: 'a5', label: 'Respuesta 5', type: 'richtext', default: 'Sí. Esa coordinación es una de las ventajas de un bufete multidisciplinar. Analizamos su situación global para evitar conflictos entre frentes.' },
            { key: 'q6', label: 'Pregunta 6', type: 'text', default: '¿Qué pasa si mi problema involucra varias áreas del derecho?' },
            { key: 'a6', label: 'Respuesta 6', type: 'richtext', default: 'Convocamos al especialista de cada área implicada, definimos una estrategia común y unificamos el expediente. Usted recibe una sola línea de comunicación.' },
          ],
        },
      ],
    },
    {
      page: 'despacho', label: 'El Despacho (/despacho)',
      sections: [
        {
          key: 'hero', label: 'Hero', fields: [
            { key: 'eyebrow', label: 'Eyebrow', type: 'text', default: 'El Despacho' },
            { key: 'badge', label: 'Badge', type: 'text', default: 'Multidisciplinar' },
            { key: 'title', label: 'Título', type: 'text', default: 'Bufete jurídico en Nacaome, Valle' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Bufete de abogados colegiados en Honduras. Trabajamos con rigor metodológico, confidencialidad y comunicación clara, y aplicamos procesos documentados a cada asunto.' },
          ],
        },
        {
          key: 'mision_vision', label: 'Misión y Visión', fields: [
            { key: 'mision_title', label: 'Título misión', type: 'text', default: 'Defender con técnica, servir con humanidad' },
            { key: 'mision_desc', label: 'Texto misión', type: 'textarea', default: 'Garantizar que toda persona acceda a una defensa y orientación jurídica seria, técnica y respetuosa de sus derechos.' },
            { key: 'vision_title', label: 'Título visión', type: 'text', default: 'Justicia accesible y técnica' },
            { key: 'vision_desc', label: 'Texto visión', type: 'textarea', default: 'Un sistema de justicia donde cada persona pueda ejercer su derecho a la defensa con un equipo que domine la técnica y actúe con prudencia.' },
          ],
        },
        {
          key: 'values', label: 'Valores', fields: [
            { key: 'section_title', label: 'Título de sección', type: 'text', default: 'Lo que nos define como bufete' },
            { key: 'value1_title', label: 'Valor 1 — título', type: 'text', default: 'Defensa técnica, no promesas' },
            { key: 'value1_desc', label: 'Valor 1 — descripción', type: 'textarea', default: 'Aplicamos el Código Penal con rigor metodológico. Nunca prometemos resultados: le decimos lo que procede y lo que no.' },
            { key: 'value2_title', label: 'Valor 2 — título', type: 'text', default: 'Estudio permanente' },
            { key: 'value2_desc', label: 'Valor 2 — descripción', type: 'textarea', default: 'Nos actualizamos en jurisprudencia, reformas y doctrina. El derecho cambia, y nuestra práctica también.' },
            { key: 'value3_title', label: 'Valor 3 — título', type: 'text', default: 'Trato humano' },
            { key: 'value3_desc', label: 'Valor 3 — descripción', type: 'textarea', default: 'Detrás de cada caso hay una persona y una familia. Le escuchamos, le informamos y le acompañamos con respeto.' },
            { key: 'value4_title', label: 'Valor 4 — título', type: 'text', default: 'Tecnología al servicio del caso' },
            { key: 'value4_desc', label: 'Valor 4 — descripción', type: 'textarea', default: 'Motor de cálculo de penas, gestión documental, trazabilidad. Le entregamos cada actuación con fecha y firma.' },
          ],
        },
        {
          key: 'commitments', label: 'Compromisos', fields: [
            { key: 'label', label: 'Etiqueta', type: 'text', default: 'Nuestros compromisos' },
            { key: 'c1', label: 'Compromiso 1', type: 'text', default: 'Evaluación inicial confidencial' },
            { key: 'c2', label: 'Compromiso 2', type: 'text', default: 'Explicación clara de cada etapa procesal' },
            { key: 'c3', label: 'Compromiso 3', type: 'text', default: 'Honestidad sobre las expectativas reales del caso' },
            { key: 'c4', label: 'Compromiso 4', type: 'text', default: 'Presupuesto de honorarios por escrito' },
            { key: 'c5', label: 'Compromiso 5', type: 'text', default: 'Atención directa del abogado responsable' },
            { key: 'c6', label: 'Compromiso 6', type: 'text', default: 'Trazabilidad documental de cada actuación' },
            { key: 'c7', label: 'Compromiso 7', type: 'text', default: 'Coordinación interna entre áreas' },
            { key: 'c8', label: 'Compromiso 8', type: 'text', default: 'Información actualizada sobre normativa y reformas' },
          ],
        },
      ],
    },
    {
      page: 'solicitar-consulta', label: 'Solicitar Consulta (/solicitar-consulta)',
      sections: [
        {
          key: 'hero', label: 'Hero', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Cuéntenos su caso. Le escuchamos con discreción.' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Complete el formulario o contáctenos directamente. Toda comunicación es estrictamente confidencial.' },
          ],
        },
        {
          key: 'reasons', label: 'Motivos frecuentes', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Motivos frecuentes' },
            { key: 'r1', label: 'Motivo 1', type: 'text', default: 'Familiar detenido' },
            { key: 'r2', label: 'Motivo 2', type: 'text', default: 'Citaciones o audiencias próximas' },
            { key: 'r3', label: 'Motivo 3', type: 'text', default: 'Investigación en curso' },
            { key: 'r4', label: 'Motivo 4', type: 'text', default: 'Querella o denuncia' },
            { key: 'r5', label: 'Motivo 5', type: 'text', default: 'Recurso o apelación' },
            { key: 'r6', label: 'Motivo 6', type: 'text', default: 'Asesoría preventiva' },
          ],
        },
        {
          key: 'guarantees', label: 'Garantías', fields: [
            { key: 'g1_title', label: 'Garantía 1 — título', type: 'text', default: 'Secreto profesional' },
            { key: 'g1_desc', label: 'Garantía 1 — descripción', type: 'textarea', default: 'Su información está protegida por el secreto profesional.' },
            { key: 'g2_title', label: 'Garantía 2 — título', type: 'text', default: 'Evaluación inicial confidencial' },
            { key: 'g2_desc', label: 'Garantía 2 — descripción', type: 'textarea', default: 'La evaluación inicial le permite conocer las opciones y los siguientes pasos sin obligarle a contratar nuestros servicios.' },
            { key: 'g3_title', label: 'Garantía 3 — título', type: 'text', default: 'Respuesta en horario hábil' },
            { key: 'g3_desc', label: 'Garantía 3 — descripción', type: 'textarea', default: 'Le respondemos el mismo día hábil por el canal que prefiera.' },
          ],
        },
      ],
    },
    {
      page: 'como-llegar', label: 'Cómo llegar (/como-llegar)',
      sections: [
        {
          key: 'hero', label: 'Hero', fields: [
            { key: 'title', label: 'Título', type: 'text', default: 'Visítenos en Nacaome, Valle' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'GGJ7+239 · Cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. ANDARA.' },
          ],
        },
        {
          key: 'ref_points', label: 'Puntos de referencia', fields: [
            { key: 'section_title', label: 'Título de sección', type: 'text', default: 'Cómo encontrarnos fácilmente' },
            { key: 'ref1_name', label: 'Referencia 1 — nombre', type: 'text', default: 'Hondutel Nacaome' },
            { key: 'ref1_desc', label: 'Referencia 1 — descripción', type: 'text', default: 'Punto de referencia principal. Estamos una cuadra y media al este.' },
            { key: 'ref2_name', label: 'Referencia 2 — nombre', type: 'text', default: 'Clínica Dental Dra. ANDARA' },
            { key: 'ref2_desc', label: 'Referencia 2 — descripción', type: 'text', default: 'Nuestra oficina queda contigua a esta clínica dental.' },
            { key: 'ref3_name', label: 'Referencia 3 — nombre', type: 'text', default: 'Parque Central de Nacaome' },
            { key: 'ref3_desc', label: 'Referencia 3 — descripción', type: 'text', default: 'Camine al este por el boulevard principal (~3 min caminando).' },
            { key: 'ref4_name', label: 'Referencia 4 — nombre', type: 'text', default: 'Alcaldía Municipal de Nacaome' },
            { key: 'ref4_desc', label: 'Referencia 4 — descripción', type: 'text', default: 'Desde la alcaldía, tome dirección este sobre la calle principal (~5 min en vehículo).' },
          ],
        },
        {
          key: 'routes', label: 'Rutas desde ciudades', fields: [
            { key: 'section_title', label: 'Título de sección', type: 'text', default: 'Rutas y tiempos aproximados' },
            { key: 'city1_name', label: 'Ciudad 1 — nombre', type: 'text', default: 'Tegucigalpa' },
            { key: 'city1_desc', label: 'Ciudad 1 — descripción', type: 'text', default: '~90 km · 1 h 45 min · Carretera CA-5 sur → desvío a Nacaome' },
            { key: 'city2_name', label: 'Ciudad 2 — nombre', type: 'text', default: 'Choluteca' },
            { key: 'city2_desc', label: 'Ciudad 2 — descripción', type: 'text', default: '~65 km · 1 h 10 min · Carretera Panamericana CA-1 oeste' },
            { key: 'city3_name', label: 'Ciudad 3 — nombre', type: 'text', default: 'San Lorenzo' },
            { key: 'city3_desc', label: 'Ciudad 3 — descripción', type: 'text', default: '~30 km · 40 min · Carretera CA-1 hacia Nacaome' },
            { key: 'city4_name', label: 'Ciudad 4 — nombre', type: 'text', default: 'Amapala' },
            { key: 'city4_desc', label: 'Ciudad 4 — descripción', type: 'text', default: '~50 km · 1 h 20 min · Vía Goascorán → Nacaome' },
          ],
        },
      ],
    },
    {
      page: 'terminos', label: 'Términos y Condiciones (/terminos)',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text', default: 'Términos y Condiciones' },
          { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Reglas que rigen el acceso y la utilización de la calculadora de penas y de los demás servicios publicados en este sitio web.' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext', default: 'Documento legal de términos y condiciones de uso del sitio web y servicios.' },
          { key: 'version', label: 'Versión', type: 'text', default: '0.2' },
          { key: 'last_updated', label: 'Última actualización', type: 'text', default: 'Junio 2026' },
        ]},
      ],
    },
    {
      page: 'aviso-legal', label: 'Aviso Legal (/aviso-legal)',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text', default: 'Aviso Legal' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext', default: 'Documento legal de aviso del sitio web.' },
          { key: 'version', label: 'Versión', type: 'text', default: '0.1' },
          { key: 'last_updated', label: 'Última actualización', type: 'text', default: 'Junio 2026' },
        ]},
      ],
    },
    {
      page: 'politica-privacidad', label: 'Política de Privacidad (/politica-privacidad)',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text', default: 'Política de Privacidad' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext', default: 'Documento legal de política de privacidad del sitio web.' },
          { key: 'version', label: 'Versión', type: 'text', default: '0.2' },
          { key: 'last_updated', label: 'Última actualización', type: 'text', default: 'Junio 2026' },
        ]},
      ],
    },
    {
      page: 'politica-cookies', label: 'Política de Cookies (/politica-cookies)',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text', default: 'Política de Cookies' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext', default: 'Documento legal de política de cookies del sitio web.' },
          { key: 'version', label: 'Versión', type: 'text', default: '0.1' },
          { key: 'last_updated', label: 'Última actualización', type: 'text', default: 'Junio 2026' },
        ]},
      ],
    },
    {
      page: 'disclaimer', label: 'Disclaimer (/disclaimer)',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text', default: 'Disclaimer' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext', default: 'Documento legal de exención de responsabilidad.' },
          { key: 'version', label: 'Versión', type: 'text', default: '0.1' },
          { key: 'last_updated', label: 'Última actualización', type: 'text', default: 'Junio 2026' },
        ]},
      ],
    },
    {
      page: 'servicios-juridicos', label: 'Servicios Jurídicos (/servicios-juridicos)',
      sections: [
        {
          key: 'hero', label: 'Hero', fields: [
            { key: 'eyebrow', label: 'Eyebrow', type: 'text', default: 'Servicios Jurídicos' },
            { key: 'badge', label: 'Badge', type: 'text', default: 'Catálogo de áreas' },
            { key: 'title', label: 'Título', type: 'text', default: 'Servicios Jurídicos en Nacaome, Valle — Ramas principales del derecho' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Desde Nacaome, Valle, prestamos atención en las áreas publicadas en este catálogo. La defensa penal es el pilar histórico del bufete y cada consulta se asigna según su materia y circunstancias.' },
          ],
        },
        {
          key: 'content', label: 'Contenido', fields: [
            { key: 'section_title', label: 'Título de sección', type: 'text', default: 'Cobertura legal completa en la zona sur de Honduras' },
            { key: 'section_subtitle', label: 'Subtítulo de sección', type: 'textarea', default: 'Seleccione el área que necesita y acceda a información detallada sobre nuestros servicios, subservicios y preguntas frecuentes.' },
          ],
        },
      ],
    },
    {
      page: 'derecho-penal', label: 'Derecho Penal (/derecho-penal)',
      sections: [
        {
          key: 'hero', label: 'Hero', fields: [
            { key: 'eyebrow', label: 'Eyebrow', type: 'text', default: 'Área principal' },
            { key: 'badge', label: 'Badge', type: 'text', default: 'Especialidad destacada' },
            { key: 'title', label: 'Título', type: 'text', default: 'Abogados Penalistas en Nacaome, Valle — Defensa Penal Técnica' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Atendemos casos penales en la zona sur de Honduras, desde nuestro despacho en Nacaome, Valle. Cubrimos San Lorenzo, Choluteca y municipios aledaños. Trabajamos desde la primera actuación procesal hasta la ejecución penal, beneficios de ley, recursos de casación y cumplimiento de penas.' },
          ],
        },
        {
          key: 'content', label: 'Contenido', fields: [
            { key: 'section_title', label: 'Título de sección', type: 'text', default: 'Defensa penal especializada en la zona sur de Honduras' },
            { key: 'section_subtitle', label: 'Subtítulo', type: 'textarea', default: 'Grupos especializados que cubren todas las etapas del proceso penal hondureño, desde la asistencia a detenidos hasta los recursos de casación.' },
          ],
        },
      ],
    },
    {
      page: 'hondurenos-en-espana', label: 'Hondureños en España (/hondurenos-en-espana)',
      sections: [
        {
          key: 'hero', label: 'Hero', fields: [
            { key: 'eyebrow', label: 'Eyebrow', type: 'text', default: 'Asistencia transnacional' },
            { key: 'badge', label: 'Badge', type: 'text', default: 'Asistencia transnacional' },
            { key: 'title', label: 'Título', type: 'text', default: 'Hondureños en España: asistencia legal integral' },
            { key: 'subtitle', label: 'Subtítulo', type: 'textarea', default: 'Ponemos a su disposición nuestra solvencia legal y técnica para gestionar de forma remota todos sus asuntos jurídicos en territorio hondureño.' },
          ],
        },
        {
          key: 'content', label: 'Contenido', fields: [
            { key: 'section_title', label: 'Título de sección', type: 'text', default: 'Asistencia legal para hondureños en España' },
            { key: 'section_subtitle', label: 'Subtítulo', type: 'textarea', default: 'Gestión documental, actos notariales internacionales, divorcios, custodias y sucesiones entre Honduras y España.' },
          ],
        },
      ],
    },
    {
      page: 'configuracion', label: 'Configuración Global',
      sections: [
        { key: 'contacto', label: 'Contacto', fields: [
          { key: 'telefono', label: 'Teléfono', type: 'text' },
          { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
        ]},
        { key: 'direccion', label: 'Dirección', fields: [
          { key: 'direccion_line1', label: 'Línea 1', type: 'text' },
          { key: 'direccion_line2', label: 'Línea 2', type: 'text' },
          { key: 'ciudad', label: 'Ciudad', type: 'text' },
          { key: 'departamento', label: 'Departamento', type: 'text' },
          { key: 'horario', label: 'Horario', type: 'text' },
        ]},
        { key: 'redes', label: 'Redes Sociales', fields: [
          { key: 'facebook', label: 'Facebook URL', type: 'text' },
          { key: 'instagram', label: 'Instagram URL', type: 'text' },
          { key: 'tiktok', label: 'TikTok URL', type: 'text' },
        ]},
        { key: 'geo', label: 'Geolocalización', fields: [
          { key: 'geo_lat', label: 'Latitud', type: 'text' },
          { key: 'geo_lng', label: 'Longitud', type: 'text' },
        ]},
        { key: 'seo', label: 'SEO Global', fields: [
          { key: 'seo_title', label: 'Meta title global', type: 'text' },
          { key: 'seo_description', label: 'Meta description global', type: 'textarea' },
          { key: 'seo_keywords', label: 'Keywords (separadas por coma)', type: 'text' },
          { key: 'seo_og_image', label: 'OG Image URL', type: 'text' },
          { key: 'seo_google_verification', label: 'Google Verification', type: 'text' },
          { key: 'seo_noindex', label: 'Noindex global (true/false)', type: 'text' },
          { key: 'seo_sitemap_auto', label: 'Sitemap auto-submit (true/false)', type: 'text' },
        ]},
      ],
    },
  ];
});
