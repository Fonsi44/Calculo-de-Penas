import { db } from '@/lib/db';
import { pageContent } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { cache } from 'react';

export type PageContentRow = typeof pageContent.$inferSelect;
export type PageContentInsert = typeof pageContent.$inferInsert;

export async function getPageContent(page: string): Promise<Record<string, string>> {
  const rows = await db.select().from(pageContent)
    .where(and(eq(pageContent.page, page), eq(pageContent.lang, 'es-HN')));
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[`${row.section}.${row.field}`] = row.content;
  }
  return map;
}

export async function getPageContentBySection(page: string, section: string): Promise<Record<string, string>> {
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

export const getEditablePagesMeta = cache(async (): Promise<{
  page: string;
  label: string;
  sections: { key: string; label: string; fields: { key: string; label: string; type: string }[] }[];
}[]> => {
  return [
    {
      page: 'home', label: 'Inicio',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título principal', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
          { key: 'check1', label: 'Check 1', type: 'text' },
          { key: 'check2', label: 'Check 2', type: 'text' },
        ]},
        { key: 'faq', label: 'Preguntas frecuentes', fields: [
          { key: 'q1', label: 'Pregunta 1', type: 'text' },
          { key: 'a1', label: 'Respuesta 1', type: 'richtext' },
          { key: 'q2', label: 'Pregunta 2', type: 'text' },
          { key: 'a2', label: 'Respuesta 2', type: 'richtext' },
          { key: 'q3', label: 'Pregunta 3', type: 'text' },
          { key: 'a3', label: 'Respuesta 3', type: 'richtext' },
        ]},
        { key: 'process', label: 'Cómo trabajamos', fields: [
          { key: 'step1_title', label: 'Paso 1 título', type: 'text' },
          { key: 'step1_desc', label: 'Paso 1 descripción', type: 'text' },
          { key: 'step2_title', label: 'Paso 2 título', type: 'text' },
          { key: 'step2_desc', label: 'Paso 2 descripción', type: 'text' },
          { key: 'step3_title', label: 'Paso 3 título', type: 'text' },
          { key: 'step3_desc', label: 'Paso 3 descripción', type: 'text' },
          { key: 'step4_title', label: 'Paso 4 título', type: 'text' },
          { key: 'step4_desc', label: 'Paso 4 descripción', type: 'text' },
        ]},
        { key: 'why', label: 'Por qué elegirnos', fields: [
          { key: 'reason1_title', label: 'Razón 1 título', type: 'text' },
          { key: 'reason1_desc', label: 'Razón 1 descripción', type: 'textarea' },
          { key: 'reason2_title', label: 'Razón 2 título', type: 'text' },
          { key: 'reason2_desc', label: 'Razón 2 descripción', type: 'textarea' },
          { key: 'reason3_title', label: 'Razón 3 título', type: 'text' },
          { key: 'reason3_desc', label: 'Razón 3 descripción', type: 'textarea' },
          { key: 'reason4_title', label: 'Razón 4 título', type: 'text' },
          { key: 'reason4_desc', label: 'Razón 4 descripción', type: 'textarea' },
          { key: 'reason5_title', label: 'Razón 5 título', type: 'text' },
          { key: 'reason5_desc', label: 'Razón 5 descripción', type: 'textarea' },
        ]},
      ],
    },
    {
      page: 'despacho', label: 'El Despacho',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
        ]},
        { key: 'values', label: 'Valores', fields: [
          { key: 'value1_title', label: 'Valor 1 título', type: 'text' },
          { key: 'value1_desc', label: 'Valor 1 descripción', type: 'textarea' },
          { key: 'value2_title', label: 'Valor 2 título', type: 'text' },
          { key: 'value2_desc', label: 'Valor 2 descripción', type: 'textarea' },
          { key: 'value3_title', label: 'Valor 3 título', type: 'text' },
          { key: 'value3_desc', label: 'Valor 3 descripción', type: 'textarea' },
          { key: 'value4_title', label: 'Valor 4 título', type: 'text' },
          { key: 'value4_desc', label: 'Valor 4 descripción', type: 'textarea' },
        ]},
        { key: 'mision', label: 'Misión y Visión', fields: [
          { key: 'mision_title', label: 'Título misión', type: 'text' },
          { key: 'mision_desc', label: 'Texto misión', type: 'textarea' },
          { key: 'vision_title', label: 'Título visión', type: 'text' },
          { key: 'vision_desc', label: 'Texto visión', type: 'textarea' },
        ]},
      ],
    },
    {
      page: 'solicitar-consulta', label: 'Solicitar Consulta',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
        ]},
        { key: 'reasons', label: 'Motivos frecuentes', fields: [
          { key: 'reason1', label: 'Motivo 1', type: 'text' },
          { key: 'reason2', label: 'Motivo 2', type: 'text' },
          { key: 'reason3', label: 'Motivo 3', type: 'text' },
          { key: 'reason4', label: 'Motivo 4', type: 'text' },
          { key: 'reason5', label: 'Motivo 5', type: 'text' },
          { key: 'reason6', label: 'Motivo 6', type: 'text' },
        ]},
        { key: 'guarantees', label: 'Garantías', fields: [
          { key: 'guarantee1_title', label: 'Garantía 1 título', type: 'text' },
          { key: 'guarantee1_desc', label: 'Garantía 1 descripción', type: 'textarea' },
          { key: 'guarantee2_title', label: 'Garantía 2 título', type: 'text' },
          { key: 'guarantee2_desc', label: 'Garantía 2 descripción', type: 'textarea' },
          { key: 'guarantee3_title', label: 'Garantía 3 título', type: 'text' },
          { key: 'guarantee3_desc', label: 'Garantía 3 descripción', type: 'textarea' },
        ]},
      ],
    },
    {
      page: 'como-llegar', label: 'Cómo llegar',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
        ]},
        { key: 'ref_points', label: 'Puntos de referencia', fields: [
          { key: 'ref1_name', label: 'Referencia 1 nombre', type: 'text' },
          { key: 'ref1_desc', label: 'Referencia 1 descripción', type: 'textarea' },
          { key: 'ref2_name', label: 'Referencia 2 nombre', type: 'text' },
          { key: 'ref2_desc', label: 'Referencia 2 descripción', type: 'textarea' },
          { key: 'ref3_name', label: 'Referencia 3 nombre', type: 'text' },
          { key: 'ref3_desc', label: 'Referencia 3 descripción', type: 'textarea' },
          { key: 'ref4_name', label: 'Referencia 4 nombre', type: 'text' },
          { key: 'ref4_desc', label: 'Referencia 4 descripción', type: 'textarea' },
        ]},
        { key: 'routes', label: 'Rutas desde ciudades', fields: [
          { key: 'city1_name', label: 'Ciudad 1 nombre', type: 'text' },
          { key: 'city1_desc', label: 'Ciudad 1 descripción', type: 'text' },
          { key: 'city2_name', label: 'Ciudad 2 nombre', type: 'text' },
          { key: 'city2_desc', label: 'Ciudad 2 descripción', type: 'text' },
          { key: 'city3_name', label: 'Ciudad 3 nombre', type: 'text' },
          { key: 'city3_desc', label: 'Ciudad 3 descripción', type: 'text' },
          { key: 'city4_name', label: 'Ciudad 4 nombre', type: 'text' },
          { key: 'city4_desc', label: 'Ciudad 4 descripción', type: 'text' },
        ]},
      ],
    },
    {
      page: 'terminos', label: 'Términos y Condiciones',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext' },
          { key: 'version', label: 'Versión', type: 'text' },
          { key: 'last_updated', label: 'Última actualización', type: 'text' },
        ]},
      ],
    },
    {
      page: 'aviso-legal', label: 'Aviso Legal',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext' },
          { key: 'version', label: 'Versión', type: 'text' },
          { key: 'last_updated', label: 'Última actualización', type: 'text' },
        ]},
      ],
    },
    {
      page: 'politica-privacidad', label: 'Política de Privacidad',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext' },
          { key: 'version', label: 'Versión', type: 'text' },
          { key: 'last_updated', label: 'Última actualización', type: 'text' },
        ]},
      ],
    },
    {
      page: 'politica-cookies', label: 'Política de Cookies',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext' },
          { key: 'version', label: 'Versión', type: 'text' },
          { key: 'last_updated', label: 'Última actualización', type: 'text' },
        ]},
      ],
    },
    {
      page: 'disclaimer', label: 'Disclaimer',
      sections: [
        { key: 'hero', label: 'Hero', fields: [
          { key: 'title', label: 'Título', type: 'text' },
        ]},
        { key: 'content', label: 'Contenido', fields: [
          { key: 'body', label: 'Cuerpo del documento', type: 'richtext' },
          { key: 'version', label: 'Versión', type: 'text' },
          { key: 'last_updated', label: 'Última actualización', type: 'text' },
        ]},
      ],
    },
  ];
});
