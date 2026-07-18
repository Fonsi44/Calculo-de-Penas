# ADR-006: AI router

**Fecha:** 2026-07-18. **Estado:** IMPLEMENTADO.

## Contexto

El SGIE necesita procesar documentos legales con IA: clasificar el tipo de documento, extraer campos estructurados, generar resúmenes y verificar coherencia. No todos los documentos requieren el mismo nivel de procesamiento: un RTN o una identificación se resuelven con reglas simples, mientras que una demanda o un contrato requieren comprensión semántica profunda.

## Decisión

**Implementar un enrutador de IA multi-estrategia** que selecciona el método de procesamiento según el tipo de documento, la complejidad del texto, la configuración y la disponibilidad del proveedor IA.

## Estrategias de enrutamiento

### Prioridades

1. **Deterministic** (`deterministic`): reglas locales sin llamadas externas. Para tipos de documento simples y cuando la IA está deshabilitada.
2. **Heuristic** (`heuristic`): clasificación basada en nombre de archivo, MIME y reglas de texto. Para documentos cortos y modo sin IA.
3. **DeepSeek** (`deepseek`): LLM externo para extracción, resumen y verificación semántica.
4. **DeepSeek Pro** (`deepseek_pro`): modelo más potente para documentos complejos (>2000 caracteres).
5. **Human** (`human`): deriva a revisión humana cuando la confianza heurística es baja.

### Árbol de decisión

```
routingDecision(tarea, contexto)
  │
  ├─ 1. Estrategia base desde configuración (strategyByTask)
  │     classification → heuristic (default)
  │     extraction     → deepseek (default)
  │     summary        → deepseek (default)
  │     verification   → deepseek (default)
  │
  ├─ 2. ¿Documento simple (identidad, RTN, comprobante)?
  │     └─ Sí → deterministic (override)
  │
  ├─ 3. ¿Texto muy corto (<200 chars) y estrategia deepseek?
  │     └─ Sí → heuristic (texto insuficiente para LLM)
  │
  ├─ 4. ¿Complejidad alta (>2000 chars)?
  │     └─ Sí → deepseek_pro (modelo más potente)
  │
  ├─ 5. ¿IA deshabilitada?
  │     └─ Sí → deterministic o heuristic según modo
  │
  └─ 6. ¿Requiere revisión humana?
        └─ Estrategia human → sí
        └─ deepseek + confianza heurística < threshold → sí
```

### Modos de operación

| `DOCUMENT_AI_MODE` | Comportamiento |
|--------------------|----------------|
| (vacío / no configurado) | Modo híbrido: clasificación heurística, extracción/summary/verificación con DeepSeek |
| `ai` | Todas las tareas usan DeepSeek directamente |
| `disabled` | Todas las tareas son determinísticas. Sin llamadas externas. |

## Por qué no single-model approach

| Factor | Multi-estrategia | Solo LLM | Solo reglas |
|--------|-----------------|----------|-------------|
| Costo | Bajo (solo documentos complejos van a LLM) | Alto (todos los documentos) | Cero |
| Velocidad | Rápido (documentos simples van a reglas) | Lento (todos esperan LLM) | Rápido |
| Precisión semántica | Alta (complejos con LLM) | Alta | Baja (no entiende contexto) |
| Privacidad | Documentos simples nunca salen del servidor | Todos salen | 100% local |
| Mantenimiento | Dos sistemas | Un modelo a actualizar | Reglas a mantener |

La combinación permite procesar documentos simples (identificación, RTN) sin costo ni latencia de LLM, mientras que los documentos complejos (demandas, contratos) reciben análisis semántico completo.

## Revisión humana

Cuando un resultado de IA tiene confianza baja (<65%, configurable vía `DOCUMENT_AI_HUMAN_REVIEW_THRESHOLD`), se marca con `requiereRevisionHumana: true`.

El flujo de revisión:
1. `ejecutarTarea()` completa y marca revisión requerida.
2. `obtenerTareasPendientesRevision()` lista tareas para revisión.
3. `revisarTarea(taskId, decision, revisorId)` permite:
   - `approved` → tarea aceptada
   - `rejected` → tarea rechazada
   - `corrected` → tarea aceptada con correcciones

Toda revisión queda registrada en `ai_task_routing` con revisor, fecha y comentario.

### Por qué revisión humana obligatoria para documentos legales

Los documentos legales (contratos, demandas, escrituras) tienen consecuencias jurídicas. Un error de clasificación o extracción puede afectar el curso de un caso. La revisión humana no es opcional: es un requisito del dominio. El AI router lo garantiza mediante:
- Umbral de confianza que deriva a revisión si es bajo.
- `tipoDocumento` sensible que fuerza `deterministic` (identidad, RTN).
- Modo `human` como estrategia explícita.

## Registro y trazabilidad

Cada tarea IA se registra en `ai_task_routing` con:
- `documento_id`, `task_type`, `proveedor_asignado`, `modelo`
- `payload` (contexto de entrada)
- `resultado` (salida del procesamiento)
- `error` (si falló)
- `revisado_por` y `revisado_en` (si fue revisado)

Además, cada evento (`ai_task_routed`, `ai_task_completed`, `ai_task_reviewed`) se registra en `logSgie` para auditoría.

## Consecuencias

- **Positivas**: procesamiento proporcionado al costo del documento, privacidad maximizada (solo documentos complejos van a LLM), sin vendor lock-in (DeepSeek es intercambiable), revisión humana como capa de seguridad jurídica.
- **Negativas**: dos estrategias que mantener (reglas heurísticas + prompts LLM). La decisión de enrutamiento no es configurable por expediente (solo global vía variables de entorno).
- **Riesgo**: si DeepSeek está caído, los documentos complejos degradan a heurístico. Mitigado con el modo `disabled` que fuerza deterministic y evita dependencia externa.

## Referencias

- Implementación: `lib/sgie/ia-router.ts`
- Cliente IA: `lib/sgie/ia-documental.ts`
- Clasificación heurística: `lib/sgie/motor-documental.ts`
- Esquema: `drizzle/migrations/0035_fase2_documents_ocr_ai.sql`
- Variables de entorno: `DOCUMENT_AI_MODE`, `DOCUMENT_AI_PRO_MODEL`, `DOCUMENT_AI_HUMAN_REVIEW_THRESHOLD`, `DOCUMENT_AI_VERSION_PROMPT`
