/**
 * FeatureFlagService — Sistema de flags servidor con deny-by-default.
 *
 * Principios (prompt §6 y §21):
 * - deny-by-default: cualquier flag desconocido o sin configurar => false.
 * - precedencia: procedimiento > expediente > usuario > equipo > organizacion > global.
 *   El scope más específico gana. Un override inferior solo puede RESTRINGIR
 *   (desactivar), nunca AMPLIAR (activar) lo que un scope superior desactivó.
 * - kill switch: si existe un registro con kill_switch=true para la flag en
 *   cualquier scope que aplique al contexto, el resultado es false con
 *   prioridad absoluta (incluso sobre overrides enabled).
 * - cache con TTL corto (default 5s) e invalidación segura por clave.
 * - evaluación en servidor; nunca se confía en flags enviados por cliente.
 * - auditoría: cada cambio se registra en feature_flag_history.
 *
 * Flags canónicos (prompt §6):
 *   sgie.ai.classification
 *   sgie.ai.auto_link
 *   sgie.ai.structured_extraction
 *   sgie.ai.contradictions
 *   sgie.ai.incremental_summary
 *   sgie.ai.next_action
 *   sgie.signature.sandbox
 *   sgie.calendar.external
 *   sgie.calendar.ics.enabled
 *   sgie.retrieval.fts
 *   sgie.copilot
 *
 * En Neon aislado solo los 6 primeros pueden activarse (resto desactivados).
 * Fuera de test/staging TODO debe estar desactivado por defecto.
 */
import { db } from '@/lib/db';
import { featureFlags, featureFlagHistory } from '@/lib/schema';
import { and, desc, eq, or, sql, type SQL } from 'drizzle-orm';
import { assertCapability } from '@/lib/access-service';

export const FLAG_KEYS = [
  'sgie.ai.classification',
  'sgie.ai.auto_link',
  'sgie.ai.structured_extraction',
  'sgie.ai.contradictions',
  'sgie.ai.incremental_summary',
  'sgie.ai.next_action',
  'sgie.documents.bulk_approve',
  'sgie.signature.packages',
  'sgie.signature.enabled',
  'sgie.signature.sandbox',
  'sgie.calendar.external',
  'sgie.calendar.ics.enabled',
  'sgie.retrieval.fts',
  'sgie.search.full_text',
  'sgie.search.trigram',
  'sgie.copilot',
  'sgie.risk.enabled',
  'sgie.workload.enabled',
  'sgie.daily_brief.enabled',
  'sgie.autonomy_metrics.enabled',
] as const;
export type FlagKey = (typeof FLAG_KEYS)[number];

export const SCOPE_LEVELS = [
  'global',
  'organizacion',
  'equipo',
  'usuario',
  'expediente',
  'procedimiento',
] as const;
export type ScopeLevel = (typeof SCOPE_LEVELS)[number];

// Precedencia: de específico a general (índice 0 = más específico).
const SCOPE_PRIORITY: Record<ScopeLevel, number> = {
  procedimiento: 0,
  expediente: 1,
  usuario: 2,
  equipo: 3,
  organizacion: 4,
  global: 5,
};

export interface FlagContext {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  caseId?: string;
  procedureId?: string;
}

export interface FlagResolution {
  enabled: boolean;
  config: Record<string, unknown>;
  killSwitch: boolean;
  resolvedScope: ScopeLevel;
  motivo?: string;
}

export interface FlagMutacionInput {
  flagKey: string;
  scopeLevel: ScopeLevel;
  context: FlagContext;
  enabled: boolean;
  config?: Record<string, unknown>;
  killSwitch?: boolean;
  motivo?: string;
  actorId?: string;
  validFrom?: Date;
  validUntil?: Date;
}

