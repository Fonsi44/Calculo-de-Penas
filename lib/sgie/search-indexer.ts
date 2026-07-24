/**
 * SearchIndexer — Fase 4B-5. Indexación incremental idempotente.
 * Conectado a outbox + jobs para mantener sgie_search_entries actualizado.
 */
import { db } from '@/lib/db';
import { sgieSearchEntries, documentTextPages, documentosExpediente } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { createHash } from 'crypto';
function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export async function indexDocumentPages(documentId: string): Promise<{ indexed: number; skipped: number }> {
  const [doc] = await db.select({
    id: documentosExpediente.id, expedienteId: documentosExpediente.expedienteId,
    nombreOriginal: documentosExpediente.nombreOriginal, tipoDocumento: documentosExpediente.tipoDocumento,
    version: documentosExpediente.version, estado: documentosExpediente.estado,
    aprobadoPor: documentosExpediente.aprobadoPor,
  }).from(documentosExpediente).where(eq(documentosExpediente.id, documentId)).limit(1);
  if (!doc) return { indexed: 0, skipped: 0 };

  const approved = doc.estado === 'aprobado' || doc.aprobadoPor !== null;
  const pages = await db.select().from(documentTextPages).where(eq(documentTextPages.documentoId, documentId));

  let indexed = 0;
  let skipped = 0;

  for (const page of pages) {
    if (!page.text?.trim()) { skipped++; continue; }
    const contentHash = sha256(page.text);
    const title = `${doc.nombreOriginal} — pág. ${page.pageNumber}`;

    const [existing] = await db.select({ contentHash: sgieSearchEntries.contentHash })
      .from(sgieSearchEntries)
      .where(and(
        eq(sgieSearchEntries.resourceType, 'document_page'),
        eq(sgieSearchEntries.resourceId, documentId),
        eq(sgieSearchEntries.documentVersionId, doc.version),
        eq(sgieSearchEntries.pageNumber, page.pageNumber),
        isNull(sgieSearchEntries.deletedAt),
      )).limit(1);

    if (existing?.contentHash === contentHash) { skipped++; continue; }

    await db.insert(sgieSearchEntries).values({
      resourceType: 'document_page',
      resourceId: documentId,
      expedienteId: doc.expedienteId,
      documentId,
      documentVersionId: doc.version,
      pageNumber: page.pageNumber,
      title,
      normalizedTitle: title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      content: page.text,
      contentHash,
      sourceVersion: doc.version,
      approvalStatus: approved ? 'approved' : 'pending',
      sensitivity: 'internal',
      indexedAt: new Date(),
    }).onConflictDoUpdate({
      target: [sgieSearchEntries.resourceType, sgieSearchEntries.resourceId, sgieSearchEntries.documentVersionId, sgieSearchEntries.pageNumber],
      set: { content: page.text, contentHash, title, normalizedTitle: title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), sourceVersion: doc.version, indexedAt: new Date() },
      setWhere: isNull(sgieSearchEntries.deletedAt),
    });
    indexed++;
  }

  return { indexed, skipped };
}

export async function removeDocumentFromIndex(documentId: string): Promise<{ removed: number }> {
  const result = await db.update(sgieSearchEntries)
    .set({ deletedAt: new Date() })
    .where(and(eq(sgieSearchEntries.resourceId, documentId), isNull(sgieSearchEntries.deletedAt)));
  return { removed: result.rowCount || 0 };
}

export async function reconcileSearchIndex(): Promise<{ reconciled: number; removed: number; errors: number }> {
  let reconciled = 0;
  let removed = 0;
  let errors = 0;

  // Find orphaned entries (document deleted but entry not tombstoned)
  const orphaned = await db.select({ id: sgieSearchEntries.id, resourceId: sgieSearchEntries.resourceId })
    .from(sgieSearchEntries)
    .leftJoin(documentosExpediente, eq(documentosExpediente.id, sgieSearchEntries.resourceId))
    .where(and(isNull(sgieSearchEntries.deletedAt), isNull(documentosExpediente.id)))
    .limit(50);

  for (const o of orphaned) {
    try {
      await db.update(sgieSearchEntries).set({ deletedAt: new Date() }).where(eq(sgieSearchEntries.id, o.id));
      removed++;
    } catch { errors++; }
  }

  // Find stale entries (hash mismatch)
  const entries = await db.select({
    id: sgieSearchEntries.id, documentId: sgieSearchEntries.documentId,
    contentHash: sgieSearchEntries.contentHash, pageNumber: sgieSearchEntries.pageNumber,
  }).from(sgieSearchEntries)
    .where(and(isNull(sgieSearchEntries.deletedAt), eq(sgieSearchEntries.resourceType, 'document_page')))
    .limit(50);

  for (const e of entries) {
    try {
      const page = await db.select({ text: documentTextPages.text })
        .from(documentTextPages)
        .where(and(eq(documentTextPages.documentoId, e.documentId!), eq(documentTextPages.pageNumber, e.pageNumber!)))
        .limit(1);
      if (page[0] && sha256(page[0].text || '') !== e.contentHash) {
        await db.update(sgieSearchEntries)
          .set({ content: page[0].text, contentHash: sha256(page[0].text || ''), indexedAt: new Date() })
          .where(eq(sgieSearchEntries.id, e.id));
        reconciled++;
      }
    } catch { errors++; }
  }

  return { reconciled, removed, errors };
}
