# Fase 5 MVP — puerta "Listo para revisión", dashboard abogado y métricas de autonomía

**Fecha:** 9 de julio de 2026 · **Documentos base:** Fases 1–4, auditoría y estrategia SGIE.
**Carácter:** técnico y accionable. Cierra el MVP funcional del SGIE semi-autónomo. Sin aprobación jurídica, sin firma, sin SEJE.

---

## 1. Objetivo de la Fase 5

Cerrar el MVP funcional del SGIE semi-autónomo implementando la **puerta de calidad "Listo para revisión"**: SGIE evalúa determinísticamente si un expediente está documentalmente preparado para revisión humana mediante ~8 checks auditables (cliente, checklist, documentos, IA, bloqueo, OCR, resumen, auditoría). Si todos los checks blocking pasan, el expediente avanza automáticamente a `listo_para_revision` y aparece en la bandeja del abogado. El abogado puede aprobar la revisión documental, devolver el expediente por documentación incompleta o pedir información adicional al cliente. Métricas de autonomía visibles en SGIE.

## 2. Qué ya existía (no rehecho)

- Cockpit avanzado (`/api/sgie/cockpit/avanzado`) con métricas de tendencias, tareas vencidas, cuellos de botella.
- Vista de detalle de expediente con checklist, documentos, enlaces, seguimiento, extracción e IA.
- `transicionPermitida` con control de estados críticos (sistema no avanza a `validado`, `pendiente_de_firma`, `finalizado`, `archivado`).
- `validaciones` ya recibían checks por documento desde Fase 4. Readiness los consolida a nivel expediente.

## 3. Qué se implementó en la Fase 5

### 3.1 Schema y migración 0029
- **Tabla `case_readiness_runs`**: agrupa cada evaluación de preparación (expediente_id, estado_final, score, checks_total/pass/warn/fail, iniciado_por, created_at).
- **Tabla `case_readiness_checks`**: un check individual por evaluación (check_name, status pass/warn/fail/unknown, source, blocking, reason, resolved_at/by). Unique por (run_id, check_name).
- **Enum `expediente_estado`**: añadidos `'listo_para_revision'` (preparación documental completa, distinto de `pendiente_validacion_abogado` que es validación jurídica) y `'devuelto_por_abogado'`.
- **Enum `auditoria_accion`**: añadidos `readiness_evaluation_completed`, `case_ready_for_review`, `case_returned_by_lawyer`, `case_documental_review_approved`, `case_additional_info_requested`.
- `estados.ts`: labels de los nuevos estados.
- `transicionPermitida`: nuevas transiciones `documentos_completos → listo_para_revision` (sistema), `listo_para_revision → pendiente_validacion_abogado | devuelto_por_abogado` (abogado), `devuelto_por_abogado → pendiente_de_documentos` (abogado), `bloqueado_por_cliente → pendiente_de_documentos`.

### 3.2 Motor de preparación (`lib/sgie/readiness.ts`)
- `evaluarPreparacionExpediente(expedienteId)`: recorre 8 checks, determina estado_final, guarda run + checks, si todo pass → `cambiarEstadoExpediente(id, 'listo_para_revision', sistema)`, audita `case_ready_for_review` + `readiness_evaluation_completed`.
- 8 checks: cliente_verificado (blocking), checklist_obligatorio_completo (blocking), documentos_obligatorios_recibidos (blocking), sin_contradicciones_criticas (blocking, fuente IA/validaciones), expediente_no_bloqueado (blocking), sin_documentos_ocr_ilegible (no blocking), resumen_disponible (no blocking), auditoria_completa (no blocking).
- `calcularEstadoFinal`: todos blocking pass → `listo_para_revision`; algún fail blocking → `requiere_accion_abogado` (contradicción o docs pendientes) o `no_preparado`; bloqueado → `bloqueado_por_cliente`; solo warns → `preparado_con_advertencias`.
- **Idempotencia**: no recalcula si hay un run de los últimos 5 minutos.
- `recalcularReadinessSiProcede(expedienteId)`: ligero, no bloquea el flujo principal.

### 3.3 Integración con eventos (llamadas ligeras)
Añadido `recalcularReadinessSiProcede` en: `vincularDocumentoARequisitoOnUpload` (Fase 2), `procesarDocumento` tras extracción (Fase 3), `procesarDocumentoConIa` tras IA (Fase 4). No bloquean el flujo si fallan.

### 3.4 Rutas API (auth requireAbogado + CSRF + rate limit + scope)
- `GET /api/sgie/expedientes/[id]/readiness` — último run + checks.
- `POST .../readiness/recalcular` — fuerza evaluación. Audita.
- `POST .../readiness/aprobar` — abogado aprueba revisión documental → `pendiente_validacion_abogado`. Audita `case_documental_review_approved`.
- `POST .../readiness/devolver` — abogado devuelve → `devuelto_por_abogado` + motivo. Audita `case_returned_by_lawyer`.
- `POST .../readiness/pedir-info` — envía solicitud al cliente (Resend). Audita `case_additional_info_requested`.
- `GET /api/sgie/metricas/autonomia` — KPIs: listos_para_revision, bloqueados, docs_completos, docs_faltantes, devueltos, recordatorios, docs con IA completada.

