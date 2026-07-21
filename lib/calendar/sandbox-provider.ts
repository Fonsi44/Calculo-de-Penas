/**
 * SandboxCalendarProvider — P2-10 (Fase 4B-4).
 *
 * Implementación en memoria del CalendarProvider para desarrollo y pruebas.
 * No requiere credenciales externas. Los datos no persisten entre reinicios.
 */
import { createHash } from 'crypto';
import type {
  CalendarProvider,
  CreateExternalEventInput,
  UpdateExternalEventInput,
  DeleteExternalEventInput,
  DeleteExternalEventResult,
  GetExternalEventInput,
  ListExternalChangesInput,
  ExternalEventResult,
  ExternalEventSnapshot,
  ExternalChangePage,
} from './provider';

interface StoredEvent {
  externalEventId: string;
  iCalUid: string;
  etag: string;
  titulo: string;
  descripcion?: string;
  inicio: string;
  fin?: string;
  todoElDia: boolean;
  zonaHoraria: string;
  ubicacion?: string;
  estado: string;
  lastModifiedAt: string;
  internalEventId: string;
  version: number;
}

export class SandboxCalendarProvider implements CalendarProvider {
  readonly providerId = 'sandbox';

  private store = new Map<string, StoredEvent>();
  private etagCounter = 1;

  private buildUid(internalEventId: string): string {
    const hash = createHash('sha256').update(internalEventId).digest('hex').slice(0, 32);
    return `${hash}@sandbox.sgie.local`;
  }

  private nextEtag(): string {
    return String(this.etagCounter++);
  }

  private toSnapshot(event: StoredEvent): ExternalEventSnapshot {
    return {
      externalEventId: event.externalEventId,
      iCalUid: event.iCalUid,
      etag: event.etag,
      titulo: event.titulo,
      descripcion: event.descripcion,
      inicio: event.inicio,
      fin: event.fin,
      todoElDia: event.todoElDia,
      zonaHoraria: event.zonaHoraria,
      estado: event.estado,
      lastModifiedAt: event.lastModifiedAt,
    };
  }

  async createEvent(input: CreateExternalEventInput): Promise<ExternalEventResult> {
    for (const [, evt] of this.store) {
      if (evt.internalEventId === input.internalEventId && evt.version === 1) {
        return {
          externalEventId: evt.externalEventId,
          iCalUid: evt.iCalUid,
          etag: evt.etag,
          estado: evt.estado,
        };
      }
    }

    const externalEventId = `sbx-evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const iCalUid = this.buildUid(input.internalEventId);
    const etag = this.nextEtag();
    const now = new Date().toISOString();
    const stored: StoredEvent = {
      externalEventId,
      iCalUid,
      etag,
      titulo: input.titulo,
      descripcion: input.descripcion,
      inicio: input.inicio.toISOString(),
      fin: input.fin?.toISOString(),
      todoElDia: input.todoElDia,
      zonaHoraria: input.zonaHoraria,
      ubicacion: input.ubicacion,
      estado: 'created',
      lastModifiedAt: now,
      internalEventId: input.internalEventId,
      version: 1,
    };
    this.store.set(externalEventId, stored);
    return { externalEventId, iCalUid, etag, estado: stored.estado };
  }

  async updateEvent(input: UpdateExternalEventInput): Promise<ExternalEventResult> {
    const existing = this.store.get(input.externalEventId);
    if (!existing) {
      throw new Error(`Evento no encontrado: ${input.externalEventId}`);
    }
    if (input.etag && input.etag !== existing.etag) {
      throw new Error(`Conflicto de versión: etag esperado ${input.etag}, actual ${existing.etag}`);
    }

    const etag = this.nextEtag();
    const now = new Date().toISOString();
    const updated: StoredEvent = {
      ...existing,
      titulo: input.titulo,
      descripcion: input.descripcion,
      inicio: input.inicio.toISOString(),
      fin: input.fin?.toISOString(),
      todoElDia: input.todoElDia,
      zonaHoraria: input.zonaHoraria,
      ubicacion: input.ubicacion,
      etag,
      version: existing.version + 1,
      lastModifiedAt: now,
      estado: 'updated',
    };
    this.store.set(input.externalEventId, updated);
    return {
      externalEventId: updated.externalEventId,
      iCalUid: updated.iCalUid,
      etag: updated.etag,
      estado: updated.estado,
    };
  }

  async deleteEvent(input: DeleteExternalEventInput): Promise<DeleteExternalEventResult> {
    const existing = this.store.get(input.externalEventId);
    if (!existing) {
      return { ok: true, deletedAt: new Date().toISOString() };
    }
    this.store.delete(input.externalEventId);
    return { ok: true, deletedAt: new Date().toISOString() };
  }

  async getEvent(input: GetExternalEventInput): Promise<ExternalEventSnapshot> {
    const existing = this.store.get(input.externalEventId);
    if (!existing) {
      throw new Error(`Evento no encontrado: ${input.externalEventId}`);
    }
    return this.toSnapshot(existing);
  }

  async listChanges(input: ListExternalChangesInput): Promise<ExternalChangePage> {
    const limit = input.limit ?? 50;
    let items = Array.from(this.store.values());
    if (input.cursor) {
      const cursorTs = Number(input.cursor);
      if (!Number.isNaN(cursorTs)) {
        items = items.filter((e) => new Date(e.lastModifiedAt).getTime() > cursorTs);
      }
    }
    items.sort((a, b) => new Date(a.lastModifiedAt).getTime() - new Date(b.lastModifiedAt).getTime());
    const page = items.slice(0, limit);
    const hasMore = items.length > limit;
    const nextCursor = hasMore && page.length > 0
      ? String(new Date(page[page.length - 1].lastModifiedAt).getTime())
      : undefined;

    return {
      items: page.map((e) => this.toSnapshot(e)),
      nextCursor,
      hasMore,
    };
  }
}
