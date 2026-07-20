# ADR-011: Orquestador de automatización documental

**Fecha:** 2026-07-19. **Estado:** Aceptado.

## Contexto

La Fase 2 entregó seis servicios aislados (P2-01 a P2-06): clasificación documental, extracción estructurada, auto-vinculación a requisitos, detección de contradicciones, resumen incremental y recomendación de next-action. Cada uno funciona de forma independiente y es idempotente.

Sin embargo, no existe un punto único que los encadene con garantías de: orden determinístico, trazabilidad de extremo a extremo, autorización uniforme y resiliencia ante fallos parciales. Si cada servicio se invoca manualmente desde la UI, se pierde el orden, la auditoría unificada y la capacidad de reanudar.

Se necesita un **pipeline durable, auditable y autorizado** que tome un documento ya procesado (texto extraído) y lo conduzca por las seis etapas reutilizando el motor de jobs/outbox existente.

## Decisión

**Implementar `DocumentAutomationOrchestrator`** (`lib/sgie/document-automation-orchestrator.ts`) como punto único de entrada productivo para la automatización documental.

### Pipeline

El orquestador encadena las etapas en este orden fijo:

```
autorización (canAccessCase)
  → kill switch check (sgie.ai.classification)
  → P2-01 clasificación
  → P2-03 extracción estructurada
  → P2-02 auto-vinculación a requisito
  → P2-04 contradicciones (sobre el expediente)
  → P2-05 resumen incremental
  → P2-06 next action
```

### Propiedades de cada etapa

- **Controlada por feature flag**: cada servicio valida su flag con deny-by-default; si la flag está apagada, la etapa se marca como skipped.
- **Idempotente**: cada servicio garantiza idempotencia vía constraint `UNIQUE` o checkpoint interno; reejecutar no duplica resultados.
- **Auditada**: cada etapa registra una fila en `ai_pipeline_runs` con `correlationId`, `taskType`, modelo, `tokensInput`/`tokensOutput`, `latenciaMs`, `confianza` y `estado` (`completed` / `failed`).
- **Resiliente**: un fallo de etapa **no aborta** las siguientes. El error queda observable en `ai_pipeline_runs` con `estado = 'failed'` para que el sistema durable existente (jobs/outbox) lo reprocese.

### Invariantes

- **Sin llamadas externas dentro de transacciones DB**: las llamadas a DeepSeek ocurren fuera de cualquier transacción de negocio; las escrituras de observabilidad (`ai_pipeline_runs`) son independientes.
- **Decisiones humanas prevalecen**: las etapas nunca sobrescriben estados críticos (`aprobada`, `validado`, `corregida`) sin confirmación humana explícita.
- **Kill switch al inicio**: si `sgie.ai.classification` está en kill switch, el orquestador aborta antes de procesar en vano.
- **Autorización primero**: `AccessService.canAccessCase` se valida **ANTES** de leer cualquier dato del expediente.

### Contrato de entrada/salida

Entrada (`OrchestratorInput`):

```ts
{
  documentId, expedienteId, actorId,
  nombreOriginal, tipoMime, textoExtraido,
  flagContext, correlationId?
}
```

Salida (`OrchestratorResult`):

```ts
{
  correlationId, ok, autorizado,
  etapas: [{ etapa, ok, skipped, razon?, refId?, error? }],
  pipelineRunIds: string[]
}
```

## Consecuencias

- **Positivas**:
  - **Trazabilidad completa**: el `correlationId` une todas las etapas de una ejecución y permite reconstruir el flujo end-to-end desde `ai_pipeline_runs`.
  - **Reejecución segura**: la idempotencia por etapa permite reintentar sin duplicados.
  - Las **decisiones humanas** (estados `aprobada`/`validado`) nunca se sobrescriben automáticamente.
  - La **autorización se valida antes** de leer cualquier dato del expediente, evitando filtraciones por orquestación.
- **Negativas**: la resiliencia (no abortar en fallo) puede dejar etapas incompletas que requieren reejecución.
- **Riesgo**: la reejecución depende de que el caller (worker/job existente) la reintente. El orquestador no reintenta por sí mismo; deja el fallo observable para que el motor durable lo reprocese.

## Alternativas descartadas

1. **Cada servicio llamado manualmente desde la UI**: sin trazabilidad unificada ni orden garantizado; el llamador debe conocer dependencias entre etapas (P2-03 necesita el tipo de P2-01). Descartada.
2. **Orquestador con todos los steps ACID en una sola transacción**: las llamadas a DeepSeek son lentas (segundos) y externas, no pueden vivir dentro de una transacción DB sin bloquear conexiones y comprometer la disponibilidad. Descartada.
3. **Saga con compensación distribuida**: overkill para el procesamiento de un solo documento en un solo servicio. No hay múltiples agregados transaccionales distribuidos que coordinar. Descartada por complejidad injustificada.

## Referencias

- Implementación: `lib/sgie/document-automation-orchestrator.ts`
- Servicios encadenados: `clasificacion-documental.ts`, `extraccion-estructurada.ts`, `auto-vinculacion.ts`, `motor-contradicciones.ts`, `resumen-incremental.ts`, `next-action.ts`
- Feature flags: `lib/sgie/feature-flags.ts`
- Autorización: `lib/access-service.ts` (`canAccessCase`)
- Esquema: `ai_pipeline_runs` en `lib/schema.ts`
