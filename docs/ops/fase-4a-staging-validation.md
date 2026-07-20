# Validación en staging — Fase 4A

## Prerrequisitos
- Rama Neon aislada `fase3-e2e-validation-20260718`
  (branch `br-dark-term-apjtoeoj`, endpoint `ep-fancy-field-ap04213c`).
- Migraciones 0038–0043 aplicadas en la rama aislada.
- Variables en memoria (NO en `.env`): `ALLOW_TEST_DATABASE=true`, `E2E_ENV=staging`,
  `E2E_NEON_BRANCH_*`, `DATABASE_URL` al endpoint aislado.
- Alias DeepSeek: `IA_DOCUMENTAL_API_KEY ??= DEEPSEEK_API_KEY`.

## Aplicación de migraciones

```bash
node scripts/e2e/apply-fase4-migrations.mjs
# Aplica 0038-0043. Segunda ejecución: 0 cambios (idempotente).
# Aborta si un hash SHA-256 registrado cambió.
```

## E2E Fase 4A

```bash
# Sin DeepSeek (valida infraestructura):
node scripts/e2e/fase4a-e2e.mjs

# Con DeepSeek real:
RUN_DEEPSEEK_E2E=true node scripts/e2e/fase4a-e2e.mjs
# 19 assertions: clasificación, extracción, vínculo, contradicción, resumen
# incremental, next-action, kill switch, idempotencia, aislamiento, auditoría.
```

## Regresión Fases 2 y 3

```bash
node scripts/e2e/run-fase3-isolated.mjs ambas
# Fase 2: 9/9 pasos. Fase 3: 70/70 assertions + DeepSeek + Resend reales.
```

## Resultado verificado (19-07-2026)

- E2E Fase 4A: **19/19 assertions**, DeepSeek `deepseek-v4-flash` 792ms, confianza 95.
- Regresión Fase 2: 9/9. Fase 3: 70/70.
- Suite local: lint 0, tsc 0, **1015+ tests**, build OK, drizzle OK.
- Limpieza: 18 filas, 0 restantes.

## Schemas canónicos sembrados (migración 0042)

7 tipos: identidad (5 campos), rtn (3), resolución_judicial (5), escrito_juridico (4), poder (5), comprobante (4), otro (0).

## Resolución de incidencias

- **E2E falla en "checkpoint vigente"**: la migración 0043 cambia UNIQUE absoluto → parcial. Verifica que `case_summary_checkpoints_vigente_unique` existe y el absoluto `case_summary_checkpoints_expediente_id_key` fue dropeado.
- **DeepSeek timeout**: el E2E usa `IA_DOCUMENTAL_TIMEOUT_MS` (default 60s). Si falla, reintentar; el servicio tiene 2 reintentos.
- **Flag no resuelve como esperado**: usar `listFlagsStatus(ctx)` con `skipCache: true` para ver el estado real.
- **Kill switch no detiene workers en curso**: los workers deben releer el flag en su próxima iteración (cache TTL 5s).

## Rollback

- Migraciones 0038-0043: `DROP TABLE IF EXISTS ... CASCADE` en orden inverso. La rama Neon aislada se conserva para Fase 4B.
- Feature flags: `DELETE FROM feature_flags WHERE ...` + `DELETE FROM feature_flag_history WHERE ...`.
- Schemas canónicos: `DELETE FROM extraction_schema_versions WHERE version = 1`.

## Revalidación local (20-07-2026) — cierre de bugs 5-8

Esta sesión cerró los bugs 5-8 sobre `feature-flags.ts` y `next-action.ts` y amplió la cobertura de tests. Resultado real de la validación local (sin E2E Neon):

| Comprobación | Resultado |
|---|---|
| `tests/fase4a-feature-flags.test.ts` | 16/16 ✓ |
| `tests/fase4a-p2-05-p2-06-extended.test.ts` | 32/32 ✓ (16 nuevos: firma, conflictos, evidencias, DLQ aislado, watermark, único checkpoint vigente, histórico, concurrencia/idempotencia, aislamiento, flag off, kill switch) |
| `tests/fase4a-orchestrator.test.ts` | 7/7 ✓ |
| `tests/fase4a-servicios-core.test.ts` | 19/19 ✓ |
| `tests/fase4a-clasificacion.test.ts` | 11/11 ✓ |
| Regresión Fase 2 (`fase2-nucleo-durable.test.ts`) | 24/24 ✓ |
| Regresión Fase 3 (`fase3-experiencia-operativa.test.ts`) | 22/22 ✓ |
| Suite Vitest completa | **1048/1048 ✓ (59 archivos)** |
| `npm run lint` | 0 errores |
| `npx tsc --noEmit` | 0 errores |
| `npm run build` | ✓ Compiled successfully |
| `git diff --check` | sin errores de whitespace |
| `app/(public)/` | sin cambios (intacta) |
| Drizzle schema (`lib/schema.ts`) | sin cambios (no requiere migración nueva) |
| E2E Fase 4A con DeepSeek (`RUN_DEEPSEEK_E2E=true`) | **NO VALIDADO** — sin rama Neon aislada ni `RUN_DEEPSEEK_E2E` en el entorno de esta sesión. El E2E fue validado en commits previos (`6f79b86`, `7de4fd1`). |

**Bugs cerrados en esta sesión:**
- **Bug 5** (fuentes P2-06): añadida fuente `det.firma_pendiente` que detecta `eventos_agenda` tipo `firma` pendientes no cubiertos por la ventana de plazos. Faltantes previos (plazos, comunicaciones, readiness) ya estaban implementados.
- **Bug 6** (concurrencia `setFlag`): ya implementado — transacción con `SELECT ... FOR UPDATE` + `INSERT ... ON CONFLICT DO NOTHING` + `UPDATE` + historial en la misma transacción.
- **Bug 7** (autorización kill switch): ya implementado — `assertKillSwitchAuthorization` valida `settings.manage` vía `assertCapability` (deny-by-default).
- **Bug 8** (optimización `fetchApplicable`): ya implementado — cláusula `WHERE OR` por scope presente en el contexto; filtro de vigencia y de scope defensivo en JS.

**No se añadió migración nueva** (última `0043`): los bugs 5-8 son de lógica de aplicación, no de DDL. El schema no fue modificado.
