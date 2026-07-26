import { db } from '@/lib/db';
import { documentContradictionCandidates, type DocumentContradictionCandidateInsert } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function createContradictionCandidate(input: {
  expedienteId?: string; organizationId?: string;
  sourceDocumentoId?: string; sourcePage?: number; sourceExcerpt?: string;
  relatedDocumentoId?: string; relatedPage?: number; relatedExcerpt?: string;
  description: string; confidence?: number;
  comparisonId?: string;
}): Promise<string> {
  const insert: DocumentContradictionCandidateInsert = {
    expedienteId: input.expedienteId, organizationId: input.organizationId,
    sourceDocumentoId: input.sourceDocumentoId, sourcePage: input.sourcePage, sourceExcerpt: input.sourceExcerpt,
    relatedDocumentoId: input.relatedDocumentoId, relatedPage: input.relatedPage, relatedExcerpt: input.relatedExcerpt,
    classification: 'possible_contradiction', description: input.description,
    confidence: input.confidence ?? 70, comparisonId: input.comparisonId,
  };
  const [candidate] = await db.insert(documentContradictionCandidates).values(insert).returning();
  return candidate.id;
}

export async function reviewContradiction(
  id: string, decision: string, reviewedBy: string, motivo?: string,
) {
  await db.update(documentContradictionCandidates).set({
    reviewStatus: 'reviewed', reviewDecision: decision,
    reviewedBy, reviewedAt: new Date(), reviewMotivo: motivo,
    actualizadoEn: new Date(),
  }).where(eq(documentContradictionCandidates.id, id));
}

export async function listContradictions(expedienteId?: string, status?: string) {
  const conditions = [];
  if (expedienteId) conditions.push(eq(documentContradictionCandidates.expedienteId, expedienteId));
  if (status) conditions.push(eq(documentContradictionCandidates.reviewStatus, status));
  return db.select().from(documentContradictionCandidates)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(documentContradictionCandidates.creadoEn));
}

export async function getContradiction(id: string) {
  const rows = await db.select().from(documentContradictionCandidates).where(eq(documentContradictionCandidates.id, id)).limit(1);
  return rows[0] ?? null;
}
