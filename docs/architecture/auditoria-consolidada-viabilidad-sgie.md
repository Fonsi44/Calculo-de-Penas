---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Auditoría consolidada de viabilidad SGIE semi-autónomo

**Fecha:** 9 de julio de 2026
**Documentos auditados:**
- `docs/strategy/plan-maestro-mejora-sgie-admin-integracion.md` (visión funcional)
- `docs/strategy/especializacion-sgie-honduras-abogados.md` (especialización jurídica)
- `docs/architecture/estudio-tecnico-viabilidad-sgie-autonomo.md` (arquitectura técnica)

**Tipo de documento:** Auditoría crítica de viabilidad funcional, jurídica-operativa y técnica. No implementa código, no modifica la web pública, no asume integración SEJE ni capacidad jurídica de la IA.
**Carácter:** crítico, concreto y accionable. Esta auditoría señala contradicciones y huecos también en los documentos que evalúa.

---

## 0. Respuestas directas a las 9 preguntas

| # | Pregunta | Respuesta corta |
|---|---|---|
| 1 | ¿Es viable el proyecto? | **Sí, con ajustes.** La base técnica lo soporta; faltan 3 piezas clave (modelo de datos SGIE, cola de jobs, OCR). |
| 2 | ¿Qué es viable ahora? | Frontend/API, BD de metadatos, emails (Resend), almacenamiento (Blob), auth/permisos base, extracción de PDF digital. |
| 3 | ¿Qué requiere decisiones técnicas? | Modelo IA final, proveedor de cola, OCR, Blob vs S3 vs R2, umbrales de confianza, antivirus. |
| 4 | ¿Qué no entra en MVP? | Integración SEJE/fuentes oficiales, retención documental automatizada, OTP avanzado, IA de verificación de alta confianza. |
| 5 | ¿DeepSeek V4 Flash sirve como OCR? | **No.** No es OCR. Analiza texto **ya extraído**. El PDF escaneado/foto requiere OCR externo. |
| 6 | ¿Arquitectura MVP? | Vercel+Next.js, Neon+Drizzle, Vercel Blob, Resend, **cola Inngest (recomendada por defecto)**, OCR externo a validar, DeepSeek V4 Flash (texto), pgvector. |
| 7 | ¿Riesgos de falsos “Listo para revisión”? | OCR defectuoso, IA alucinada, documento de otro expediente, checklist mal configurado, umbral de confianza bajo. |
| 8 | ¿Mejoras a los documentos? | Ver sección 2 (evaluación por documento) y sección 13 (recomendaciones). |
| 9 | ¿Roadmap? | 5 fases MVP (sección 11) alineadas con T1–T10 del estudio técnico. |

---

## 1. Veredicto general

**Viable con ajustes.**

- **Viable:** la base stack (Next.js/Vercel, Neon+Drizzle+pgvector, Blob, Resend, auth existente) cubre la mayoría del SGIE semi-autónomo.
- **Viable con ajustes:** RBAC por expediente, auditoría de acciones críticas, Vercel Blob en producción.
- **Requiere decisiones técnicas:** modelo IA final (DeepSeek V4 Flash: nombre/disponibilidad/coste no confirmados), cola duradera, OCR, umbrales de confianza, antivirus.
- **No recomendable en MVP:** integración automática con SEJE/fuentes oficiales, retención documental automatizada (pendiente de aprobación legal), OTP sofisticado, verificación IA de alta confianza sin supervisión.

### 1.1 Pendientes críticos (bloqueantes para producción)

1. **Confirmar el modelo IA real** (DeepSeek V4 Flash existe como tal, con ese nombre y coste — no confirmado).
2. **Elegir y validar OCR** (no existe hoy; sin OCR no hay autonomía sobre escaneos).
3. **Definir el modelo de datos SGIE** (no hay tablas operativas hoy).
4. **Elegir cola duradera** (Vercel Cron no basta para lo pesado).
5. **Validar jurídica/técnicamente SEJE** antes de cualquier acercamiento (mientras tanto, solo referencia manual).

