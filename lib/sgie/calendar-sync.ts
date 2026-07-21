/**
 * CalendarSyncService — P2-10 (Fase 4B-4).
 *
 * Orquestación de sincronización bidireccional entre el calendario interno
 * del SGIE y calendarios externos mediante proveedores desacoplados.
 *
 * Principios:
 * - feature-gated: require sgie.calendar.external.enabled.
 * - deny-by-default: sin flag no hay sincronización.
 * - optimistic locking: versión interna + etag externo para detección de conflictos.
 * - idempotencia: idempotencyKey para operaciones duplicables.
 * - outbox: eventos de calendario se encolan para despacho asíncrono.
 */
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { isFlagEnabled } from './feature-flags';
import { assertCapability } from '@/lib/access-service';
import { logSgie } from './auditoria-sgie';
import { encolarEvento } from './outbox';
import { SandboxCalendarProvider } from '@/lib/calendar/sandbox-provider';
import type { CalendarProvider } from '@/lib/calendar/provider';
import type { FlagContext } from './feature-flags';

const FLAG_KEY = 'sgie.calendar.external';

const PROVIDERS: Record<string, CalendarProvider> = {};

function isProductionEnv(): boolean {
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase();
  const appEnv = (process.env.APP_ENV || '').toLowerCase();
  return vercelEnv === 'production' || appEnv === 'production';
}

