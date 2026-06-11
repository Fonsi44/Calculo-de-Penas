import { db } from '@/lib/db';
import { faqEntries } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

export async function getPublishedFaqs() {
  return db.select().from(faqEntries)
    .where(eq(faqEntries.published, true))
    .orderBy(asc(faqEntries.sortOrder), asc(faqEntries.creadoEn));
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

export async function getFaqCategories() {
  const rows = await db.selectDistinct({ category: faqEntries.category })
    .from(faqEntries)
    .where(eq(faqEntries.published, true))
    .orderBy(faqEntries.category);
  return rows.map(r => r.category);
}