---

## 2. Evaluación de los tres documentos

### 2.1 Plan maestro SGIE + Admin + Integración

- **Qué está bien:** visión de SGIE semi-autónomo bien articulada (Niveles 0–4), reparto de papeles claro (SGIE motor / Admin gobierno / abogado revisor), definición de “expediente completo”, KPIs de autonomía, aislamiento explícito de la web pública.
- **Qué falta:** el plan es funcional y **no define la máquina de estados técnica** ni la puerta de calidad formal (la auditoría la añade en sección 6). Tampoco cuantifica umbrales de confianza.
- **Qué debería reforzarse:** el Nivel 3 (meta funcional) asume que SGIE puede decidir “Listo para revisión” de forma fiable; el plan no detalla **qué evita los falsos positivos** (la auditoría lo trata en sección 7).
- **Contradicciones/huecos:** el plan menciona “documentos revisados o prevalidables” como criterio de expediente completo, pero no define **quién o qué decide el umbral de prevalidación**. Ese vacío se resuelve en esta auditoría con `case_readiness_checks` (sección 6).

### 2.2 Especialización SGIE Honduras

- **Qué está bien:** especialización por materia, ficha judicial, separación estado SGIE vs judicial, control de plazos con plazo interno, marcado masivo de “Pendiente de validación por abogado hondureño” (44 referencias — honestidad alta).
- **Qué falta:** los checklists son **listas abiertas sin cierre legal**; no hay evidencia de que un abogado hondureño los haya validado. Es correcto marcarlos pendientes, pero el MVP **no puede depender de ellos** hasta esa validación.
- **Qué debería reforzarse:** definir una **versión mínima validable** del checklist por materia (lo justo para arrancar) en lugar de listas extensas sin confirmar.
- **Contradicciones/huecos:** la sección de plazos dice “los cálculos de plazos legales requieren validación humana”, pero el flujo automático de recordatorios **asume fechas introducidas**. Hay que dejar más claro que **SGIE nunca computa plazos legales**, solo programa recordatorios sobre fechas que el humano introduce.

### 2.3 Estudio técnico de viabilidad

- **Qué está bien:** fundamentado en inspección real del repo (67 tablas Drizzle, RAG existente, ausencias de cola/OCR/SGIE tables), clasificación honesta viable/ajustes/validar/no-MVP, modelo de datos propuesto, riesgos técnicos detallados.
- **Qué falta:** **no recomienda una cola por defecto** (deja Inngest/QStash/Trigger.dev abiertos); la auditoría cierra esa decisión (sección 4). Tampoco formaliza la **puerta de calidad “Listo para revisión”** como entidad.
- **Qué debería reforzarse:** el modelo de datos propuesto (21 entidades) **omite tablas de seguridad y trazabilidad** críticas (scan de malware, idempotencia, evidencia de IA, intentos de job). La auditoría las añade en sección 8.
- **Contradicciones/huecos:** el estudio dice “DeepSeek V4 Flash para análisis de texto extraído” pero **no cierra explícitamente** que DeepSeek V4 Flash **no es OCR**. La ambigüedad puede llevar a confusión operativa. La auditoría lo zanja en sección 3.

### 2.4 Contradicciones entre documentos

- **OCR:** el estudio técnico lo trata como componente a elegir; la especialización Honduras no lo menciona. Si se asume implícitamente que la IA “lee” el documento, se mezcla extracción de texto con análisis. **Resuelto en sección 3.**
- **Autonomía vs validación:** el plan maestro promueve Nivel 3 (SGIE decide “Listo para revisión”); la especialización Honduras marca todo legal “Pendiente de validar”. La tensión se resuelve así: la **autonomía es de preparación documental, no jurídica**. SGIE prepara; el abogado valida lo jurídico.
- **Web pública:** los tres coinciden en aislarla — consistente, sin contradicción.

