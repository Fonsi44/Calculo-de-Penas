import { db } from '@/lib/db';
import { documentTextPages, documentComparisons, documentComparisonChanges, type DocumentComparisonInsert } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export interface DeterministicDiff {
  pagesAdded: number[];
  pagesRemoved: number[];
  pagesReordered: boolean;
  additions: Array<{ page: number; text: string }>;
  deletions: Array<{ page: number; text: string }>;
  modifications: Array<{ page: number; before: string; after: string }>;
}

export interface ComparisonOutput {
  comparisonId: string;
  summary: string;
  deterministicDiff: DeterministicDiff;
  materialChanges: Array<{ category: string; description: string; confidence: number; requiresHumanReview: boolean }>;
  contradictions: Array<Record<string, unknown>>;
  confidence: number;
  limitations: string[];
  requiresHumanReview: boolean;
}

export async function compareDocuments(
  sourceDocId: string,
  targetDocId: string,
  expedienteId?: string,
  organizationId?: string,
  correlationId?: string,
): Promise<ComparisonOutput> {
  const srcPages = await db.select({ pageNumber: documentTextPages.pageNumber, text: documentTextPages.text })
    .from(documentTextPages).where(eq(documentTextPages.documentoId, sourceDocId)).orderBy(documentTextPages.pageNumber);
  const tgtPages = await db.select({ pageNumber: documentTextPages.pageNumber, text: documentTextPages.text })
    .from(documentTextPages).where(eq(documentTextPages.documentoId, targetDocId)).orderBy(documentTextPages.pageNumber);

  const srcMap = new Map(srcPages.map(p => [p.pageNumber, p.text]));
  const tgtMap = new Map(tgtPages.map(p => [p.pageNumber, p.text]));
  const srcNums = [...srcMap.keys()].sort((a, b) => a - b);
  const tgtNums = [...tgtMap.keys()].sort((a, b) => a - b);

  const additions: Array<{ page: number; text: string }> = [];
  const deletions: Array<{ page: number; text: string }> = [];
  const modifications: Array<{ page: number; before: string; after: string }> = [];
  const pagesAdded: number[] = [];
  const pagesRemoved: number[] = [];

  for (const p of tgtNums) {
    if (!srcMap.has(p)) { pagesAdded.push(p); additions.push({ page: p, text: tgtMap.get(p) || '' }); }
  }
  for (const p of srcNums) {
    if (!tgtMap.has(p)) { pagesRemoved.push(p); deletions.push({ page: p, text: srcMap.get(p) || '' }); }
  }
  for (const p of srcNums) {
    if (tgtMap.has(p) && srcMap.get(p) !== tgtMap.get(p)) {
      modifications.push({ page: p, before: srcMap.get(p) || '', after: tgtMap.get(p) || '' });
    }
  }

  const pagesReordered = srcNums.length === tgtNums.length && srcNums.some((v, i) => v !== tgtNums[i]);

  const deterministicDiff: DeterministicDiff = { pagesAdded, pagesRemoved, pagesReordered, additions, deletions, modifications };

  // Persist comparison
  const compInsert: DocumentComparisonInsert = {
    sourceDocumentoId: sourceDocId, targetDocumentoId: targetDocId,
    expedienteId, organizationId, status: 'completed',
    summary: `${additions.length} páginas añadidas, ${deletions.length} eliminadas, ${modifications.length} modificadas`,
    confidence: 80, correlationId,
  };
  const [comp] = await db.insert(documentComparisons).values(compInsert).returning();

  // Persist changes
  for (const a of additions) {
    await db.insert(documentComparisonChanges).values({ comparisonId: comp.id, changeType: 'addition', pageSection: String(a.page), textAfter: a.text, confidence: 90 });
  }
  for (const d of deletions) {
    await db.insert(documentComparisonChanges).values({ comparisonId: comp.id, changeType: 'deletion', pageSection: String(d.page), textBefore: d.text, confidence: 90 });
  }
  for (const m of modifications) {
    await db.insert(documentComparisonChanges).values({ comparisonId: comp.id, changeType: 'modification', pageSection: String(m.page), textBefore: m.before, textAfter: m.after, confidence: 80, importance: 'medium' });
  }

  const materialChanges = modifications
    .filter(m => m.before.length > 0 && m.after.length > 0 && m.before !== m.after)
    .slice(0, 10)
    .map(m => ({ category: 'text_modification', description: `Página ${m.page} modificada`, confidence: 80, requiresHumanReview: true }));

  const summary = `${additions.length} páginas añadidas, ${deletions.length} eliminadas, ${modifications.length} modificadas`;
  return { comparisonId: comp.id, summary, deterministicDiff, materialChanges, contradictions: [], confidence: 80, limitations: [], requiresHumanReview: true };
}

export async function getComparison(comparisonId: string) {
  const comp = await db.select().from(documentComparisons).where(eq(documentComparisons.id, comparisonId)).limit(1);
  if (!comp[0]) return null;
  const changes = await db.select().from(documentComparisonChanges).where(eq(documentComparisonChanges.comparisonId, comparisonId));
  return { comparison: comp[0], changes };
}
