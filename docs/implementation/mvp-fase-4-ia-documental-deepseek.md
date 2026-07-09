# Fase 4 MVP — IA documental con DeepSeek V4 Flash

**Fecha:** 9 de julio de 2026
**Base documental:** Fases 1–3 (`docs/implementation/mvp-fase-1*`, `mvp-fase-2*`, `mvp-fase-3*`), auditoría y estudios de `docs/architecture/` y `docs/strategy/`.
**Carácter:** técnico y accionable. IA solo sobre texto ya extraído. **No aprueba jurídicamente, no firma, no cierra expedientes.** Sin OCR real, sin DeepSeek-OCR, sin SEJE, sin tocar la web pública.

---

## 1. Objetivo de la Fase 4

Implementar la capa de IA documental usando DeepSeek V4 Flash para analizar texto extraído previamente (Fase 3). La IA clasifica documentos, extrae campos relevantes, genera resumen, calcula un score compuesto documento-expediente y propone un `suggested_status`. Todo queda trazado, auditable y sujeto a revisión humana. **La IA solo prepara, sugiere y alerta.**

## 2. Qué ya existía (no rehecho)

La capa IA ya estaba implementada sustancialmente:
- `lib/sgie/ia-documental.ts`: `getIaConfig`/`isIaEnabled` (DeepSeek configurable vía `IA_DOCUMENTAL_*`), `iaOutputSchema` (Zod), prompt restrictivo (`buildSystemPrompt`/`buildUserPrompt`), `llamarIaDocumental` (fetch con reintentos/timeout/json_object), `procesarDocumentoConIa` (guarda en `extracciones_ia`/`campos_extraidos`/`alertas`, estados `ia_procesada`/`pendiente_abogado`).
- `lib/sgie/motor-confianza.ts`: score compuesto campo/documento/expediente con evidencias (formato, coincidencia cliente, contradicciones).
- Tablas: `extracciones_ia`, `campos_extraidos`, `validaciones`, `confianza_resultados`, `correcciones_ia`, `sugerencias_ajuste`.
- Enum `job_sgie_tipo`: ya incluía `'ia_extraccion'` (reutilizado para análisis IA).

## 3. Qué se implementó en la Fase 4

### 3.1 Schema (`lib/schema.ts`) y migración 0028
- **Columnas añadidas a `extracciones_ia`**: `suggested_status` (varchar 50), `total_confidence` (integer), `input_hash` (varchar 64), `run_status` (varchar 20, default `completed`). Valores nulleables para no romper filas previas.
- **Enum `auditoria_accion`**: añadidos 9 eventos IA: `ai_analysis_started`, `ai_analysis_completed`, `ai_analysis_failed`, `ai_analysis_skipped_no_text`, `ai_analysis_not_configured`, `ai_suggestion_accepted`, `ai_suggestion_rejected`, `ai_human_review_requested`, `ai_correction_requested`.
- Migración `drizzle/migrations/0028_fase4_ia_documental.sql` + journal idx 28.
- **No se rompen** 0025–0027. **No se toca** `documento_estado` (`suggested_status` es metadata IA, no estado operativo).

### 3.2 Score compuesto documento-expediente (`lib/sgie/ia/score.ts`)
- Función pura `calcularScoreYEstado(input)` → `{ score: 0-100, checks: ValidationCheck[], suggested_status }`.
- 7 dimensiones ponderadas (confianza IA 25%, cliente 15%, identidad/RTN 20%, tipo documental 15%, número judicial 10%, materia 5%, juzgado 10%) + penalizaciones por contradicciones.
- Checks pass/warn/fail/unknown por cada dimensión.
- Reglas: contradicción crítica → `revision_abogado`; identidad esperada ausente → `revision_asistente`; score ≥ 80 sin contradicción → `prevalidado`; score 60–79 → `aceptado_con_advertencia`; score 40–59 → `revision_asistente`; <40 → `revision_abogado`. **Nunca aprueba jurídicamente.**

