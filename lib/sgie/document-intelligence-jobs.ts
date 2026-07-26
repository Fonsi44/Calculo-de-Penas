import { encolarEvento, OUTBOX_EVENTS, completarEvento } from '@/lib/sgie/outbox';
import { runDocumentSegmentation } from '@/lib/sgie/document-segmentation-service';
import { compareDocuments } from '@/lib/sgie/document-comparison-service';

function ik(prefix: string, id: string): string { return `5b:${prefix}:${id}:v1`; }

export async function requestSegmentation(documentoId: string, expedienteId: string) {
  await encolarEvento({
    tipo: OUTBOX_EVENTS.DOCUMENT_SEGMENTATION_REQUESTED,
    aggregateType: 'documento', aggregateId: documentoId,
    payload: { documentoId, expedienteId },
    idempotencyKey: ik('seg', documentoId),
  });
}

export async function requestComparison(sourceDocId: string, targetDocId: string) {
  await encolarEvento({
    tipo: OUTBOX_EVENTS.DOCUMENT_COMPARISON_REQUESTED,
    aggregateType: 'documento', aggregateId: sourceDocId,
    payload: { sourceDocId, targetDocId },
    idempotencyKey: ik('comp', `${sourceDocId}_${targetDocId}`),
  });
}

export async function processSegmentationJob(event: { id: string; payload: Record<string, unknown> }) {
  await runDocumentSegmentation(event.payload.documentoId as string, event.payload.expedienteId as string);
  await completarEvento(event.id);
}

export async function processComparisonJob(event: { id: string; payload: Record<string, unknown> }) {
  await compareDocuments(event.payload.sourceDocId as string, event.payload.targetDocId as string);
  await completarEvento(event.id);
}