// ─── Cache en memoria con TTL ────────────────────────────────────────────────
interface CacheEntry {
  resolution: FlagResolution;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 5_000; // 5s

function cacheKey(flagKey: string, ctx: FlagContext): string {
  return `${flagKey}|${ctx.organizationId ?? ''}|${ctx.teamId ?? ''}|${ctx.userId ?? ''}|${ctx.caseId ?? ''}|${ctx.procedureId ?? ''}`;
}

export function clearFlagCache(flagKey?: string): void {
  if (flagKey) {
    for (const k of cache.keys()) {
      if (k.startsWith(flagKey + '|')) cache.delete(k);
    }
  } else {
    cache.clear();
  }
}

function isFlagKey(key: string): key is FlagKey {
  return (FLAG_KEYS as readonly string[]).includes(key);
}

/**
 * Lee los registros de BD que aplican al contexto dado para una flag.
 *
 * Optimización (bug 8): en lugar de cargar TODAS las filas de la flag y
 * filtrar en JS, construye una cláusula WHERE que recupera solo los scopes
 * relevantes para el contexto (global + el específico de cada nivel presente).
 * Sigue aplicando el filtro de vigencia temporal en BD. Evita N+1 y escaneos.
 *
 * Devuelve en orden de prioridad (más específico primero) tras el filtrado.
 */
async function fetchApplicable(flagKey: string, ctx: FlagContext) {
  // Construir OR de condiciones por scope aplicable al contexto.
  // Usar sql`` para combinar scope_level + id en cada rama (Drizzle no acepta
  // and() con un solo arg de forma tipada, y el COALESCE del índice UNIQUE
  // exige que coincida exactamente el id del scope).
  const scopeConds: SQL[] = [sql`"scope_level" = 'global'`];
  if (ctx.organizationId) {
    scopeConds.push(sql`("scope_level" = 'organizacion' AND "organization_id" = ${ctx.organizationId})`);
  }
  if (ctx.teamId) {
    scopeConds.push(sql`("scope_level" = 'equipo' AND "team_id" = ${ctx.teamId})`);
  }
  if (ctx.userId) {
    scopeConds.push(sql`("scope_level" = 'usuario' AND "user_id" = ${ctx.userId})`);
  }
  if (ctx.caseId) {
    scopeConds.push(sql`("scope_level" = 'expediente' AND "case_id" = ${ctx.caseId})`);
  }
  if (ctx.procedureId) {
    scopeConds.push(sql`("scope_level" = 'procedimiento' AND "procedure_id" = ${ctx.procedureId})`);
  }

  const rows = await db
    .select()
    .from(featureFlags)
    .where(
      and(
        eq(featureFlags.flagKey, flagKey),
        or(...scopeConds),
      ),
    )
    .orderBy(desc(featureFlags.creadoEn));

  // Filtro de vigencia temporal Y de scope en JS como defensa adicional.
  // El SQL ya filtra por scope para optimizar (evita cargar filas irrelevantes),
  // pero este filtro JS garantiza corrección semántica incluso si la query SQL
  // devuelve filas que no aplican al contexto (ej. mocks de test, o si el
  // optimizador de BD no respeta el OR de scopes correctamente).
  const now = Date.now();
  return rows.filter((r) => {
    if (r.validFrom && new Date(r.validFrom).getTime() > now) return false;
    if (r.validUntil && new Date(r.validUntil).getTime() < now) return false;
    // Filtro de scope defensivo.
    switch (r.scopeLevel) {
      case 'global':
        return true;
      case 'organizacion':
        return ctx.organizationId != null && r.organizationId === ctx.organizationId;
      case 'equipo':
        return ctx.teamId != null && r.teamId === ctx.teamId;
      case 'usuario':
        return ctx.userId != null && r.userId === ctx.userId;
      case 'expediente':
        return ctx.caseId != null && r.caseId === ctx.caseId;
      case 'procedimiento':
        return ctx.procedureId != null && r.procedureId === ctx.procedureId;
      default:
        return false;
    }
  });
}

/**
 * Resuelve el valor de una flag para un contexto.
 *
 * Reglas:
 * 1. deny-by-default: flag desconocida o sin registros => { enabled: false }.
 * 2. kill switch: si cualquier registro aplicable tiene kill_switch=true =>
 *    { enabled: false, killSwitch: true } con prioridad absoluta.
 * 3. precedencia: el registro del scope más específico gana. Pero un scope
 *    inferior solo puede RESTRINGIR: si un scope superior enabled=false,
 *    ningún inferior puede forzar enabled=true (no ampliar permisos).
 */
export async function resolveFlag(
  flagKey: string,
  ctx: FlagContext = {},
  opts: { ttlMs?: number; skipCache?: boolean } = {},
): Promise<FlagResolution> {
  const ttl = opts.ttlMs ?? DEFAULT_TTL_MS;
  if (!opts.skipCache) {
    const key = cacheKey(flagKey, ctx);
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.resolution;
    }
  }