### 3.3 ia-documental.ts — extensiones
- Tras `llamarIaDocumental` exitoso, calcula score+estado con `calcularScoreYEstado`, guarda `suggested_status`/`total_confidence`/`input_hash`/`run_status` en `extracciones_ia`.
- Llena `validaciones` con los checks (pass/warn/fail/unknown) del score.
- **Idempotencia**: si ya existe run `completed` con mismo `input_hash` (SHA-256 del texto extraído), no reanaliza (audita como `ai_analysis_completed` idempotente).
- **Skip sin texto**: no analiza si texto < 10 chars o estado `ocr_pendiente`/`ilegible` → audita `ai_analysis_skipped_no_text`.
- **Auditoría** `ai_analysis_started`/`completed`/`failed` con `logSgie` (sin texto sensible).
- Helper `_normalizar()` para comparación de nombres cliente vs. extraído.

### 3.4 Integración jobs/cron (`motor-documental.ts`)
- Tras extracción exitosa con texto en `procesarDocumento`: si `isIaEnabled()`, encola job `ia_extraccion`.
- En `procesarJobsPendientes`: jobs `ia_extraccion` → llama a `procesarDocumentoConIa`. Si IA no configurada → `fallarJob`.
- Job hereda `textoExtraido` + `tipoHeuristico`/`confianzaHeuristica` del payload.

### 3.5 Rutas API internas (auth `requireAbogado` + CSRF + rate limit + scope)
- `POST /api/sgie/documentos/[id]/ia/reintentar` — recupera texto por página, crea job IA, audita.
- `POST /api/sgie/documentos/[id]/ia/revision` — body `{decision: aceptar|ignorar|asistente|abogado|correccion}` → actualiza estado operativo (`aprobado`/`pendiente_abogado`/`incorrecto`) + audita evento correspondiente.
- `GET  /api/sgie/documentos/[id]/ia` — runs, campos extraídos (con cita fuente), checks de validación, resumen IA, score, suggested_status.

### 3.6 Panel IA (`components/sgie/ia-documento.tsx`)
- Muestra: tipo sugerido + confianza, resumen IA, score compuesto, checks pass/warn/fail, campos extraídos (con cita fuente) y acciones de revisión humana (reintentar IA, aceptar, enviar a asistente/abogado, pedir corrección, ignorar).
- Integrado en `components/sgie/documento-preview.tsx` (modal de preview). Reutiliza design system. Sin rediseño.

### 3.7 Tests (`tests/sgie-ia-documental.test.ts`, 8 tests)
- Score compuesto: alto→prevalidado, contradicción crítica→abogado, identidad ausente→asistente, score medio→advertencia, score bajo→abogado, checks generados.
- Degradación sin credenciales IA.

## 4. Tablas/campos/migraciones añadidas
- **Columnas nuevas en `extracciones_ia`**: `suggested_status`, `total_confidence`, `input_hash`, `run_status`.
- **Enum**: 9 valores en `auditoria_accion`.
- **Migración 0028**. Sin tablas nuevas (reutilizadas `validaciones`, `campos_extraidos`, `alertas`).

## 5. Proveedor IA elegido
**DeepSeek V4 Flash** (vía `IA_DOCUMENTAL_*`). Cliente compatible con OpenAI SDK (`baseURL`). Configurable; sin credenciales → `isIaEnabled()===false` → degrada sin romper build. El enum `job_sgie_tipo` ya tenía `'ia_extraccion'` (reutilizado).

## 6. Variables necesarias
- `IA_DOCUMENTAL_PROVIDER` (default `'deepseek'`), `IA_DOCUMENTAL_API_KEY`, `IA_DOCUMENTAL_BASE_URL` (default `https://api.deepseek.com/v1`), `IA_DOCUMENTAL_MODEL` (default `'deepseek-chat'`), `IA_DOCUMENTAL_MODE` (default `'heuristic'`; cambiar a `'ai'` para activar DeepSeek), `IA_DOCUMENTAL_TIMEOUT_MS`, `IA_DOCUMENTAL_MAX_RETRIES`.
- `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET` (heredadas).

## 7. Cómo funciona el flujo IA
1. Fase 3 extrae texto por página → `texto_extraido` o `ocr_pendiente`.
2. Si `isIaEnabled()` y hay texto → `procesarDocumento` encola job `ia_extraccion`.
3. Cron `/api/cron/sgie/procesar` → `procesarJobsPendientes` → jobs `ia_extraccion` → `procesarDocumentoConIa`.
4. IA: idempotencia (mismo input_hash → skip) → `llamarIaDocumental` (DeepSeek, JSON Zod) → score compuesto → guardar campos/checks/score/suggested_status → estado `ia_procesada`.
5. Humano abre preview → panel IA → revisa y decide (aceptar/escalar/corrección/ignorar).

