/**
 * CalendarProvider — abstracción desacoplada para P2-10.
 *
 * Permite sincronizar eventos del SGIE con calendarios externos.
 * Cada adaptador implementa esta interfaz.
 */
export interface CreateExternalEventInput {
  titulo: string;
  descripcion?: string;
  inicio: Date;
  fin?: Date;
  todoElDia: boolean;
  zonaHoraria: string;
  ubicacion?: string;
  internalEventId: string;
  idempotencyKey: string;
}

export interface ExternalEventResult {
  externalEventId: string;
  iCalUid: string;
  etag: string;
  estado: string;
}

export interface UpdateExternalEventInput extends CreateExternalEventInput {
  externalEventId: string;
  etag?: string;
}

export interface DeleteExternalEventInput {
  externalEventId: string;
  idempotencyKey: string;
}

export interface DeleteExternalEventResult {
  ok: boolean;
  deletedAt: string;
}

export interface GetExternalEventInput {
  externalEventId: string;
}

export interface ExternalEventSnapshot {
  externalEventId: string;
  iCalUid: string;
  etag: string;
  titulo: string;
  descripcion?: string;
  inicio: string;
  fin?: string;
  todoElDia: boolean;
  zonaHoraria: string;
  estado: string;
  lastModifiedAt: string;
}

export interface ListExternalChangesInput {
  calendarId?: string;
  cursor?: string;
  limit?: number;
}

export interface ExternalChangePage {
  items: ExternalEventSnapshot[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CalendarProvider {
  readonly providerId: string;

  createEvent(input: CreateExternalEventInput): Promise<ExternalEventResult>;
  updateEvent(input: UpdateExternalEventInput): Promise<ExternalEventResult>;
  deleteEvent(input: DeleteExternalEventInput): Promise<DeleteExternalEventResult>;
  getEvent(input: GetExternalEventInput): Promise<ExternalEventSnapshot>;
  listChanges(input: ListExternalChangesInput): Promise<ExternalChangePage>;
}