---

## 3. DeepSeek V4 Flash y OCR

**Decisión clave (no negociable):**

- **DeepSeek V4 Flash NO debe tratarse como OCR principal.** Es un modelo de lenguaje: analiza texto **ya extraído**, no reconoce píxeles de un escaneo.
- DeepSeek V4 Flash debe operar **solo sobre texto extraído** previamente.
- **PDF digital** (con capa de texto): extracción con `pdfjs-dist` (ya presente en el repo).
- **PDF escaneado / foto**: requiere **OCR externo** (componente a validar: Tesseract on-prem o servicio cloud).
- **DeepSeek-OCR** es un **modelo distinto** de DeepSeek V4 Flash y **no debe asumirse como parte directa del MVP serverless** (coste, latencia, disponibilidad y acoplamiento a evaluar).
- Toda salida de IA (sea Flash, Pro u OCR-asistida) requiere **confianza, fuentes y trazabilidad**.

### 3.1 Regla de arquitectura

El pipeline siempre es: **extracción de texto (pdfjs u OCR) → normalización → análisis IA (DeepSeek V4 Flash)**. Nunca se invierte el orden ni se salta la extracción. Si la extracción falla o es de baja calidad, el documento se marca `requiere_revision_humana`, **nunca** se analiza sobre vacío.

---

## 4. Arquitectura MVP recomendada

**Decisión por defecto (con justificación):**

| Capa | Elección MVP | Justificación |
|---|---|---|
| Frontend/API | **Vercel + Next.js 16** | Ya desplegado, serverless, App Router. |
| BD metadatos | **Neon + Drizzle** | Ya integrado, pgvector disponible, migraciones con `drizzle-kit`. |
| Almacenamiento | **Vercel Blob para MVP** | Ya integrado (`@vercel/blob`); reevaluar a S3/R2 si el coste/volumen lo exige. |
| Emails | **Resend** | Ya integrado, buena entregabilidad con dominio verificado. |
| Cola duradera | **Inngest (recomendada por defecto)** | Integración nativa con Next.js/Vercel, reintentos, cron, DLQ y panel incluidos; menor fricción que QStash/Trigger.dev para este stack. **Validar en T5.** |
| OCR externo | **A validar** (propuesta: servicio cloud para MVP por calidad en español; Tesseract como fallback on-prem) | Sin OCR no hay autonomía sobre escaneos. |
| IA texto | **DeepSeek V4 Flash** | Vía cliente `openai` compatible (`baseURL`). **Confirmar modelo/coste.** |
| Vectorial/RAG | **pgvector** (ya presente) | Para recuperación de contexto del expediente y corpus jurídico. |

**Por qué Inngest por defecto:** encaja con Next.js/Vercel sin infra adicional, cubre jobs inmediatos, diferidos y recurrentes con reintentos y DLQ, y expone un panel de observabilidad. QStash y Trigger.dev son alternativas válidas; la decisión final se valida en la fase de jobs, pero **Inngest es la opción por defecto** para no paralizar el inicio.

---

## 5. Flujo técnico final recomendado

Orden estricto (con punto de control de calidad):

1. **Creación de expediente** (Neon: `cases` + tipo + responsable).
2. **Generación de checklist** (Admin → `case_checklists` aplicado al tipo).
3. **Magic link** (token seguro, **hash** en Neon, scope por expediente).
4. **Upload del cliente** (portal aislado, validación tipo/tamaño, rate limit).
5. **Almacenamiento Blob** (signed URL de escritura; **nunca** binario en Neon).
6. **Registro en Neon** (`documents`: metadatos, hash, URL interna).
7. **Escaneo malware** (`file_scan_results`; estado `quarantined` si falla — **no procesar hasta confirmar limpio**).
8. **Extracción de texto** (`pdfjs-dist` para PDF digital).
9. **OCR si aplica** (escaneado/foto → OCR externo; fallback a revisión humana si baja calidad).
10. **Análisis DeepSeek V4 Flash** (sobre texto extraído; registro en `ai_runs`).
11. **Verificación documento-expediente** (matriz de la sección 7).
12. **Score compuesto** de confianza.
13. **Estado sugerido** (prevalidado / advertencia / revisión / corrección / rechazo).
14. **Auditoría** (registro inmutable de la decisión y sus evidencias).
15. **Recordatorios** (jobs recurrentes sobre fechas introducidas; **SGIE no computa plazos legales**).
16. **Listo para revisión** (solo si la puerta de calidad de la sección 6 pasa todos los checks).