function getProvider(providerId: string): CalendarProvider {
  if (!PROVIDERS[providerId]) {
    if (providerId === 'sandbox') {
      if (isProductionEnv()) {
        throw new CalendarSyncError('FORBIDDEN', 'SandboxCalendarProvider bloqueado en producción', 403);
      }
      PROVIDERS[providerId] = new SandboxCalendarProvider();
    } else {
      throw new CalendarSyncError('INTERNAL', `Proveedor de calendario no configurado: ${providerId}`, 500);
    }
  }
  return PROVIDERS[providerId];
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type ConnectionEstado = 'activo' | 'desconectado' | 'error';
export type SyncDirection = 'export_only' | 'import_only' | 'bidirectional';
export type LinkSyncState = 'pending' | 'synced' | 'conflict' | 'error';
export type ConflictState = 'external_newer' | 'internal_newer' | 'both_modified' | 'deleted_external' | 'deleted_internal';
export type ConflictResolution = 'accept_external' | 'keep_internal' | 'ignore';

export interface CalendarConnectionInput {
  provider: string;
  externalAccountId?: string;
  externalCalendarId?: string;
  syncDirection?: SyncDirection;
  timezone?: string;
  privacyPolicy?: Record<string, unknown>;
}

export interface CalendarConnection {
  id: string;
  userId: string;
  provider: string;
  externalAccountId: string | null;
  externalCalendarId: string | null;
  estado: ConnectionEstado;
  syncDirection: SyncDirection;
  timezone: string;
  cursor: string | null;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  version: number;
}

export interface EventLink {
  id: string;
  internalEventId: string;
  connectionId: string;
  provider: string;
  externalEventId: string | null;
  iCalUid: string;
  externalEtag: string | null;
  internalVersion: number;
  lastSyncedInternalVersion: number | null;
  lastExternalModifiedAt: string | null;
  syncState: LinkSyncState;
  conflictState: ConflictState | null;
}

export interface SyncResult {
  linkId: string;
  internalEventId: string;
  externalEventId: string | null;
  syncState: LinkSyncState;
}

export type CalendarSyncErrorCode =
  | 'FORBIDDEN' | 'NOT_FOUND' | 'FLAG_OFF' | 'KILL_SWITCH'
  | 'VALIDATION' | 'CONFLICT' | 'STALE_VERSION'
  | 'PROVIDER_ERROR' | 'INTERNAL';

export class CalendarSyncError extends Error {
  constructor(
    public code: CalendarSyncErrorCode,
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = 'CalendarSyncError';
  }
}

// ─── SQL helpers ─────────────────────────────────────────────────────────────

const CALENDAR_CONNECTIONS_TABLE = 'calendar_connections';
const CALENDAR_EVENT_LINKS_TABLE = 'calendar_event_links';
const CALENDAR_SYNC_RUNS_TABLE = 'calendar_sync_runs';

// ─── 1. Generar conexión a calendario externo ───────────────────────────────

export async function generateCalendarConnection(
  input: CalendarConnectionInput,
  ctx: { actorId: string; organizationId?: string; flagContext?: FlagContext },
): Promise<CalendarConnection> {
  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new CalendarSyncError('FLAG_OFF', 'Sincronización de calendarios externos desactivada', 403);

  await assertCapability(ctx.actorId, 'calendar.external.connect');

  const connectionId = randomUUID();
  const now = new Date();

  const result = await db.execute(sql`
    INSERT INTO ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
      (id, organization_id, user_id, provider, external_account_id,
       external_calendar_id, estado, sync_direction, timezone,
       privacy_policy, version, creado_en, actualizado_en)
    VALUES
      (${connectionId}::uuid, ${ctx.organizationId ?? null}::uuid, ${ctx.actorId}::uuid,
       ${input.provider}, ${input.externalAccountId ?? null},
       ${input.externalCalendarId ?? null}, 'activo',
       ${input.syncDirection ?? 'bidirectional'}, ${input.timezone ?? 'America/Tegucigalpa'},
       ${JSON.stringify(input.privacyPolicy ?? {})}::jsonb,
       1, ${now}, ${now})
    ON CONFLICT (user_id, provider) DO UPDATE
      SET external_account_id = EXCLUDED.external_account_id,
          external_calendar_id = EXCLUDED.external_calendar_id,
          estado = 'activo',
          sync_direction = EXCLUDED.sync_direction,
          timezone = EXCLUDED.timezone,
          privacy_policy = EXCLUDED.privacy_policy,
          version = calendar_connections.version + 1,
          disconnected_at = NULL,
          actualizado_en = ${now}
    RETURNING *
  `);

  const row = (result.rows as Array<Record<string, unknown>>)[0];
  if (!row) throw new CalendarSyncError('INTERNAL', 'No se pudo crear la conexión', 500);

  await logSgie({
    usuarioId: ctx.actorId,
    accion: 'calendar_connection_created',
    recurso: 'calendar_connection',
    recursoId: row.id as string,
    metadata: { provider: input.provider, syncDirection: input.syncDirection },
    exito: true,
  });

  return {
    id: row.id as string,
    userId: row.user_id as string,
    provider: row.provider as string,
    externalAccountId: (row.external_account_id as string) ?? null,
    externalCalendarId: (row.external_calendar_id as string) ?? null,
    estado: row.estado as ConnectionEstado,
    syncDirection: row.sync_direction as SyncDirection,
    timezone: row.timezone as string,
    cursor: (row.cursor as string) ?? null,
    lastSyncAt: row.last_sync_at ? String(row.last_sync_at) : null,
    lastSuccessfulSyncAt: row.last_successful_sync_at ? String(row.last_successful_sync_at) : null,
    version: row.version as number,
  };
}

// ─── 2. Sincronizar evento al calendario externo ────────────────────────────

export async function syncEventToExternal(
  eventoId: string,
  ctx: { actorId: string; idempotencyKey: string; flagContext?: FlagContext },
): Promise<SyncResult> {
  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new CalendarSyncError('FLAG_OFF', 'Sincronización de calendarios externos desactivada', 403);

  // Obtener el evento interno
  const eventoRows = await db.execute(sql`
    SELECT * FROM "eventos_agenda" WHERE id = ${eventoId}::uuid LIMIT 1
  `);
  const evento = (eventoRows.rows as Array<Record<string, unknown>>)[0];
  if (!evento) throw new CalendarSyncError('NOT_FOUND', 'Evento no encontrado', 404);

  // Obtener la conexión activa del propietario del evento
  const userId = evento.propietario_id as string;
  const connRows = await db.execute(sql`
    SELECT * FROM ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
    WHERE user_id = ${userId}::uuid AND estado = 'activo'
    ORDER BY creado_en ASC LIMIT 1
  `);
  const connection = (connRows.rows as Array<Record<string, unknown>>)[0];
  if (!connection) throw new CalendarSyncError('NOT_FOUND', 'No hay conexión activa para este usuario', 404);

  // Verificar idempotencia
  const linkId = randomUUID();
  const connId = connection.id as string;
  const provider = connection.provider as string;

  const existingRows = await db.execute(sql`
    SELECT * FROM ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
    WHERE internal_event_id = ${eventoId}::uuid AND connection_id = ${connId}::uuid
    LIMIT 1
  `);
  const existingLink = (existingRows.rows as Array<Record<string, unknown>>)[0];

  if (existingLink && (existingLink.sync_state as string) === 'synced') {
    return {
      linkId: existingLink.id as string,
      internalEventId: eventoId,
      externalEventId: (existingLink.external_event_id as string) ?? null,
      syncState: 'synced',
    };
  }

  // Invocar al proveedor para crear/actualizar externamente
  let iCalUid: string;
  let externalEventId: string | null = null;
  let externalEtag: string | null = null;

  try {
    const calProvider = getProvider(provider);

    if (existingLink && existingLink.external_event_id) {
      const updateResult = await calProvider.updateEvent({
        titulo: evento.titulo as string,
        descripcion: (evento.descripcion as string) ?? undefined,
        inicio: new Date(evento.inicio as string),
        fin: evento.fin ? new Date(evento.fin as string) : undefined,
        todoElDia: Boolean(evento.todo_el_dia),
        zonaHoraria: (evento.zona_horaria as string) || 'America/Tegucigalpa',
        internalEventId: eventoId,
        idempotencyKey: ctx.idempotencyKey,
        externalEventId: existingLink.external_event_id as string,
        etag: (existingLink.external_etag as string) ?? undefined,
      });
      externalEventId = updateResult.externalEventId;
      iCalUid = updateResult.iCalUid;
      externalEtag = updateResult.etag;
    } else {
      const createResult = await calProvider.createEvent({
        titulo: evento.titulo as string,
        descripcion: (evento.descripcion as string) ?? undefined,
        inicio: new Date(evento.inicio as string),
        fin: evento.fin ? new Date(evento.fin as string) : undefined,
        todoElDia: Boolean(evento.todo_el_dia),
        zonaHoraria: (evento.zona_horaria as string) || 'America/Tegucigalpa',
        internalEventId: eventoId,
        idempotencyKey: ctx.idempotencyKey,
      });
      externalEventId = createResult.externalEventId;
      iCalUid = createResult.iCalUid;
      externalEtag = createResult.etag;
    }

    // Persistir o actualizar el vínculo
    const now = new Date();
    const internalVersion = (evento.version as number) ?? 1;

    if (existingLink) {
      await db.execute(sql`
        UPDATE ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
        SET external_event_id = ${externalEventId},
            ical_uid = ${iCalUid},
            external_etag = ${externalEtag},
            internal_version = ${internalVersion},
            last_synced_internal_version = ${internalVersion},
            last_external_modified_at = ${now},
            sync_state = 'synced',
            conflict_state = NULL,
            actualizado_en = ${now}
        WHERE id = ${existingLink.id as string}::uuid
      `);
    } else {
      await db.execute(sql`
        INSERT INTO ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
          (id, internal_event_id, connection_id, provider, external_event_id,
           ical_uid, external_etag, internal_version, last_synced_internal_version,
           last_external_modified_at, sync_state, creado_en, actualizado_en)
        VALUES
          (${linkId}::uuid, ${eventoId}::uuid, ${connId}::uuid, ${provider},
           ${externalEventId}, ${iCalUid}, ${externalEtag},
           ${internalVersion}, ${internalVersion}, ${now},
           'synced', ${now}, ${now})
        ON CONFLICT (internal_event_id, connection_id) DO UPDATE
          SET external_event_id = EXCLUDED.external_event_id,
              ical_uid = EXCLUDED.ical_uid,
              external_etag = EXCLUDED.external_etag,
              internal_version = EXCLUDED.internal_version,
              last_synced_internal_version = EXCLUDED.last_synced_internal_version,
              last_external_modified_at = EXCLUDED.last_external_modified_at,
              sync_state = 'synced',
              conflict_state = NULL,
              actualizado_en = EXCLUDED.actualizado_en
      `);
    }

    // Actualizar cursor de la conexión
    await db.execute(sql`
      UPDATE ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
      SET last_sync_at = ${now},
          last_successful_sync_at = ${now},
          actualizado_en = ${now}
      WHERE id = ${connId}::uuid
    `);

    await logSgie({
      usuarioId: ctx.actorId,
      accion: 'calendar_event_synced',
      recurso: 'calendar_event_link',
      recursoId: existingLink ? (existingLink.id as string) : linkId,
      metadata: { internalEventId: eventoId, externalEventId, provider },
      exito: true,
    });

    await encolarEvento({
      tipo: 'calendar.event.synced',
      aggregateType: 'calendar_event',
      aggregateId: eventoId,
      payload: { internalEventId: eventoId, externalEventId, connectionId: connId, provider },
      correlationId: ctx.idempotencyKey,
    });

    return {
      linkId: existingLink ? (existingLink.id as string) : linkId,
      internalEventId: eventoId,
      externalEventId,
      syncState: 'synced',
    };
  } catch (err) {
    const now = new Date();
    if (existingLink) {
      await db.execute(sql`
        UPDATE ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
        SET sync_state = 'error', actualizado_en = ${now}
        WHERE id = ${existingLink.id as string}::uuid
      `);
    } else {
      await db.execute(sql`
        INSERT INTO ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
          (id, internal_event_id, connection_id, provider, external_event_id,
           ical_uid, external_etag, internal_version, sync_state, creado_en, actualizado_en)
        VALUES
          (${linkId}::uuid, ${eventoId}::uuid, ${connId}::uuid, ${provider},
           NULL, '', NULL, ${evento.version as number ?? 1},
           'error', ${now}, ${now})
        ON CONFLICT (internal_event_id, connection_id) DO UPDATE
          SET sync_state = 'error', actualizado_en = ${now}
      `);
    }

    await logSgie({
      usuarioId: ctx.actorId,
      accion: 'calendar_event_sync_failed',
      recurso: 'calendar_event_link',
      recursoId: existingLink ? (existingLink.id as string) : linkId,
      metadata: { internalEventId: eventoId, error: (err as Error).message, provider },
      exito: false,
      mensaje: (err as Error).message,
    });

    throw new CalendarSyncError('PROVIDER_ERROR', `Error del proveedor: ${(err as Error).message}`, 502);
  }
}

// ─── 3. Detectar cambios externos ───────────────────────────────────────────

export async function detectExternalChanges(
  connectionId: string,
): Promise<{ nuevos: number; modificados: number; eliminados: number; conflictos: number }> {
  const connRows = await db.execute(sql`
    SELECT * FROM ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
    WHERE id = ${connectionId}::uuid AND estado = 'activo' LIMIT 1
  `);
  const connection = (connRows.rows as Array<Record<string, unknown>>)[0];
  if (!connection) throw new CalendarSyncError('NOT_FOUND', 'Conexión no encontrada o inactiva', 404);

  const provider = connection.provider as string;
  const cursor = (connection.cursor as string) ?? undefined;

  const calProvider = getProvider(provider);
  const page = await calProvider.listChanges({
    calendarId: (connection.external_calendar_id as string) ?? undefined,
    cursor,
    limit: 100,
  });

  let nuevos = 0;
  let modificados = 0;
  let eliminados = 0;
  let conflictos = 0;

  const existingLinks = await db.execute(sql`
    SELECT * FROM ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
    WHERE connection_id = ${connectionId}::uuid
  `);
  const linkMap = new Map<string, { linkId: string; internalVersion: number }>();
  for (const link of existingLinks.rows as Array<Record<string, unknown>>) {
    if (link.external_event_id) {
      linkMap.set(link.external_event_id as string, {
        linkId: link.id as string,
        internalVersion: link.internal_version as number,
      });
    }
  }

  for (const item of page.items) {
    const existing = linkMap.get(item.externalEventId);
    if (!existing) {
      // Evento externo no vinculado: requiere vinculación manual o ignorar
      nuevos++;
      continue;
    }

    // Detectar cambios y conflictos
    const now = new Date();

    // Obtener versión interna actual
    const intRows = await db.execute(sql`
      SELECT version FROM "eventos_agenda" WHERE id = (
        SELECT internal_event_id FROM ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
        WHERE id = ${existing.linkId}::uuid
      ) LIMIT 1
    `);
    const currentInternalVersion = (intRows.rows as Array<Record<string, unknown>>)[0]?.version as number | undefined;

    if (currentInternalVersion && currentInternalVersion !== existing.internalVersion) {
      // Cambió tanto interna como externamente => conflicto
      await db.execute(sql`
        UPDATE ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
        SET sync_state = 'conflict',
            conflict_state = 'both_modified',
            last_external_modified_at = ${new Date(item.lastModifiedAt)},
            external_etag = ${item.etag},
            actualizado_en = ${now}
        WHERE id = ${existing.linkId}::uuid
      `);
      conflictos++;
    } else {
      // Solo cambió externamente => marcar para revisión
      await db.execute(sql`
        UPDATE ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
        SET sync_state = 'conflict',
            conflict_state = 'external_newer',
            last_external_modified_at = ${new Date(item.lastModifiedAt)},
            external_etag = ${item.etag},
            actualizado_en = ${now}
        WHERE id = ${existing.linkId}::uuid AND sync_state != 'conflict'
      `);
      modificados++;
    }

    linkMap.delete(item.externalEventId);
  }

  // Eventos que desaparecieron del calendario externo
  for (const [, remaining] of linkMap) {
    await db.execute(sql`
      UPDATE ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
      SET sync_state = 'conflict',
          conflict_state = 'deleted_external',
          actualizado_en = ${new Date()}
      WHERE id = ${remaining.linkId}::uuid AND sync_state = 'synced'
    `);
    eliminados++;
  }

  // Actualizar cursor para la próxima sincronización
  if (page.nextCursor) {
    await db.execute(sql`
      UPDATE ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
      SET cursor = ${page.nextCursor}, actualizado_en = ${new Date()}
      WHERE id = ${connectionId}::uuid
    `);
  }

  return { nuevos, modificados, eliminados, conflictos };
}

// ─── 4. Resolver conflicto ──────────────────────────────────────────────────

export async function resolveConflict(
  linkId: string,
  resolution: ConflictResolution,
  ctx: { actorId: string; flagContext?: FlagContext },
): Promise<SyncResult> {
  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new CalendarSyncError('FLAG_OFF', 'Sincronización de calendarios externos desactivada', 403);

  await assertCapability(ctx.actorId, 'calendar.external.connect');

  const linkRows = await db.execute(sql`
    SELECT * FROM ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
    WHERE id = ${linkId}::uuid AND sync_state = 'conflict'
    LIMIT 1
  `);
  const link = (linkRows.rows as Array<Record<string, unknown>>)[0];
  if (!link) throw new CalendarSyncError('NOT_FOUND', 'Vínculo no encontrado o sin conflicto activo', 404);

  const now = new Date();
  const internalEventId = link.internal_event_id as string;

  if (resolution === 'accept_external') {
    // Obtener el evento del proveedor externo y sobrescribir el interno
    const provider = link.provider as string;
    const externalEventId = link.external_event_id as string;
    if (!externalEventId) throw new CalendarSyncError('VALIDATION', 'No hay evento externo asociado', 422);

    const calProvider = getProvider(provider);
    const snapshot = await calProvider.getEvent({ externalEventId });

    await db.execute(sql`
      UPDATE "eventos_agenda"
      SET titulo = ${snapshot.titulo},
          descripcion = ${snapshot.descripcion ?? null},
          inicio = ${new Date(snapshot.inicio)}::timestamptz,
          fin = ${snapshot.fin ? `${new Date(snapshot.fin)}::timestamptz` : null},
          todo_el_dia = ${snapshot.todoElDia},
          zona_horaria = ${snapshot.zonaHoraria},
          estado = ${snapshot.estado},
          version = version + 1,
          actualizado_en = ${now}
      WHERE id = ${internalEventId}::uuid
    `);

    await db.execute(sql`
      UPDATE ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
      SET sync_state = 'synced',
          conflict_state = NULL,
          external_etag = ${snapshot.etag},
          actualizado_en = ${now}
      WHERE id = ${linkId}::uuid
    `);
  } else if (resolution === 'keep_internal') {
    // Re-sincronizar el interno al externo, sobrescribiendo cambios externos
    const eventRows = await db.execute(sql`
      SELECT * FROM "eventos_agenda" WHERE id = ${internalEventId}::uuid LIMIT 1
    `);
    const evento = (eventRows.rows as Array<Record<string, unknown>>)[0];
    if (!evento) throw new CalendarSyncError('NOT_FOUND', 'Evento interno no encontrado', 404);

    const provider = link.provider as string;
    const externalEventId = link.external_event_id as string;
    if (!externalEventId) throw new CalendarSyncError('VALIDATION', 'No hay evento externo asociado', 422);

    const calProvider = getProvider(provider);
    const updateResult = await calProvider.updateEvent({
      titulo: evento.titulo as string,
      descripcion: (evento.descripcion as string) ?? undefined,
      inicio: new Date(evento.inicio as string),
      fin: evento.fin ? new Date(evento.fin as string) : undefined,
      todoElDia: Boolean(evento.todo_el_dia),
      zonaHoraria: (evento.zona_horaria as string) || 'America/Tegucigalpa',
      internalEventId,
      idempotencyKey: `resolve-${linkId}-${Date.now()}`,
      externalEventId,
      etag: (link.external_etag as string) ?? undefined,
    });

    await db.execute(sql`
      UPDATE ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
      SET sync_state = 'synced',
          conflict_state = NULL,
          external_etag = ${updateResult.etag},
          internal_version = ${evento.version as number},
          last_synced_internal_version = ${evento.version as number},
          actualizado_en = ${now}
      WHERE id = ${linkId}::uuid
    `);
  } else {
    // 'ignore' — simplemente limpiar el estado de conflicto
    await db.execute(sql`
      UPDATE ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
      SET sync_state = 'synced',
          conflict_state = NULL,
          actualizado_en = ${now}
      WHERE id = ${linkId}::uuid
    `);
  }

  await logSgie({
    usuarioId: ctx.actorId,
    accion: 'calendar_conflict_resolved',
    recurso: 'calendar_event_link',
    recursoId: linkId,
    metadata: { resolution, internalEventId },
    exito: true,
  });

  return {
    linkId,
    internalEventId,
    externalEventId: link.external_event_id as string | null,
    syncState: 'synced',
  };
}

// ─── 5. Reconciliación periódica (cron job) ─────────────────────────────────

export async function reconcileConnections(): Promise<{
  procesadas: number;
  exitosas: number;
  fallidas: number;
}> {
  // Buscar conexiones que necesiten reconciliación:
  // - activas y sin sync hace más de 15 minutos, o
  // - con sync_runs pendientes
  const connRows = await db.execute(sql`
    SELECT * FROM ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
    WHERE estado = 'activo'
      AND (
        last_sync_at IS NULL
        OR last_sync_at < NOW() - INTERVAL '15 minutes'
      )
    ORDER BY last_sync_at ASC NULLS FIRST
    LIMIT 50
  `);

  let procesadas = 0;
  let exitosas = 0;
  let fallidas = 0;

  for (const conn of connRows.rows as Array<Record<string, unknown>>) {
    const connectionId = conn.id as string;
    const correlationId = randomUUID();

    // Claim sync run
    const syncRunId = randomUUID();
    try {
      await db.execute(sql`
        INSERT INTO ${sql.raw(CALENDAR_SYNC_RUNS_TABLE)}
          (id, connection_id, tipo, claimed_at, locked_until, attempts, next_attempt_at, correlation_id)
        VALUES
          (${syncRunId}::uuid, ${connectionId}::uuid, 'incremental',
           NOW(), NOW() + INTERVAL '10 minutes', 1,
           NOW() + INTERVAL '5 minutes', ${correlationId})
      `);

      procesadas++;

      const result = await detectExternalChanges(connectionId);
      const total = result.nuevos + result.modificados + result.eliminados + result.conflictos;

      await db.execute(sql`
        UPDATE ${sql.raw(CALENDAR_SYNC_RUNS_TABLE)}
        SET processed = ${total},
            locked_until = NULL,
            next_attempt_at = NULL
        WHERE id = ${syncRunId}::uuid
      `);

      await db.execute(sql`
        UPDATE ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
        SET last_sync_at = NOW(),
            last_successful_sync_at = NOW(),
            actualizado_en = NOW()
        WHERE id = ${connectionId}::uuid
      `);

      exitosas++;
    } catch (err) {
      fallidas++;
      const errorMsg = (err as Error).message;

      try {
        await db.execute(sql`
          UPDATE ${sql.raw(CALENDAR_SYNC_RUNS_TABLE)}
          SET locked_until = NULL,
              attempts = attempts + 1,
              next_attempt_at = NOW() + INTERVAL '2 minutes' * POWER(2, LEAST(attempts, 5)),
              errores = errores || ${JSON.stringify([{ error: errorMsg, timestamp: new Date().toISOString() }])}::jsonb
          WHERE id = ${syncRunId}::uuid
        `);

        if ((conn.estado as string) !== 'error') {
          await db.execute(sql`
            UPDATE ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
            SET last_sync_at = NOW(), actualizado_en = NOW()
            WHERE id = ${connectionId}::uuid AND last_sync_at < NOW() - INTERVAL '30 minutes'
          `);
        }
      } catch {
        // best-effort error recording
      }
    }
  }

  return { procesadas, exitosas, fallidas };
}

// ─── 6. Revocar conexión ───────────────────────────────────────────────────

export async function revokeConnection(
  connectionId: string,
  ctx: { actorId: string; motivo?: string; flagContext?: FlagContext },
): Promise<void> {
  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new CalendarSyncError('FLAG_OFF', 'Sincronización de calendarios externos desactivada', 403);

  await assertCapability(ctx.actorId, 'calendar.external.connect');

  const connRows = await db.execute(sql`
    SELECT * FROM ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
    WHERE id = ${connectionId}::uuid AND estado = 'activo'
    LIMIT 1
  `);
  const connection = (connRows.rows as Array<Record<string, unknown>>)[0];
  if (!connection) throw new CalendarSyncError('NOT_FOUND', 'Conexión no encontrada o ya desconectada', 404);

  const now = new Date();

  await db.execute(sql`
    UPDATE ${sql.raw(CALENDAR_CONNECTIONS_TABLE)}
    SET estado = 'desconectado',
        disconnected_at = ${now},
        actualizado_en = ${now}
    WHERE id = ${connectionId}::uuid
  `);

  // Marcar todos los vínculos asociados como error
  await db.execute(sql`
    UPDATE ${sql.raw(CALENDAR_EVENT_LINKS_TABLE)}
    SET sync_state = 'error', actualizado_en = ${now}
    WHERE connection_id = ${connectionId}::uuid AND sync_state IN ('synced', 'pending', 'conflict')
  `);

  await logSgie({
    usuarioId: ctx.actorId,
    accion: 'calendar_connection_created',
    recurso: 'calendar_connection',
    recursoId: connectionId,
    metadata: { motivation: ctx.motivo ?? 'disconnect' },
    exito: true,
  });
}
