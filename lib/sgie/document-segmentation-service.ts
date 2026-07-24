import { db } from '@/lib/db';
import { documentTextPages, documentSegmentationRuns, documentSegments, type DocumentSegmentationRunInsert, type DocumentSegmentInsert } from '@/lib/schema';
import { sql, eq, desc, and } from 'drizzle-orm';

export type SegmentType = 'portada' | 'indice' | 'clausulado' | 'anexo' | 'firma' | 'anexo_firma' | 'otro';

const VALID_TYPES: SegmentType[] = ['portada', 'indice', 'clausulado', 'anexo', 'firma', 'anexo_firma', 'otro'];

export interface SegmentResult {
  startPage: number;
  endPage: number;
  suggestedType: SegmentType;
  suggestedTitle: string;
  signals: string[];
  citations: Array<{ page: number; excerpt: string }>;
  confidence: number;
  requiresHumanReview: boolean;
}

export interface SegmentationOutput {
  runId: string;
  documentId: string;
  segments: SegmentResult[];
  confidence: number;
  limitations: string[];
  requiresHumanReview: boolean;
}

function detectPage(pages: Array<{ pageNumber: number; text: string }>, index: number): { signals: string[]; segmentType: SegmentType } {
  const page = pages[index];
  if (!page) return { signals: [], segmentType: 'otro' };
  const text = page.text || '';
  const signals: string[] = [];
  let segmentType: SegmentType = 'otro';

  // Cover page detection
  if (index === 0 && text.length < 500) { signals.push('primera_pagina_corta'); segmentType = 'portada'; }
  // Table of contents
  if (/índice|indice|tabla de contenido|contenido/i.test(text) && text.split('\n').filter(l => /^\d/.test(l)).length > 3) { signals.push('tabla_contenido_detectada'); segmentType = 'indice'; }
  // Signature
  if (/firma|firmo|fdo\.?|signed|signature/i.test(text) && text.length < 300) { signals.push('firma_detectada'); segmentType = 'firma'; }
  // Annex
  if (/anexo|annex|apéndice|apendice|adjunto/i.test(text)) { signals.push('anexo_detectado'); segmentType = 'anexo'; }
  // Main body (clausulado)
  if (text.length > 300 && segmentType === 'otro') { signals.push('texto_extenso'); segmentType = 'clausulado'; }

  return { signals, segmentType };
}

export async function runDocumentSegmentation(
  documentoId: string,
  expedienteId: string,
  requestedBy?: string,
  correlationId?: string,
): Promise<SegmentationOutput> {
  const pages = await db
    .select({ pageNumber: documentTextPages.pageNumber, text: documentTextPages.text })
    .from(documentTextPages)
    .where(eq(documentTextPages.documentoId, documentoId))
    .orderBy(documentTextPages.pageNumber);

  const segments: SegmentResult[] = [];
  let currentStart = 1;
  let lastType: SegmentType = 'otro';

  for (let i = 0; i < pages.length; i++) {
    const { signals, segmentType } = detectPage(pages, i);
    if (segmentType !== lastType && i > 0) {
      segments.push({
        startPage: currentStart,
        endPage: i,
        suggestedType: lastType,
        suggestedTitle: lastType.charAt(0).toUpperCase() + lastType.slice(1),
        signals: [],
        citations: [],
        confidence: segmentType === 'portada' ? 90 : 70,
        requiresHumanReview: true,
      });
      currentStart = i + 1;
    }
    lastType = segmentType;
  }
  if (currentStart <= pages.length) {
    segments.push({
      startPage: currentStart,
      endPage: pages.length,
      suggestedType: lastType,
      suggestedTitle: lastType.charAt(0).toUpperCase() + lastType.slice(1),
      signals: [],
      citations: [],
      confidence: 70,
      requiresHumanReview: true,
    });
  }

  const runInsert: DocumentSegmentationRunInsert = {
    documentoId, expedienteId, status: 'completed',
    confidence: segments.length > 0 ? 70 : 0,
    correlationId, requestedBy,
    completedAt: new Date(),
  };
  const [run] = await db.insert(documentSegmentationRuns).values(runInsert).returning();
  const runId = run.id;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    await db.insert(documentSegments).values({
      runId, documentoId,
      startPage: seg.startPage, endPage: seg.endPage,
      suggestedType: seg.suggestedType, suggestedTitle: seg.suggestedTitle,
      confidence: seg.confidence, requiresHumanReview: true,
      segmentOrder: i + 1,
    });
  }

  return {
    runId, documentId: documentoId,
    segments,
    confidence: segments.length > 0 ? 70 : 0,
    limitations: segments.length === 0 ? ['No se detectaron segmentos'] : [],
    requiresHumanReview: true,
  };
}

export async function getSegmentationRun(runId: string) {
  const run = await db.select().from(documentSegmentationRuns).where(eq(documentSegmentationRuns.id, runId)).limit(1);
  if (!run[0]) return null;
  const segments = await db.select().from(documentSegments).where(eq(documentSegments.runId, runId)).orderBy(documentSegments.segmentOrder);
  return { run: run[0], segments };
}

export async function reviewSegment(
  segmentId: string,
  review: {
    decision: string; correctedStartPage?: number; correctedEndPage?: number;
    correctedType?: string; motivo?: string; reviewedBy: string;
  },
) {
  await db.update(documentSegments).set({
    reviewStatus: 'reviewed', reviewDecision: review.decision,
    correctedStartPage: review.correctedStartPage, correctedEndPage: review.correctedEndPage,
    correctedType: review.correctedType, reviewMotivo: review.motivo,
    reviewedBy: review.reviewedBy, reviewedAt: new Date(),
    actualizadoEn: new Date(),
  }).where(eq(documentSegments.id, segmentId));
}

export async function reviewAllSegments(
  runId: string, decision: string, reviewedBy: string,
) {
  await db.update(documentSegments).set({
    reviewStatus: 'reviewed', reviewDecision: decision,
    reviewedBy, reviewedAt: new Date(), actualizadoEn: new Date(),
  }).where(eq(documentSegments.runId, runId));
}