### 3.5 Panel readiness UI (`components/sgie/readiness-expediente.tsx`)
Integrado en `app/intranet/sgie/expedientes/[id]/page.tsx`. Muestra score, checks pass/warn/fail con icono y motivo, estado_final, y botones de acción (recalcular, aprobar revisión documental, devolver, pedir información). Reutiliza design system.

### 3.6 Tests (`tests/sgie-readiness.test.ts`, 12 tests tras auditoría)
Motor de readiness (función pura): todos pass → listo, fail blocking → no_preparado, bloqueado → bloqueado_por_cliente, contradicción → requiere_accion_abogado, warns solo → preparado_con_advertencias, warn no blocking no bloquea, fail no blocking no bloquea.

## 4. Tablas/campos/migraciones añadidas
- **Tablas nuevas**: `case_readiness_runs`, `case_readiness_checks`.
- **Enum**: 2 estados en `expediente_estado`, 5 eventos en `auditoria_accion`.
- **Migración 0029**. No rompe 0025–0028.

## 5. Rutas añadidas
- `GET/POST` en `/api/sgie/expedientes/[id]/readiness/*` (readiness, recalcular, aprobar, devolver, pedir-info).
- `GET /api/sgie/metricas/autonomia`.

## 6. Checks implementados
8 checks: `cliente_verificado`, `checklist_obligatorio_completo`, `documentos_obligatorios_recibidos`, `sin_contradicciones_criticas`, `expediente_no_bloqueado`, `sin_documentos_ocr_ilegible`, `resumen_disponible`, `auditoria_completa`. Fuentes: checklist, document, ai, extraction, system. Blocking: los 5 primeros.

## 7. Reglas de readiness
- Faltante obligatorio → fail blocking → bloquea.
- Bloqueado por cliente → bloquea.
- Contradicción crítica IA → fail blocking → requiere_accion_abogado.
- Solo warns → preparado_con_advertencias (requiere acción humana para avanzar).
- Todos blocking pass → listo_para_revision (avance automático a la bandeja).
- El sistema solo avanza a `listo_para_revision` (no crítico); el abogado avanza a `pendiente_validacion_abogado` y más allá.

## 8. Dashboard/bandeja
Panel `ReadinessExpediente` en la ficha del expediente. Bandeja visible en el cockpit avanzado (extensible). El abogado ve expedientes `listo_para_revision` y puede aprobar revisión documental o devolver.

## 9. Métricas implementadas
`GET /api/sgie/metricas/autonomia`: listos_para_revision, bloqueados_por_cliente, documentos_completos, documentos_faltantes, expedientes_devueltos, recordatorios_enviados, docs_con_ia_completada.

## 10. Eventos de auditoría garantizados
`readiness_evaluation_completed`, `case_ready_for_review`, `case_returned_by_lawyer`, `case_documental_review_approved`, `case_additional_info_requested`. Sin texto sensible (solo expedienteId, runId, score, checks).

