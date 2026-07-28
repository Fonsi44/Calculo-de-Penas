---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Arquitectura — Fase 4A: Automatización documental core

**Fecha:** 2026-07-19 (actualizado 2026-07-20). **Estado: CERTIFICADA al 100%.** Suite unitaria/integración 1065/1065 (serial), lint/tsc/build/drizzle-kit check limpios. E2E Fase 4A con DeepSeek real **19/19** (HEAD `39f86b7`) sobre rama Neon aislada efímera `fase4a-cert-validation-20260720` (eliminada, cero residuos); regresión E2E Fase 2 9/9 y Fase 3 70/70 (DeepSeek + Resend reales) también verde. Ver [Certificación staging Fase 4A](../ops/fase-4a-staging-validation.md#certificación-real-20-07-2026--e2e-neon-aislada--deepseek--resend).

## Objetivo

Cerrar la automatización documental avanzada P2-01 a P2-06 sobre el núcleo durable de Fase 2, con feature flags servidor, autorización previa, correlation ID, auditoría en `ai_pipeline_runs` y resiliencia por etapas.

## Componentes

### FeatureFlagService (`lib/sgie/feature-flags.ts`)
- **deny-by-default**: flag desconocida o sin configuración => `enabled: false`.
- **6 scopes** con precedencia: procedimiento > expediente > usuario > equipo > organización > global.
- **regla no-ampliar**: un scope inferior solo puede RESTRINGIR (desactivar); nunca forzar `enabled=true` si un scope superior está `false`.
- **kill switch global** con prioridad absoluta sobre cualquier override.
- **cache TTL 5s** en servidor; invalidación por clave.
- **autorización admin** (`settings.manage`) para kill switches vía `assertCapability`.
- **concurrencia**: `setFlag` usa `SELECT ... FOR UPDATE` + `ON CONFLICT DO NOTHING` para upsert atómico.
- **optimización**: `fetchApplicable` filtra por scope en la query SQL (no carga todas las filas).
- **auditoría**: `feature_flag_history` inmutable (cambio anterior/posterior, actor, motivo).
- 10 flags canónicas: `sgie.ai.classification`, `sgie.ai.auto_link`, `sgie.ai.structured_extraction`, `sgie.ai.contradictions`, `sgie.ai.incremental_summary`, `sgie.ai.next_action`, `sgie.signature.sandbox`, `sgie.calendar.external`, `sgie.retrieval.fts`, `sgie.copilot`.

### Servicios P2-01 a P2-06

| Servicio | Archivo | Estrategia | Idempotencia |
|---|---|---|---|
| P2-01 Clasificación | `clasificacion-documental.ts` | heurística → DeepSeek; tipos críticos nunca auto-aprobados | UNIQUE (doc, pipeline_version) |
| P2-02 Auto-vinculación | `auto-vinculacion.ts` | candidato único + confianza≥75 + sin bloqueantes; reversible | UNIQUE vigente (doc, exp, req, tipo) |
| P2-03 Extracción | `extraccion-estructurada.ts` | regex determinista → DeepSeek; schemas versionados | UNIQUE (doc, pipeline_version) |
| P2-04 Contradicciones | `motor-contradicciones.ts` | determinista (campos sensibles=>crítica); duplicidad hash | UNIQUE (exp, tipo, docA, docB) |
| P2-05 Resumen incremental | `resumen-incremental.ts` | hash fuentes + watermark; cache hit; abstención | UNIQUE parcial vigente por exp |
| P2-06 NextAction | `next-action.ts` | determinista: bloqueantes > requisitos > alertas > DLQ > plazos(≤3d/≤7d) > firma pendiente > comunicaciones > readiness | UNIQUE (exp, action_key) propuesta |

### DocumentAutomationOrchestrator (`lib/sgie/document-automation-orchestrator.ts`)
Encadena los 6 servicios en pipeline durable:
1. **Autorización**: `canAccessCase(actorId, expedienteId)` ANTES de leer datos.
2. **Kill switch check**: si `sgie.ai.classification` está killed, aborta.
3. **P2-01 a P2-06**: cada etapa controlada por feature flag, idempotente, registra en `ai_pipeline_runs` con correlationId.
4. **Resiliente**: un fallo de etapa no aborta las siguientes.
5. **Sin llamadas externas en transacciones DB** (DeepSeek se llama fuera).

### Prompt injection (ADR-012)
- Contenido documental tratado como **DATO no confiable**.
- Separación estricta: system prompt (instrucciones) vs user prompt (documento marcado `--- DOCUMENTO (DATO) ---`).
- Allowlist de tipos documentales; validación Zod; tipos críticos requieren humano.
- IA propone; reglas + humano deciden estados críticos.
- Abstención explícita sin evidencia.

## Migraciones 0038–0043

| # | Contenido |
|---|---|
| 0038 | `sgie_schema_migrations` (registro propio con hash SHA-256). |
| 0039 | `feature_flags` + `feature_flag_history`. |
| 0040 | `document_classifications`, `document_links`, `extraction_schema_versions`, `document_extractions`, `document_contradictions`. |
| 0041 | `case_summary_checkpoints`, `case_summary_history`, `case_next_actions`, `ai_pipeline_runs`. |
| 0042 | UNIQUEs (idempotencia) + seed 7 schemas canónicos. |
| 0043 | `case_summary_checkpoints` UNIQUE absoluto → parcial (solo vigentes). |

Idempotentes, hash registrado, aplicadas vía `scripts/e2e/apply-fase4-migrations.mjs` (SQL directo, sin `drizzle-kit push`).

## E2E Fase 4A

`scripts/e2e/fase4a-e2e.mjs`: 19 assertions con DeepSeek real (`RUN_DEEPSEEK_E2E=true`). Pipeline completo: flags apagados → activación → doc1 (clasif+extracción+vínculo+resumen+next-action) → doc2 contradictorio → kill switch → idempotencia → aislamiento → auditoría → cleanup.

## Pendiente Fase 4B

- P2-07 aprobación en bloque.
- P2-08 paquete firma + P2-09 firma electrónica.
- P2-10 calendario externo.
- Retrieval FTS/pg_trgm + copiloto + base conocimiento.
- UI extensa.

## Referencias

- [ADR-010: Feature flags y kill switches](../adr/ADR-010-feature-flags-and-kill-switches.md)
- [ADR-011: Document Automation Orchestrator](../adr/ADR-011-document-automation-orchestrator.md)
- [ADR-012: Gobernanza IA y prompt injection](../adr/ADR-012-ai-governance-and-prompt-injection.md)
- [Validación staging Fase 4A](../ops/fase-4a-staging-validation.md)
- [Handoff Fase 4A](../handoffs/fase-4a-hardening-and-validation.md)