  // deny-by-default para flags no canónicas.
  if (!isFlagKey(flagKey)) {
    const resolution: FlagResolution = {
      enabled: false,
      config: {},
      killSwitch: false,
      resolvedScope: 'global',
      motivo: 'flag_key_desconocida',
    };
    return resolution;
  }

  const applicable = await fetchApplicable(flagKey, ctx);

  // Kill switch: prioridad absoluta. Si cualquier registro aplicable lo activa,
  // el resultado es disabled sin importar overrides.
  const hasKill = applicable.some((r) => r.killSwitch);
  if (hasKill) {
    const resolution: FlagResolution = {
      enabled: false,
      config: {},
      killSwitch: true,
      resolvedScope: 'global',
      motivo: 'kill_switch_activo',
    };
    cache.set(cacheKey(flagKey, ctx), { resolution, expiresAt: Date.now() + ttl });
    return resolution;
  }

  if (applicable.length === 0) {
    const resolution: FlagResolution = {
      enabled: false,
      config: {},
      killSwitch: false,
      resolvedScope: 'global',
      motivo: 'sin_configuracion',
    };
    cache.set(cacheKey(flagKey, ctx), { resolution, expiresAt: Date.now() + ttl });
    return resolution;
  }

  // Ordenar por precedencia: más específico primero.
  const sorted = [...applicable].sort(
    (a, b) => SCOPE_PRIORITY[a.scopeLevel as ScopeLevel] - SCOPE_PRIORITY[b.scopeLevel as ScopeLevel],
  );

  // Encontrar el primer enabled=true subiendo desde el más específico, pero
  // respetando la regla de no-ampliar: si un scope más general tiene enabled=false,
  // los más específicos solo pueden mantenerlo false.
  // Implementación: recorrer de general a específico; el más específico activo
  // solo cuenta si ningún general lo desactivó.
  let resolvedEnabled = false;
  let resolvedConfig: Record<string, unknown> = {};
  let resolvedScope: ScopeLevel = 'global';
  // Recorrer de general a específico (mayor prioridad numérica a menor).
  const generalToSpecific = [...sorted].sort(
    (a, b) => SCOPE_PRIORITY[b.scopeLevel as ScopeLevel] - SCOPE_PRIORITY[a.scopeLevel as ScopeLevel],
  );
  for (const r of generalToSpecific) {
    if (r.enabled) {
      resolvedEnabled = true;
      resolvedConfig = (r.config as Record<string, unknown>) ?? {};
      resolvedScope = r.scopeLevel as ScopeLevel;
    } else {
      // Un desactivado más general bloquea cualquier activación más específica.
      resolvedEnabled = false;
      resolvedConfig = (r.config as Record<string, unknown>) ?? {};
      resolvedScope = r.scopeLevel as ScopeLevel;
      break;
    }
  }

  const resolution: FlagResolution = {
    enabled: resolvedEnabled,
    config: resolvedConfig,
    killSwitch: false,
    resolvedScope,
    motivo: resolvedEnabled ? undefined : 'desactivado_por_scope',
  };
  cache.set(cacheKey(flagKey, ctx), { resolution, expiresAt: Date.now() + ttl });
  return resolution;
}

/**
 * Atajo: ¿la flag está habilitada para este contexto?
 */
export async function isFlagEnabled(
  flagKey: string,
  ctx: FlagContext = {},
): Promise<boolean> {
  return (await resolveFlag(flagKey, ctx)).enabled;
}

/**
 * Mutación de una flag. Registra historial y actualiza cache.
 *
 * Validación:
 * - flagKey debe ser canónica.
 * - scopeLevel debe ser válido.
 * - el ID del contexto correspondiente al scope debe estar presente.
 * - fuera de test/staging, los flags avanzados (firma, calendario, retrieval,
 *   copiloto) no pueden activarse; la validación la hace el caller (API admin).
 */