---

## 6. Puerta de calidad “Listo para revisión”

Entidad propuesta: **`case_readiness_checks`**. Un expediente solo se marca “Listo para revisión” cuando **todos** los checks están en estado `pass`. Cualquier `fail` o `warn` no resuelto bloquea la marca y escala según la regla.

| Check | Descripción | Estado posible |
|---|---|---|
| `cliente_verificado` | cliente existe y datos básicos completos | pass / fail |
| `identidad_rtn_coincide` | identidad/RTN del documento coincide con el cliente | pass / warn / fail |
| `checklist_obligatorio_completo` | todos los ítems obligatorios recibidos | pass / fail |
| `documentos_legibles` | ningún documento marcado como ilegible | pass / fail |
| `documentos_clasificados` | todos los documentos tienen tipo asignado | pass / fail |
| `sin_contradicciones_criticas` | no hay contradicciones críticas detectadas | pass / warn / fail |
| `plazos_audiencias_registrados` | fechas clave introducidas | pass / fail |
| `resumen_generado` | resumen del expediente disponible con confianza | pass / fail |
| `documentos_dudosos_resueltos` | no hay documentos dudosos pendientes | pass / warn / fail |
| `confianza_minima_alcanzada` | score compuesto ≥ umbral de Admin | pass / fail |
| `auditoria_completa` | trazabilidad completa del expediente | pass / fail |

### 6.1 Regla de puerta

- **Todo `pass` → `listo_para_revision`** (entra en la bandeja del abogado).
- **Algún `warn`** → sigue en preparación; el warn debe revisarse o justificarse explícitamente.
- **Algún `fail`** → **no puede** marcarse listo; se queda en `requiere_revision_humana` o `devuelto`.

Esta entidad convierte el criterio subjetivo del plan maestro en un **control determinista y auditable**.

---

## 7. Verificación documento-expediente

Score compuesto que combina coincidencias y confianza. Cada dimensión aporta un peso (definido y ajustable en Admin).

| Dimensión | Origen |
|---|---|
| coincidencia cliente | `clients` vs extracción |
| coincidencia identidad/RTN | `clients` vs extracción |
| coincidencia tipo documental | `checklist_items` vs clasificación IA |
| coincidencia número expediente judicial | ficha judicial vs texto |
| materia | `case_types` vs inferencia |
| partes | `cases` vs nombres detectados |
| juzgado | ficha judicial vs texto |
| fecha | fecha detectada vs esperada |
| confianza OCR | score del OCR (si aplicó) |
| confianza IA | score del modelo |
| contradicciones | detección IA (penalización) |

### 7.1 Resultados posibles

| Resultado | Condición | Acción |
|---|---|---|
| **prevalidado** | score ≥ umbral alto, sin contradicciones | avanza sin intervención |
| **aceptado con advertencia** | score medio o warn menor | avanza con marca visible |
| **revisión asistente** | duda operativa, no jurídica | tarea al asistente |
| **revisión abogado** | contradicción o decisión jurídica | bandeja del abogado |
| **corrección cliente** | ilegible o claramente erróneo | email de corrección |
| **rechazado** | no corresponde al expediente | descarte + registro |

---

## 8. Modelo de datos adicional recomendado

Entidades que el estudio técnico omitió y esta auditoría añade (sobre las 21 ya propuestas):

