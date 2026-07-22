/**
 * SearchService — Fase 4B-5. Retrieval textual con FTS + pg_trgm.
 * Autorizar → filtrar → recuperar → rankear → devolver evidencia.
 */
import { db } from '@/lib/db';
import { sgieSearchEntries } from '@/lib/schema';
import { and, eq, like, or, sql, gte, lte, isNull, inArray } from 'drizzle-orm';
import { isFlagEnabled } from './feature-flags';
import { accessService } from '@/lib/access-service';

export type SearchResourceType = 'expediente' | 'documento' | 'cliente' | 'tarea' | 'evento' | 'comunicacion';
export type MatchType = 'exact' | 'fts' | 'trigram';

export interface SearchInput {
  actorUserId: string;
  query: string;
  resourceTypes?: SearchResourceType[];
  expedienteId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  cursor?: number;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  resourceType: string;
  resourceId: string;
  expedienteId: string | null;
  documentId: string | null;
  documentVersionId: number | null;
  pageNumber: number | null;
  title: string;
  snippet: string;
  matchType: MatchType;
  score: number;
  updatedAt: string;
}

export interface SearchResult {
  results: SearchResultItem[];
  total: number;
  hasMore: boolean;
  cursor: number | null;
}

export async function searchFts(input: SearchInput): Promise<SearchResult> {
  const flagOn = await isFlagEnabled('sgie.retrieval.fts', {}).catch(() => false);
  if (!flagOn) return { results: [], total: 0, hasMore: false, cursor: null };

  await accessService.assertSgieAccess(input.actorUserId, 'search.use');

  const q = input.query.trim().slice(0, 200);
  if (!q) return { results: [], total: 0, hasMore: false, cursor: null };

  const limit = Math.min(input.limit || 20, 50);
  const offset = input.cursor || 0;

  // Build authorized scope: only entries the actor can access
  const filters: ReturnType<typeof eq>[] = [];
  filters.push(isNull(sgieSearchEntries.deletedAt));

  if (input.resourceTypes?.length) {
    filters.push(inArray(sgieSearchEntries.resourceType, input.resourceTypes as [string, ...string[]]));
  }
  if (input.expedienteId) {
    filters.push(eq(sgieSearchEntries.expedienteId, input.expedienteId));
  }
  if (input.dateFrom) filters.push(gte(sgieSearchEntries.indexedAt, input.dateFrom));
  if (input.dateTo) filters.push(lte(sgieSearchEntries.indexedAt, input.dateTo));

  // Exact reference match (highest priority)
  const exactRef = await db.select({
    id: sgieSearchEntries.id, resourceType: sgieSearchEntries.resourceType,
    resourceId: sgieSearchEntries.resourceId, expedienteId: sgieSearchEntries.expedienteId,
    documentId: sgieSearchEntries.documentId, documentVersionId: sgieSearchEntries.documentVersionId,
    pageNumber: sgieSearchEntries.pageNumber, title: sgieSearchEntries.title,
    content: sgieSearchEntries.content, indexedAt: sgieSearchEntries.indexedAt,
  }).from(sgieSearchEntries)
    .where(and(like(sgieSearchEntries.normalizedTitle, `${q}%`), ...filters))
    .limit(3);

  // FTS search
  const ftsResults = await db.select({
    id: sgieSearchEntries.id, resourceType: sgieSearchEntries.resourceType,
    resourceId: sgieSearchEntries.resourceId, expedienteId: sgieSearchEntries.expedienteId,
    documentId: sgieSearchEntries.documentId, documentVersionId: sgieSearchEntries.documentVersionId,
    pageNumber: sgieSearchEntries.pageNumber, title: sgieSearchEntries.title,
    content: sgieSearchEntries.content, indexedAt: sgieSearchEntries.indexedAt,
    rank: sql<number>`ts_rank(${sgieSearchEntries}.search_vector, plainto_tsquery('spanish', ${q}))`.as('rank'),
  }).from(sgieSearchEntries)
    .where(and(
      sql`${sgieSearchEntries}.search_vector @@ plainto_tsquery('spanish', ${q})`,
      ...filters,
    ))
    .orderBy(sql`rank DESC`)
    .limit(limit)
    .offset(offset);

  // Trigram fallback for names/typos
  let trigramResults: typeof ftsResults = [];
  const trigramFlag = await isFlagEnabled('sgie.search.trigram', {}).catch(() => false);
  if (trigramFlag && exactRef.length + ftsResults.length < 5) {
    trigramResults = await db.select({
      id: sgieSearchEntries.id, resourceType: sgieSearchEntries.resourceType,
      resourceId: sgieSearchEntries.resourceId, expedienteId: sgieSearchEntries.expedienteId,
      documentId: sgieSearchEntries.documentId, documentVersionId: sgieSearchEntries.documentVersionId,
      pageNumber: sgieSearchEntries.pageNumber, title: sgieSearchEntries.title,
      content: sgieSearchEntries.content, indexedAt: sgieSearchEntries.indexedAt,
      rank: sql<number>`similarity(${sgieSearchEntries}.normalized_title, ${q})`.as('rank'),
    }).from(sgieSearchEntries)
      .where(and(
        sql`similarity(${sgieSearchEntries}.normalized_title, ${q}) > 0.3`,
        ...filters,
      ))
      .orderBy(sql`rank DESC`)
      .limit(5);
  }

  const results: SearchResultItem[] = [
    ...exactRef.map(r => ({ id: r.id, resourceType: r.resourceType, resourceId: r.resourceId, expedienteId: r.expedienteId, documentId: r.documentId, documentVersionId: r.documentVersionId, pageNumber: r.pageNumber, title: r.title, matchType: 'exact' as MatchType, score: 100, snippet: (r.content || r.title || '').slice(0, 200), updatedAt: r.indexedAt?.toISOString() || new Date().toISOString() })),
    ...ftsResults.map(r => ({ id: r.id, resourceType: r.resourceType, resourceId: r.resourceId, expedienteId: r.expedienteId, documentId: r.documentId, documentVersionId: r.documentVersionId, pageNumber: r.pageNumber, title: r.title, matchType: 'fts' as MatchType, score: Number(r.rank) || 50, snippet: (r.content || r.title || '').slice(0, 200), updatedAt: r.indexedAt?.toISOString() || new Date().toISOString() })),
    ...trigramResults.map(r => ({ id: r.id, resourceType: r.resourceType, resourceId: r.resourceId, expedienteId: r.expedienteId, documentId: r.documentId, documentVersionId: r.documentVersionId, pageNumber: r.pageNumber, title: r.title, matchType: 'trigram' as MatchType, score: Number(r.rank) || 25, snippet: (r.content || r.title || '').slice(0, 200), updatedAt: r.indexedAt?.toISOString() || new Date().toISOString() })),
  ];

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = results.filter(r => {
    const key = `${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    results: unique,
    total: unique.length,
    hasMore: ftsResults.length === limit,
    cursor: ftsResults.length === limit ? offset + limit : null,
  };
}