export async function setFlag(input: FlagMutacionInput): Promise<void> {
  if (!isFlagKey(input.flagKey)) {
    throw new Error(`flag_key_desconocida: ${input.flagKey}`);
  }
  // Validar que el ID del scope esté presente.
  const scopeIdMap: Record<ScopeLevel, string | undefined> = {
    global: 'global',
    organizacion: input.context.organizationId,
    equipo: input.context.teamId,
    usuario: input.context.userId,
    expediente: input.context.caseId,
    procedimiento: input.context.procedureId,
  };
  if (input.scopeLevel !== 'global' && !scopeIdMap[input.scopeLevel]) {
    throw new Error(`scope_sin_id: ${input.scopeLevel} requiere el ID correspondiente en context`);
  }

  // Upsert atómico bajo concurrencia. El patrón previo (select-then-update/insert)
  // tenía una race condition TOCTOU: dos writers concurrentes podían leer ambos
  // "no existe", insertar ambos, y violar el UNIQUE (o perder una actualización).
  //
  // Solución: transacción con SELECT ... FOR UPDATE (bloqueo pesimista de la
  // fila existente) + INSERT ... ON CONFLICT DO NOTHING + UPDATE si el INSERT
  // no afectó filas. El FOR UPDATE serializa los writers sobre la misma flag.
  // Para el caso "no existe", el ON CONFLICT del UNIQUE compuesto garantiza
  // que solo un insert gane; el segundo hará el UPDATE.
  await db.transaction(async (tx) => {
    // Bloquear la fila existente (si la hay) para serializar writers.
    const prevRows = await tx.execute(
      sql`SELECT * FROM "feature_flags"
          WHERE "flag_key" = ${input.flagKey}
            AND "scope_level" = ${input.scopeLevel}
            AND COALESCE("organization_id", '00000000-0000-0000-0000-000000000000') = COALESCE(${input.context.organizationId ?? null}::uuid, '00000000-0000-0000-0000-000000000000')
            AND COALESCE("team_id", '00000000-0000-0000-0000-000000000000') = COALESCE(${input.context.teamId ?? null}::uuid, '00000000-0000-0000-0000-000000000000')
            AND COALESCE("user_id", '00000000-0000-0000-0000-000000000000') = COALESCE(${input.context.userId ?? null}::uuid, '00000000-0000-0000-0000-000000000000')
            AND COALESCE("case_id", '00000000-0000-0000-0000-000000000000') = COALESCE(${input.context.caseId ?? null}::uuid, '00000000-0000-0000-0000-000000000000')
            AND COALESCE("procedure_id", '00000000-0000-0000-0000-000000000000') = COALESCE(${input.context.procedureId ?? null}::uuid, '00000000-0000-0000-0000-000000000000')
          FOR UPDATE`,
    );
    const prev = (prevRows as unknown as Array<Record<string, unknown>>)[0];
    const prevEnabled = (prev?.enabled as boolean | undefined) ?? null;
    const prevConfig = (prev?.config as Record<string, unknown> | undefined) ?? null;

    if (prev) {
      // UPDATE sobre la fila bloqueada.
      await tx
        .update(featureFlags)
        .set({
          enabled: input.enabled,
          config: input.config ?? {},
          killSwitch: input.killSwitch ?? false,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
          motivo: input.motivo,
          actorId: input.actorId,
          actualizadoEn: new Date(),
        })
        .where(eq(featureFlags.id, prev.id as string));
    } else {
      // INSERT con ON CONFLICT DO NOTHING (UNIQUE compuesto protege).
      // Si otro writer ganó, no hacemos nada aquí; la próxima invocación verá
      // la fila y hará UPDATE. Para no perder la escritura, re-leemos y si la
      // fila apareció, actualizamos.
      const inserted = await tx
        .insert(featureFlags)
        .values({
          flagKey: input.flagKey,
          scopeLevel: input.scopeLevel,
          organizationId: input.context.organizationId,
          teamId: input.context.teamId,
          userId: input.context.userId,
          caseId: input.context.caseId,
          procedureId: input.context.procedureId,
          enabled: input.enabled,
          config: input.config ?? {},
          killSwitch: input.killSwitch ?? false,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
          motivo: input.motivo,
          actorId: input.actorId,
        })
        .onConflictDoNothing()
        .returning({ id: featureFlags.id });
      if (inserted.length === 0) {
        // Otro writer ganó la inserción; actualizar la fila existente.
        await tx
          .update(featureFlags)
          .set({
            enabled: input.enabled,
            config: input.config ?? {},
            killSwitch: input.killSwitch ?? false,
            validFrom: input.validFrom,
            validUntil: input.validUntil,
            motivo: input.motivo,
            actorId: input.actorId,
            actualizadoEn: new Date(),
          })
          .where(
            and(
              eq(featureFlags.flagKey, input.flagKey),
              eq(featureFlags.scopeLevel, input.scopeLevel),
            ),
          );
      }
    }
    // Historial inmutable.
    await tx.insert(featureFlagHistory).values({
      flagKey: input.flagKey,
      scopeLevel: input.scopeLevel,
      organizationId: input.context.organizationId,
      teamId: input.context.teamId,
      userId: input.context.userId,
      caseId: input.context.caseId,
      procedureId: input.context.procedureId,
      previousEnabled: prevEnabled,
      newEnabled: input.enabled,
      previousConfig: prevConfig,
      newConfig: input.config ?? {},
      killSwitch: input.killSwitch ?? false,
      motivo: input.motivo,
      actorId: input.actorId,
    });
  });

  // Invalidar cache.
  clearFlagCache(input.flagKey);
}