| Entidad | Propósito | Justificación |
|---|---|---|
| `document_versions` | versiones de un documento | reemplazos y trazabilidad |
| `document_ocr_pages` | texto OCR por página | evidencia y reanálisis sin re-OCR |
| `document_validation_checks` | checks de verificación documento-expediente | soporte de la sección 7 |
| `case_readiness_checks` | puerta de calidad “Listo para revisión” | sección 6 |
| `file_scan_results` | resultado del escaneo malware | estado `quarantined` |
| `idempotency_keys` | claves de idempotencia por operación | evitar duplicados (jobs, uploads) |
| `job_attempts` | intentos de cada job | observabilidad y DLQ |
| `ai_prompt_versions` | versiones de prompts | trazabilidad y reproducibilidad |
| `ai_output_evidence` | evidencia (fuentes) de cada salida IA | auditoría de IA |
| `case_events` | eventos de la bitácora (amplía timeline) | historia inmutable del expediente |
| `client_upload_sessions` | sesiones de subida del cliente | rate limit y control de abuso |

> **Nota:** estas se suman a las del estudio técnico (sección 15). La fuente de verdad final del schema es `lib/schema.ts` (R2); este listado es propuesta para la fase de modelo de datos.

---

## 9. Seguridad

Refuerzo de los controles (algunos ya en el estudio técnico, otros añadidos):

- **magic links con hash** (nunca token en claro);
- **expiración** por tipo de expediente;
- **revocación** explícita;
- **límite de usos** con decremento atómico;
- **rate limit** por token y por IP (subida masiva);
- **signed URLs** cortas para upload/download;
- **escaneo malware** antes de procesar;
- **estado `quarantined`** para archivos sospechosos (no accesibles hasta resolución);
- **permisos por expediente** (no solo por módulo);
- **auditoría append-only** (eventos críticos inmutables);
- **no URLs permanentes públicas** (todo efímero y autorizado);
- **OTP opcional** para casos sensibles (familia, penal).

---

## 10. Jobs

| Tipo | Ejemplos | Medio |
|---|---|---|
| **inmediatos** | pipeline tras subida, escaneo malware, registro | cola duradera |
| **diferidos** | generar resumen al completar, recalcular estado | cola duradera |
| **recurrentes** | recordatorios, expiración de enlaces, detección de bloqueos, reconciliación | Inngest cron / Vercel Cron |

Controles obligatorios:

- **idempotencia** (vía `idempotency_keys`) para evitar procesar dos veces el mismo evento;
- **reintentos** con backoff y límite;
- **dead-letter queue (DLQ)** para jobs que agotan reintentos;
- **logs** estructurados por job;
- **panel de fallos** accionable para operaciones.

---

## 11. MVP recomendado por fases

| Fase | Alcance | Criterio de aceptación |
|---|---|---|
| **Fase 1 — Base** | modelo de datos base, magic links, upload seguro, Blob, Resend, auditoría mínima | un cliente sube un documento vía enlace y queda registrado de forma trazable y segura |
| **Fase 2 — Seguimiento** | checklists, seguimiento documental, recordatorios, bloqueo por cliente | el sistema recuerda y escala sin intervención del abogado |
| **Fase 3 — Extracción** | extracción PDF digital, OCR externo, pipeline documental, revisión asistente | el texto se extrae y el asistente valida lo operativo |
| **Fase 4 — IA** | DeepSeek V4 Flash: clasificación, extracción, resumen, verificación documento-expediente | cada salida IA con confianza, fuentes y trazabilidad |
| **Fase 5 — Puerta** | puerta “Listo para revisión”, dashboard abogado, métricas de autonomía | el abogado recibe expedientes con todos los checks en `pass` |

> **Principio de orden:** no empezar Fase 4 (IA) sin Fase 3 (extracción/OCR) operativa. No empezar Fase 5 (puerta) sin Fase 4 estable. La puerta sin IA fiable produce falsos “Listo para revisión”.

