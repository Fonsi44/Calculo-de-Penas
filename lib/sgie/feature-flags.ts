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
 *   sgie.retrieval.fts
 *   sgie.copilot
 *
 * En Neon aislado solo los 6 primeros pueden activarse (resto desactivados).
 * Fuera de test/staging TODO debe estar desactivado por defecto.
 */
import { db } from '@/lib/db';
import { featureFlags, featureFlagHistory } from '@/lib/schema';
import { and, desc, eq } from 'drizzle-orm';

export const FLAG_KEYS = [
  'sgie.ai.classification',
  'sgie.ai.auto_link',
  'sgie.ai.structured_extraction',
  'sgie.ai.contradictions',
  'sgie.ai.incremental_summary',
  'sgie.ai.next_action',
  'sgie.signature.sandbox',
  'sgie.calendar.external',
  'sgie.retrieval.fts',
  'sgie.copilot',
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
 * Lee todos los registros de BD que aplican al contexto dado para una flag,
 * considerando scope descendente (cada nivel más específico sobreescribe).
 * Devuelve en orden de prioridad (más específico primero).
 */
async function fetchApplicable(flagKey: string, ctx: FlagContext) {
  const rows = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.flagKey, flagKey))
    .orderBy(desc(featureFlags.creadoEn));

  const now = Date.now();
  return rows.filter((r) => {
    // Filtro de vigencia.
    if (r.validFrom && new Date(r.validFrom).getTime() > now) return false;
    if (r.validUntil && new Date(r.validUntil).getTime() < now) return false;
    // Filtro de scope: el registro aplica si su scope coincide con el ctx.
    switch (r.scopeLevel) {
      case 'global':
        return true;
      case 'organizacion':
        return ctx.organizationId && r.organizationId === ctx.organizationId;
      case 'equipo':
        return ctx.teamId && r.teamId === ctx.teamId;
      case 'usuario':
        return ctx.userId && r.userId === ctx.userId;
      case 'expediente':
        return ctx.caseId && r.caseId === ctx.caseId;
      case 'procedimiento':
        return ctx.procedureId && r.procedureId === ctx.procedureId;
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

  // Leer estado anterior si existe (para historial).
  const prevRows = await db
    .select()
    .from(featureFlags)
    .where(
      and(
        eq(featureFlags.flagKey, input.flagKey),
        eq(featureFlags.scopeLevel, input.scopeLevel),
      ),
    )
    .limit(1);
  const prev = prevRows[0];
  const prevEnabled = prev?.enabled ?? null;
  const prevConfig = prev?.config ?? null;

  // Upsert (ON CONFLICT por scope unique no es directo en Drizzle con COALESCE;
  // usamos delete + insert en transacción).
  await db.transaction(async (tx) => {
    if (prev) {
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
        .where(eq(featureFlags.id, prev.id));
    } else {
      await tx.insert(featureFlags).values({
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
      });
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
 * Activa el kill switch global de una flag. Prioridad absoluta sobre cualquier
 * override. Solo admin.
 */
export async function activateKillSwitch(
  flagKey: string,
  actorId: string,
  motivo: string,
): Promise<void> {
  if (!isFlagKey(flagKey)) {
    throw new Error(`flag_key_desconocida: ${flagKey}`);
  }
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
 * normal). Solo admin.
 */
export async function deactivateKillSwitch(
  flagKey: string,
  actorId: string,
  motivo: string,
): Promise<void> {
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