## 8. Cómo funciona el score
7 dimensiones ponderadas (confianza IA, cliente, identidad, tipo doc., número judicial, materia, juzgado). Contradicciones penalizan ×0.7. Score 0–100 con umbrales: ≥80 prevalidado, ≥60 advertencia, ≥40 revisión_asistente, <40 revisión_abogado. Contradicción crítica o identidad esperada ausente fuerzan revisión humana inmediatamente.

## 9. Estados sugeridos
`prevalidado`, `aceptado_con_advertencia`, `revision_asistente`, `revision_abogado`, `correccion_cliente`, `rechazado`. **Son metadata IA** (no estado operativo del documento). El humano decide el estado final.

## 10. Eventos de auditoría garantizados
`ai_analysis_started`, `ai_analysis_completed`, `ai_analysis_failed`, `ai_analysis_skipped_no_text`, `ai_analysis_not_configured`, `ai_suggestion_accepted`, `ai_suggestion_rejected`, `ai_human_review_requested`, `ai_correction_requested`. **Sin texto sensible** (solo documentId, expedienteId, provider, model, score, suggestedStatus, runId).

## 11. Resultado de pruebas (9 jul 2026)
| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run lint` | ✅ 0 errores, 0 warnings |
| `npm run test` | ✅ 836 tests, 40 archivos (incluye 8 nuevos de IA) |
| `npm run build` | ✅ build + postbuild correctos |

## 12. git status — alcance de los cambios de Fase 4
Archivos modificados/nuevos **por la Fase 4**:
- Modificados: `lib/schema.ts`, `lib/sgie/ia-documental.ts`, `lib/sgie/motor-documental.ts`, `components/sgie/documento-preview.tsx`, `drizzle/migrations/meta/_journal.json`.
- Nuevos: `lib/sgie/ia/score.ts`, `app/api/sgie/documentos/[id]/ia/` (reintentar, revision, GET), `components/sgie/ia-documento.tsx`, `drizzle/migrations/0028_*.sql`, `tests/sgie-ia-documental.test.ts`.

> **⚠ Aviso:** `git status` muestra otros archivos modificados ajenos a la Fase 4 (`app/api/email/inbound/route.ts`, `lib/email.ts`, `docs/email-resend-operacion.md`) — **son cambios previos, no realizados por esta fase.** Las Fases 1–4 no han modificado `app/(public)/**`.

## 13. Riesgos pendientes
- **Aplicar migraciones 0025–0028 en staging/producción** (`drizzle-kit migrate`) — generadas, no aplicadas.
- **`IA_DOCUMENTAL_API_KEY`** debe configurarse para activar DeepSeek; sin ella, la IA no analiza y se audita `ai_analysis_not_configured` (no rompe build).
- **`CRON_SECRET`** en staging + schedule de Vercel Cron.
- **Coste IA por volumen documental** — cada documento analizado consume tokens; Flash por defecto, Pro solo cuando haga falta.
- **Alucinaciones** — mitigado con prompt restrictivo (prohibido inventar datos legales), JSON validado por Zod, confianza y cita fuente obligatoria en campos críticos.
- **Integración E2E con DeepSeek real** no cubierta por unitarios (depende de credenciales); validar con documentos reales anonimizados.

## 14. Qué queda para Fase 5
- Puerta `case_readiness_checks` completa (expediente completo → "Listo para revisión" definitivo).
- Dashboard abogado orientado a "siguiente expediente" con bandeja de decisión.
- Métricas de autonomía (KPIs) en Admin.

## 15. Criterio — Fase 4 cerrada
**Sí, a nivel de código.** Cumple: documento con texto → análisis IA; sin texto/ocr_pendiente → skipped; DeepSeek no configurado → degrada sin romper build; JSON validado; campos/checks/score/suggested_status guardados; idempotencia; reintento crea nuevo run; humano acepta/ignora/escala; auditoría IA sin texto sensible; análisis no en portal público; sin OCR/DeepSeek-OCR; lint/tsc/test/build verde.

**Pendiente de operación**: aplicar migraciones, configurar `IA_DOCUMENTAL_API_KEY` en staging, programar Vercel Cron, y validar E2E con documentos reales anonimizados.