## 11. Resultado de pruebas (9 jul 2026)
| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run lint` | ✅ 0 errores, 6 warnings preexistentes |
| `npm run test` | ✅ 861 tests, 42 archivos (incluye 12 de readiness, +4 tras auditoría) |
| `npm run build` | ✅ build + postbuild correctos |

## 12. git status
La web pública permanece intacta (`app/(public)` sin cambios de las Fases 1–5). Archivos modificados ajenos (SEO audit, email) son cambios previos al trabajo de estas fases.

## 12. Auditoría de la Fase 5 — política de `unknown` y cierre para staging

**Fecha de auditoría:** 9 de julio de 2026 · **Hallazgo:** bug real (no solo ambigüedad documental).

### 12.1 Bugs detectados y corregidos

1. **`sin_contradicciones_criticas` devolvía `pass` cuando IA no había corrido.** La query contaba validaciones críticas en la tabla `validaciones`. Si IA no estaba configurada, no había filas → `count=0` → `pass` falsamente. **Corrección:** antes de contar validaciones, se verifica si la IA ha analizado al menos un documento del expediente (`extracciones_ia JOIN documentos_expediente`). Si no → el check queda `unknown` (no `pass`).

2. **`calcularEstadoFinal` no manejaba `unknown` en checks blocking.** El filtro solo capturaba `fail` y `warn`. Un `unknown` blocking pasaba desapercibido, reduciendo solo el `passCount`. Con 7 `pass` + 1 `unknown` blocking, el `passCount` era 7 ≥ 6 → `listo_para_revision` incorrectamente. **Corrección:** añadido `unknownBlocking` filter; si algún check blocking está `unknown` → estado final `requiere_accion_abogado` (bloquea `listo_para_revision`).

3. **`resumen_disponible` no estaba scoped al expediente.** La query consultaba `extracciones_ia` sin filtrar por documento del expediente, pudiendo dar `pass` si cualquier expediente tenía IA. **Corrección:** inner join con `documentos_expediente` filtrado por `expediente_id`. El check es `blocking: false` (no bloquea por sí solo).

### 12.2 Política final de `unknown`

| Contexto | `unknown` en check blocking | `unknown` en check non-blocking |
|---|---|---|
| IA no configurada | `sin_contradicciones_criticas` → unknown **blocking** → bloquea `listo_para_revision` → `requiere_accion_abogado` | `resumen_disponible` → unknown non-blocking → no bloquea por sí solo |
| OCR no configurado | `sin_documentos_ocr_ilegible` → warn (si hay docs `ocr_pendiente`) o pass (si no hay). **No** es unknown; el check detecta correctamente el estado. | — |
| Sin datos para evaluar | Cualquier check blocking sin datos (ej. checklist vacío) → `warn` o `fail`, no `unknown`. `unknown` se reserva para cuando la fuente de evaluación (IA) no está disponible. | — |

**Regla general:** `unknown` en un check `blocking=true` **siempre bloquea** `listo_para_revision` y requiere acción humana (`requiere_accion_abogado`). Solo se puede avanzar si un humano justifica la advertencia o marca el check como resuelto manualmente.

### 12.3 Comportamiento si IA no está configurada

- `sin_contradicciones_criticas` (blocking) → **`unknown`** → bloquea `listo_para_revision`.
- `resumen_disponible` (non-blocking) → **`unknown`** → no bloquea por sí solo.
- Resultado: el expediente queda en `requiere_accion_abogado` (no pasa a `listo_para_revision` automáticamente). El abogado debe revisar manualmente los documentos o configurar la IA.

### 12.4 Comportamiento si OCR no está configurado

- `sin_documentos_ocr_ilegible` (non-blocking) → si hay documentos `ocr_pendiente`, es `warn`; si no, `pass`. No genera `unknown` (el check evalúa correctamente el estado de los documentos, independientemente de si el OCR está configurado).
- No bloquea `listo_para_revision` por sí solo, pero el `warn` es visible en el panel de readiness para que el abogado decida.

### 12.5 Por qué esto evita falsos "Listo para revisión"

Antes de la corrección: IA no configurada → `sin_contradicciones_criticas = pass` (falso) + resto de checks pass → `listo_para_revision` (falso positivo). El abogado recibía un expediente como "listo" sin que se hubiera verificado la ausencia de contradicciones.

Después de la corrección: IA no configurada → `sin_contradicciones_criticas = unknown` (blocking) → `requiere_accion_abogado`. El expediente **no** aparece como "listo" hasta que el abogado revise o se active la IA.

### 12.6 Tests añadidos/corregidos

4 tests nuevos (de 8 a 12) en `tests/sgie-readiness.test.ts`:
- `unknown` en check blocking → `requiere_accion_abogado` **bloquea** `listo_para_revision`.
- Dos `unknown` blocking → sigue bloqueando.
- `unknown` non-blocking → **no** bloquea.
- IA no configurada → `sin_contradicciones_criticas` unknown → bloquea.

Actualizada la función `calcularEstadoFinal` del test para reflejar el manejo de `unknown` blocking (coincide con el algoritmo de `readiness.ts`).

---

## 13. Riesgos pendientes
- **Aplicar migraciones 0025–0029** en staging/producción (`drizzle-kit migrate`).
- **Configurar `CRON_SECRET`** + programar Vercel Cron para readiness + recordatorios.
- **Readiness depende de datos de checklist/validaciones/IA** — si alguna capa previa no está configurada (ej. IA), algunos checks quedan unknown (no bloquean).
- **Scope de métricas**: las métricas actuales son globales (admin); el scope por abogado requiere mejora post-MVP.

## 14. Cierre global del MVP SGIE semi-autónomo

El MVP funcional del SGIE semi-autónomo queda **cerrado a nivel de código** tras las 5 fases + auditoría de readiness:

| Fase | Capa | Estado |
|---|---|---|
| 1 | Magic links + upload seguro + Blob + auditoría | ✅ cerrada |
| 2 | Seguimiento documental + recordatorios + bloqueo por cliente | ✅ cerrada |
| 3 | Extracción documental + texto por página + OCR stub + revisión asistente | ✅ cerrada |
| 4 | IA documental (DeepSeek V4 Flash): clasificación, extracción, score, suggested_status | ✅ cerrada |
| 5 | Puerta "Listo para revisión": readiness checks, bandeja abogado, métricas de autonomía | ✅ cerrada |

**El flujo completo:** upload seguro (F1) → seguimiento y recordatorios (F2) → extracción de texto (F3) → análisis IA con score (F4) → puerta de calidad readiness y bandeja del abogado (F5). El abogado recibe expedientes documentalmente preparados, revisa, aprueba la revisión documental o devuelve. **La decisión jurídica final sigue siendo humana.**

**Pendiente global de operación**: aplicar las 5 migraciones, configurar las variables de entorno en staging, programar Vercel Cron, y validar E2E con documentos reales anonimizados.

**No se ha hecho commit ni push** (R7/R10). No se implementó aprobación jurídica, firma, cierre automático, SEJE ni retención automatizada.
