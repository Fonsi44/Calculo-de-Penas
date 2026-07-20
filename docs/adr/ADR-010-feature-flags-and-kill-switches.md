# ADR-010: Feature flags y kill switches

**Fecha:** 2026-07-19. **Estado:** Aceptado.

## Contexto

El SGIE introduce capacidades de IA, firma, calendario externo, retrieval y copiloto cuya activación no puede ser binaria ni global. Se necesita un mecanismo que permita:

- **Activación por capacidad**: las 10 flags canónicas (`sgie.ai.classification`, `sgie.ai.auto_link`, `sgie.ai.structured_extraction`, `sgie.ai.contradictions`, `sgie.ai.incremental_summary`, `sgie.ai.next_action`, `sgie.signature.sandbox`, `sgie.calendar.external`, `sgie.retrieval.fts`, `sgie.copilot`) deben poder encenderse/apagarse de forma independiente y por scope.
- **Deny-by-default**: cualquier flag desconocida o sin configurar se resuelve como `false`. La seguridad no depende de que el autor recuerde denegar.
- **Granularidad por scope**: una flag puede activarse globalmente, pero desactivarse para una organización, equipo, usuario, expediente o procedimiento concreto. La regla de negocio es que un scope inferior solo puede **restringir** (desactivar), nunca **ampliar** (activar) lo que un scope superior denegó.
- **Parada de emergencia**: ante un incidente (por ejemplo prompt injection, fuga, o modelo que degrada) se requiere un kill switch global con prioridad absoluta que deje la flag en `false` sin importar overrides.
- **Auditoría**: cada cambio debe quedar registrado de forma inmutable.
- **Evaluación en servidor**: el cliente nunca envía flags; siempre se resuelven en servidor con cache corta.

## Decisión

**Implementar `FeatureFlagService`** sobre dos tablas: `feature_flags` (estado vigente por flag + scope) y `feature_flag_history` (bitácora inmutable de cada mutación).

### Scopes y precedencia

Se definen **6 niveles de scope**, ordenados de más específico a más general:

| Prioridad | Scope | ID requerido en contexto |
|-----------|-------|--------------------------|
| 0 (más específica) | `procedimiento` | `procedureId` |
| 1 | `expediente` | `caseId` |
| 2 | `usuario` | `userId` |
| 3 | `equipo` | `teamId` |
| 4 | `organizacion` | `organizationId` |
| 5 (más general) | `global` | ninguno |

Reglas de resolución:

1. **Deny-by-default**: flag no canónica o sin registros → `enabled: false`.
2. **Kill switch absoluto**: si cualquier registro aplicable tiene `kill_switch = true` → `enabled: false, killSwitch: true`, con prioridad sobre cualquier override.
3. **Precedencia con no-ampliación**: el scope más específico gana, pero un scope inferior solo puede RESTRINGIR. Si un scope superior tiene `enabled = false`, ningún inferior puede forzar `enabled = true`. La implementación recorre de general a específico: el primer `enabled = false` bloquea cualquier activación posterior.

### Kill switch global

- Es un registro `scope_level = 'global'`, `kill_switch = true` para la flag.
- Tiene **prioridad absoluta**: se evalúa antes que cualquier otra regla.
- Solo puede ser activado/desactivado por un actor con capacidad administrativa `settings.manage`, validada en servidor vía `assertCapability` (deny-by-default: cuenta activa, no suspendida, con acceso SGIE y la capacidad).

### Cache

- Cache en memoria con **TTL de 5 segundos** por defecto (`DEFAULT_TTL_MS = 5_000`).
- Clave de cache compuesta por `flagKey` + los IDs del contexto.
- Toda mutación (`setFlag`, kill switch) invalida la cache de la flag afectada con `clearFlagCache`.

## Detalles técnicos

- **`resolveFlag(flagKey, ctx, opts)`**: entrada canónica. Devuelve `{ enabled, config, killSwitch, resolvedScope, motivo }`. Aplica deny-by-default, kill switch absoluto y precedencia. Usa cache salvo `skipCache: true`.
- **`fetchApplicable(flagKey, ctx)`**: construye una cláusula `WHERE` con `OR` por cada scope presente en el contexto (global + el específico de cada nivel). Evita el anti-patrón de cargar todas las filas y filtrar en JS; elimina N+1 y escaneos completos. El filtro de vigencia temporal (`validFrom`/`validUntil`) se aplica sobre el conjunto ya reducido.
- **`setFlag(input)`**: UPSERT atómico bajo concurrencia. Patrón previo select-then-update/insert con race condition TOCTOU. Solución: transacción con `SELECT ... FOR UPDATE` (bloqueo pesimista de la fila existente) + `INSERT ... ON CONFLICT DO NOTHING` + `UPDATE` si el `INSERT` no afectó filas. El `FOR UPDATE` serializa writers sobre la misma flag; el `ON CONFLICT` del UNIQUE compuesto garantiza que solo un insert gane. Siempre inserta en `feature_flag_history` dentro de la misma transacción.
- **`activateKillSwitch(flagKey, actorId, motivo)`**: requiere `settings.manage` (vía `assertKillSwitchAuthorization`). Inserta el registro global con `killSwitch: true`.
- **`deactivateKillSwitch(flagKey, actorId, motivo)`**: misma autorización. Elimina el registro y deja histórico.

### Validación de mutaciones

- `flagKey` debe pertenecer al conjunto canónico (`FLAG_KEYS`); otra clave lanza `flag_key_desconocida`.
- El ID del scope correspondiente debe estar presente en el contexto (`scope_sin_id` en caso contrario).
- Fuera de test/staging, las flags avanzadas (`sgie.signature.sandbox`, `sgie.calendar.external`, `sgie.retrieval.fts`, `sgie.copilot`) no deben activarse; esa validación la realiza el caller (API admin).

### Listado para panel Admin

`listFlagsStatus(ctx)` resuelve todas las flags canónicas con `skipCache: true` y devuelve un estado sanitizado (`flagKey`, `enabled`, `killSwitch`, `resolvedScope`, `motivo`) sin exponer IDs sensibles innecesarios.

## Consecuencias

- **Positivas**: las flags se evalúan siempre en servidor; el cliente nunca envía flags. El historial (`feature_flag_history`) es inmutable y provee auditoría completa de cada cambio (antes/después, motivo, actor). Los kill switches son globales y requieren admin. La regla no-ampliar garantiza que un scope superior pueda cortar de forma segura. La cache de 5s reduce load de BD en puntos calientes sin sacrificar consistencia eventual.
- **Negativas**: la cache TTL 5s implica una ventana de hasta 5s de inconsistencia entre mutación y observación.
- **Riesgo**: el kill switch no es instantáneo en workers ya corriendo; cada worker debe releer el flag en su próxima iteración para respetarlo. Diseñar workers que revaliden flags por ciclo, no por job completo.

## Alternativas descartadas

1. **Flags en config estática** (variables de entorno o fichero): no permite granularidad por organización/equipo/usuario/expediente ni cambios en runtime sin redeploy. Descartada.
2. **Flags evaluados en cliente**: inseguro. El cliente puede manipular el valor y saltarse controles. Descartada.
3. **Sin kill switch**: sin capacidad de parada de emergencia ante incidente de IA o proveedor externo. Descartada por riesgo operativo.

## Referencias

- Implementación: `lib/sgie/feature-flags.ts`
- Autorización: `lib/access-service.ts` (`assertCapability`, `settings.manage`)
- Esquema: `feature_flags`, `feature_flag_history` en `lib/schema.ts`
