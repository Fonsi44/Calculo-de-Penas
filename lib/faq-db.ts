import { cache } from 'react';
import { db } from '@/lib/db';
import { isUsableDatabaseUrl } from '@/lib/database-url';
import { faqEntries } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { faqCategoriesMeta } from '@/data/faq-categories';
import { categoriasFaq } from '@/data/faq';
import {
  publicFaqPlainText,
  sanitizePublicFaqHtml,
} from '@/lib/faq-public-sanitizer';

export type FaqQuestion = {
  pregunta: string;
  respuesta: string;
};

export type PublicFaqQuestion = FaqQuestion & {
  id: string;
  respuestaTexto: string;
};

export type FaqCategoryPublic = {
  slug: string;
  titulo: string;
  descripcion: string;
  preguntas: FaqQuestion[];
};

export type CorporateFaqCategoryPublic = Omit<FaqCategoryPublic, 'preguntas'> & {
  preguntas: PublicFaqQuestion[];
};

const faqMetaMap = new Map(faqCategoriesMeta.map((c) => [c.slug, c]));
const CORPORATE_CATEGORY = 'bufete-honorarios';
// Decisión 2026-08-03: formulación canónica NEUTRA (lib/marketing-policy.ts).
// El propietario no ha confirmado que todas las consultas sean gratuitas.
const EVALUATION_QUESTION: FaqQuestion = {
  pregunta: '¿Cómo funciona la evaluación inicial?',
  respuesta:
    'La evaluación inicial es confidencial. En ella se identifican el área aplicable, la documentación necesaria y los siguientes pasos. Cualquier servicio posterior se informa y presupuesta por escrito, y no se garantizan resultados.',
};

function stableFaqId(question: string, index: number): string {
  const normalized = question
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  return `faq-${normalized || index + 1}`;
}

export function preparePublicFaqQuestions(questions: FaqQuestion[]): PublicFaqQuestion[] {
  const seen = new Set<string>();
  return questions.flatMap((question, index) => {
    const pregunta = question.pregunta.trim();
    const respuesta = sanitizePublicFaqHtml(question.respuesta);
    const respuestaTexto = publicFaqPlainText(respuesta);
    const duplicateKey = pregunta.toLocaleLowerCase('es-HN');
    if (!pregunta || !respuestaTexto || seen.has(duplicateKey)) return [];
    seen.add(duplicateKey);
    return [{
      id: stableFaqId(pregunta, index),
      pregunta,
      respuesta,
      respuestaTexto,
    }];
  });
}

function isDbReachable(): boolean {
  return isUsableDatabaseUrl(process.env.DATABASE_URL);
}

export async function getPublishedFaqs() {
  if (!isDbReachable()) return [];
  try {
    return await db.select().from(faqEntries)
      .where(eq(faqEntries.published, true))
      .orderBy(asc(faqEntries.sortOrder), asc(faqEntries.creadoEn));
  } catch (err) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.error('[faq-db] getPublishedFaqs falló.', err);
      return [];
    }
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

export const getCorporateFaqsForPublicPage = cache(async (): Promise<CorporateFaqCategoryPublic[]> => {
  const categories = await getFaqsForPublicPage();
  const corporate = categories.find((category) => category.slug === CORPORATE_CATEGORY);
  if (!corporate) return [];

  const questions = [...corporate.preguntas];
  const hasEvaluationQuestion = questions.some(
    (question) => question.pregunta.trim().toLocaleLowerCase('es-HN')
      === EVALUATION_QUESTION.pregunta.toLocaleLowerCase('es-HN'),
  );
  if (!hasEvaluationQuestion) questions.unshift({
    ...EVALUATION_QUESTION,
  });

  return [{
    ...corporate,
    preguntas: preparePublicFaqQuestions(questions),
  }];
});

export async function getFaqCategories() {
  if (!isDbReachable()) return [];
  const rows = await db.selectDistinct({ category: faqEntries.category })
    .from(faqEntries)
    .where(eq(faqEntries.published, true))
    .orderBy(faqEntries.category);
  return rows.map(r => r.category);
}