/**
 * Valida autorización para activar/desactivar kill switches. Requiere capacidad
 * administrativa `settings.manage`. Deny-by-default: lanza ForbiddenError si
 * el actor no está autenticado, está suspendido/inactivo, o no tiene la
 * capacidad. No acepta rol proporcionado por cliente.
 */
async function assertKillSwitchAuthorization(actorId: string): Promise<void> {
  await assertCapability(actorId, 'settings.manage');
}

/**
 * Activa el kill switch global de una flag. Prioridad absoluta sobre cualquier
 * override.
 *
 * Autorización: requiere `settings.manage` (capacidad administrativa). Valida
 * cuenta activa, no suspendida, acceso SGIE y capacidad en servidor vía
 * AccessService. Deny-by-default: cualquier fallo de autorización aborta.
 */
export async function activateKillSwitch(
  flagKey: string,
  actorId: string,
  motivo: string,
): Promise<void> {
  if (!isFlagKey(flagKey)) {
    throw new Error(`flag_key_desconocida: ${flagKey}`);
  }
  // Autorización admin obligatoria (deny-by-default).
  await assertKillSwitchAuthorization(actorId);
  await setFlag({
    flagKey,
    scopeLevel: 'global',
    context: {},
    enabled: false,
    killSwitch: true,
    motivo: `KILL SWITCH: ${motivo}`,
    actorId,
  });
}

/**
 * Desactiva el kill switch global de una flag (restaura el comportamiento
 * normal).
 *
 * Autorización: misma que activateKillSwitch (`settings.manage`).
 */
export async function deactivateKillSwitch(
  flagKey: string,
  actorId: string,
  motivo: string,
): Promise<void> {
  if (!isFlagKey(flagKey)) {
    throw new Error(`flag_key_desconocida: ${flagKey}`);
  }
  await assertKillSwitchAuthorization(actorId);
  // Eliminar el registro de kill switch global.
  await db
    .delete(featureFlags)
    .where(
      and(
        eq(featureFlags.flagKey, flagKey),
        eq(featureFlags.scopeLevel, 'global'),
        eq(featureFlags.killSwitch, true),
      ),
    );
  await db.insert(featureFlagHistory).values({
    flagKey,
    scopeLevel: 'global',
    newEnabled: false,
    killSwitch: false,
    motivo: `KILL SWITCH DESACTIVADO: ${motivo}`,
    actorId,
  });
  clearFlagCache(flagKey);
}

/**
 * Devuelve el estado sanitizado de todas las flags para panel Admin.
 * No expone IDs sensibles innecesariamente.
 */
export async function listFlagsStatus(ctx: FlagContext = {}): Promise<
  Array<{ flagKey: string; enabled: boolean; killSwitch: boolean; resolvedScope: ScopeLevel; motivo?: string }>
> {
  const out: Array<{ flagKey: string; enabled: boolean; killSwitch: boolean; resolvedScope: ScopeLevel; motivo?: string }> = [];
  for (const key of FLAG_KEYS) {
    const r = await resolveFlag(key, ctx, { skipCache: true });
    out.push({
      flagKey: key,
      enabled: r.enabled,
      killSwitch: r.killSwitch,
      resolvedScope: r.resolvedScope,
      motivo: r.motivo,
    });
  }
  return out;
}