---

## 12. Riesgos críticos

Priorizados por impacto en la promesa de autonomía:

1. **Falsos “Listo para revisión”** — el más grave: el abogado confía en la marca y un expediente incompleto o mal prevalidado llega como listo. Mitigación: puerta de calidad formal (sección 6), umbral conservador, verificación documento-expediente.
2. **OCR incorrecto** — identidad/RTN/juzgado mal leídos. Mitigación: OCR externo validado, `confianza_ocr` en el score, fallback a revisión humana.
3. **IA alucinada** — datos inventados. Mitigación: fuentes obligatorias, `ai_output_evidence`, nunca única fuente.
4. **Documento de otro expediente** — escapa del scope. Mitigación: verificación documento-expediente estricta, scope por magic link.
5. **Fuga documental** — URLs o tokens expuestos. Mitigación: hash, expiración, signed URLs cortas, permisos por expediente.
6. **Token reutilizado** — uso fuera de término. Mitigación: límite de usos, OTP en sensibles, revocación.
7. **Jobs duplicados** — doble procesamiento. Mitigación: idempotencia.
8. **Email no entregado** — cliente no recibe solicitud/recordatorio. Mitigación: eventos de entrega en Resend, canal alternativo.
9. **Proveedor IA caído** — bloqueo del pipeline. Mitigación: reintentos, degradación elegante (sin IA → revisión asistente), monitorización.
10. **Coste por volumen documental** — escalada de gasto en IA/OCR/almacenamiento. Mitigación: cache por hash, Flash por defecto, presupuestos y alertas.

---

## 13. Recomendaciones finales

### 13.1 Qué hacer primero

- **Fase 1 (MVP base):** modelo de datos SGIE + magic links + upload seguro + Blob + Resend + auditoría mínima. Es la pieza que habilita toda la autonomía documental.
- **Confirmar Inngest** como cola por defecto en la fase de jobs (T5).

### 13.2 Qué no hacer todavía

- **No integrar SEJE** ni fuentes oficiales (pendiente de validación jurídica/técnica).
- **No automatizar la retención documental** (pendiente de aprobación legal).
- **No tratar DeepSeek V4 Flash como OCR.**
- **No dejar que la IA apruebe, firme o cierre** expedientes.

### 13.3 Qué validar con abogados hondureños

- Checklists por materia (versión mínima validable).
- Cómputo de plazos legales (SGIE no computa; solo programa recordatorios).
- Estados procesales por materia.
- Política de confidencialidad (familia, penal).

### 13.4 Qué validar con documentos reales anonimizados

- Calidad del OCR en documentos hondureños (identidad/RTN, juzgados).
- Calidad de la extracción IA (DeepSeek V4 Flash) por tipo documental.
- Umbrales de confianza que distingan prevalidado de revisión.

### 13.5 Qué dejar fuera del MVP

- Integración SEJE / fuentes oficiales.
- Retención documental automatizada.
- OTP avanzado (salvo casos sensibles puntuales).
- Verificación IA de alta confianza sin supervisión humana.
- Nivel 4 de autonomía (IA propone decisiones).

---

## Registro de certeza

- **VALIDADO por inspección del repo:** stack base (Next.js 16/Vercel, Neon+Drizzle+pgvector, Blob, Resend, auth, pdfjs) y ausencias reales (tablas SGIE, cola, OCR).
- **Pendiente de validación técnica:** DeepSeek V4 Flash (nombre/disponibilidad/coste), Inngest como cola por defecto, OCR elegido, Blob vs S3 vs R2, umbrales de confianza, antivirus.
- **Pendiente de validación por abogado hondureño:** checklists por materia, cómputo de plazos, estados procesales, confidencialidad.
- **No recomendable en MVP:** integración SEJE, retención automatizada, Nivel 4 de autonomía.
- **Fuera del alcance:** web pública, código, diseño visual, componentes UI.
