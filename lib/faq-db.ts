import { cache } from 'react';
import { db } from '@/lib/db';
import { faqEntries } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { faqCategoriesMeta } from '@/data/faq-categories';
import { categoriasFaq } from '@/data/faq';

export type FaqQuestion = {
  pregunta: string;
  respuesta: string;
};

export type FaqCategoryPublic = {
  slug: string;
  titulo: string;
  descripcion: string;
  preguntas: FaqQuestion[];
};

const faqMetaMap = new Map(faqCategoriesMeta.map((c) => [c.slug, c]));

function isDbError(err: unknown): boolean {
  return err instanceof Error && (err.message?.includes('connect') || err.message?.includes('fetch failed') || err.message?.includes('ECONNREFUSED'));
}

export async function getPublishedFaqs() {
  try {
    return await db.select().from(faqEntries)
      .where(eq(faqEntries.published, true))
      .orderBy(asc(faqEntries.sortOrder), asc(faqEntries.creadoEn));
  } catch (err) {
    if (isDbError(err)) return [];
    throw err;
  }
}

export async function getFaqsGrouped() {
  const rows = await getPublishedFaqs();
  const grouped: Record<string, typeof rows> = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push(row);
  }
  return grouped;
}

export const getFaqsForPublicPage = cache(async (): Promise<FaqCategoryPublic[]> => {
  const rows = await getPublishedFaqs();

  if (rows.length === 0) {
    return categoriasFaq.map((cat) => ({
      slug: cat.slug,
      titulo: cat.titulo,
      descripcion: cat.descripcion,
      preguntas: cat.preguntas.map((p) => ({
        pregunta: p.pregunta,
        respuesta: p.respuesta,
      })),
    }));
  }

  const grouped: Record<string, FaqQuestion[]> = {};
  const categoryOrder: string[] = [];
  for (const row of rows) {
    if (!grouped[row.category]) {
      grouped[row.category] = [];
      categoryOrder.push(row.category);
    }
    grouped[row.category].push({
      pregunta: row.question,
      respuesta: row.answer,
    });
  }

  return categoryOrder.map((slug) => {
    const meta = faqMetaMap.get(slug);
    return {
      slug,
      titulo: meta?.titulo ?? slug,
      descripcion: meta?.descripcion ?? '',
      preguntas: grouped[slug] ?? [],
    };
  });
});

export async function getFaqCategories() {
  try {
    const rows = await db.selectDistinct({ category: faqEntries.category })
      .from(faqEntries)
      .where(eq(faqEntries.published, true))
      .orderBy(faqEntries.category);
    return rows.map(r => r.category);
  } catch (err) {
    if (isDbError(err)) return [];
    throw err;
  }
}
