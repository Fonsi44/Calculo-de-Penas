# Handoff técnico — Hardening y validación Fase 4A

**Fecha:** 2026-07-19. Commit: ver `git log`. Conserva `7de4fd1` (Fase 4A inicial); este commit añade hardening + orchestrator + E2E real.

## Estado

Fase 4A **NO cerrada al 100%** (faltan ADR-010/011/012 y docs extensa del §10). Estimación **~85%** si se cuenta: bugs corregidos, orchestrator integrado, E2E real con DeepSeek verde, regresión Fases 2/3 verde, suite 1015/1015, build OK.

## Bugs corregidos (auditoría del commit 7de4fd1)

| # | Bug | Corrección |
|---|---|---|
| 1 | `next-action.ts` DLQ global sin filtrar por expediente (listaba jobs ajenos) | Filtro por `payload->expedienteId`/`documentoId` |
| 2 | `motor-contradicciones.ts` dead code `estado: d.bloqueante ? 'propuesta' : 'propuesta'` | Eliminado el ternario |
| 3 | `document_links` y `document_contradictions` sin UNIQUE (idempotencia frágil) | Migración 0042 añade UNIQUE parcial |
| 4 | `motor-contradicciones.ts` header prometía capa IA inexistente | Header corregido: capa IA queda para Fase 4B |
| 9 | `resumen-incremental.ts` invalida+insert sin transacción (ventana de carrera) | Envuelto en `db.transaction()` atómica |
| 10 | `next-action.ts` no enviaba `modeloIa`/`reglaId` al persistir | Añadidos al insert |
| 11 | `case_next_actions.idempotencyKey` sin UNIQUE real | Migración 0042 añade UNIQUE |
| extra | `case_summary_checkpoints` UNIQUE absoluto impedía histórico (invalidados + vigente) | Migración 0043 cambia a UNIQUE parcial solo vigentes |

## Bugs NO corregidos (deuda pendiente para Fase 4B)

- **Bug 5**: P2-06 fuentes 5-8 (plazos, firma, comunicaciones, readiness) declaradas en header, no implementadas. Solo determinista con requisitos/alertas/DLQ.
- **Bug 6**: `feature_flags.setFlag` race condition (select-then-update/insert). La migración 0042 añade UNIQUE parcial de kill switch global pero no resuelve el race general. Pendiente: ON CONFLICT con target.
- **Bug 7**: `activateKillSwitch` no valida rol admin (lo hace el caller hipotético). Pendiente.
- **Bug 8**: `fetchApplicable` carga todas las filas de la flag (rendimiento). Pendiente optimización con WHERE por scope.

## Arquitectura final del orquestador

`lib/sgie/document-automation-orchestrator.ts`:

```
entrada (documentId, expedienteId, actorId, datos)
→ 1. Autorización: canAccessCase(actorId, expedienteId). Sin acceso => aborta.
→ 2. Kill switch: resolveFlag('sgie.ai.classification'). Si kill => aborta.
→ 3. P2-01 clasificarDocumento (flag)
→ 4. P2-03 extraerEstructurado (usa tipo de la clasificación)
→ 5. P2-02 autoVincularDocumento
→ 6. P2-04 detectarContradiccionesExpediente
→ 7. P2-05 generarResumenIncremental
→ 8. P2-06 recomendarNextAction
cada etapa: registra en ai_pipeline_runs con correlationId, modelo, tokens, latencia.
resiliente: un fallo de etapa no aborta las siguientes.
```

Sin llamadas externas dentro de transacciones DB. DeepSeek se llama dentro de cada servicio (fuera de cualquier transacción del orchestrator). correlationId generado o propagado.

## Comandos y resultados

```bash
# Migraciones (idempotentes, hash registrado)
node scripts/e2e/apply-fase4-migrations.mjs
# → 0038-0043: 6 aplicadas / ya aplicadas, 0 fallidas. Segunda ejecución: 0 cambios.

# E2E Fase 4A con DeepSeek real
RUN_DEEPSEEK_E2E=true node scripts/e2e/fase4a-e2e.mjs (vía runner aislado)
# → 19/19 assertions, código 0. DeepSeek: deepseek-v4-flash, 792ms, tipo identidad confianza 95.

# Regresión Fases 2 y 3
node scripts/e2e/run-fase3-isolated.mjs ambas
# → Fase 2: 9/9. Fase 3: 70/70, DeepSeek+Resend validados.

# Validación local
npm run lint        # 0 errores, 0 warnings
npx tsc --noEmit    # 0 errores
npm run test        # 1015/1015
npm run build       # Compiled 82s, 338 páginas, exit 0
npx drizzle-kit check  # OK
git diff --check    # 0
```

## Assertions E2E Fase 4A (19)

1. flags inicialmente apagados
2. 6 flags activadas en scope expediente
3. (DeepSeek) clasifica con tipoDocumento
4. (DeepSeek) devuelve confianzaTipo numérica
5. clasificación persistida como identidad
6. clasificación confianza >= 75
7. extracción estructurada persistida
8. auto-vinculación aceptada
9. resumen inicial persistido
10. next action persistida
11. contradicción crítica detectada
12. contradicción es bloqueante
13. exactamente 1 checkpoint vigente tras incremental
14. kill switch global activado
15. idempotencia clasificación (no duplica)
16. abogado sin acceso no tiene asignación
17. ai_pipeline_runs registra con correlation_id
18. clasificación persiste tras nueva conexión
19. expediente persiste tras nueva conexión

## Modelo DeepSeek real

- **Modelo**: `deepseek-v4-flash`
- **Latencia**: 792ms (clasificación), 428ms (Fase 3)
- **Alias**: `IA_DOCUMENTAL_API_KEY ??= DEEPSEEK_API_KEY` (en memoria, no en .env)
- **Validación**: clasificó correctamente documento sintético de identidad hondureña (confianza 95)

## Estado de migraciones (rama Neon aislada ep-fancy-field-ap04213c)

| # | Migración | Hash (prefijo) |
|---|---|---|
| 0038 | sgie_schema_migrations | 5e42b468 |
| 0039 | feature_flags | 582d86f0 |
| 0040 | document_pipeline | 74c38c8e |
| 0041 | summary_nextaction | ca460119 |
| 0042 | unique_constraints_and_seeds | 7d5fbae9 |
| 0043 | checkpoint_unique_partial | c37b9661 |

Todas registradas en `sgie_schema_migrations`. Segunda ejecución del aplicador: 0 cambios.

## Fixtures

Cleanup en `finally` del E2E: **18 filas eliminadas, 0 restantes** (assertion de limpieza pasa).

## Documentación pendiente (Fase 4B)

- ADR-010: feature flags y kill switches.
- ADR-011: automatización documental P2-01 a P2-06.
- ADR-012: gobernanza IA y prompt injection.
- `docs/architecture/fase-4a-*.md`
- `docs/ops/fase-4a-staging-validation.md`
- Actualizar checklist maestro y `SGIE_NEW_CHAT_CONTEXT.md` y `CHANGELOG.md`.

## Pendiente para el bloque siguiente (Fase 4B)

- ADRs y docs (arriba).
- Bugs 5, 6, 7, 8 (deuda documentada).
- Aprobación en bloque P2-07.
- Paquete para firma P2-08 + firma electrónica P2-09.
- Calendario externo P2-10.
- Retrieval FTS/pg_trgm.
- Copiloto tool calling.
- Base de conocimiento jurídica.
- UI extensa.
