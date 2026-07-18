# Fase 2 — Núcleo durable de procedimientos, documentos, comunicaciones, OCR e IA

Estado del documento: implementación local en `main` (commit `c74840d`), migraciones 0034–0036 aplicables en staging.

## Resumen

La Fase 2 extiende el SGIE con un sistema de 9 subsistemas que transforman los expedientes de registros estáticos a flujos procesales durables:

1. **Workflow engine** — plantillas versionadas de procedimientos, fases y transiciones.
2. **Job queue durable** — ejecución con retry, backoff exponencial con jitter, locks basados en `FOR UPDATE SKIP LOCKED` y dead-letter queue.
3. **Transactional outbox** — eventos de dominio con consistencia transaccional.
4. **Subida atómica** — carga documental con reserva de enlace mágico atómica y registro en transacción DB.
5. **Pipeline documental** — extracción de texto, clasificación, OCR y procesamiento IA.
6. **OCR** — interfaz de proveedor con Tesseract.js y stub por defecto.
7. **AI Router** — estrategia múltiple (determinístico → heurístico → DeepSeek → humano).
8. **Comunicaciones** — outbox de correos con plantillas versionadas, webhooks Resend y auditoría.
9. **Observabilidad** — métricas operativas y estado de integraciones.

## Arquitectura general

```
┌──────────────────────────────────────────────────────────────────────┐
│                         API Layer (Next.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ POST /cargar │  │ POST /proces │  │ POST /rech │  │ GET /metr │  │
│  │  /[token]    │  │  /[id]       │  │  azar/[id] │  │  icas     │  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  └─────┬─────┘  │
│         │                 │                 │              │         │
│         ▼                 ▼                 ▼              ▼         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   Lib Layer (servicios)                       │  │
│  │  ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │ upload-    │ │ workflow  │ │ jobs-db  │ │ outbox       │ │  │
│  │  │ atomico    │ │ .ts       │ │ .ts      │ │ .ts          │ │  │
│  │  └────────────┘ └───────────┘ └──────────┘ └──────────────┘ │  │
│  │  ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │ motor-     │ │ ia-router │ │ ocr/     │ │ correos-db   │ │  │
│  │  │ documental │ │ .ts       │ │prov+tesser│ │ .ts          │ │  │
│  │  └────────────┘ └───────────┘ └──────────┘ └──────────────┘ │  │
│  │  ┌────────────┐ ┌───────────┐                                │  │
│  │  │ observabi- │ │ auditoria-│                                │  │
│  │  │ lidad.ts   │ │ sgie.ts   │                                │  │
│  │  └────────────┘ └───────────┘                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│         │                 │                 │              │         │
│         ▼                 ▼                 ▼              ▼         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │               Database Layer (PostgreSQL + Drizzle)            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐  │  │
│  │  │jobs_sgie │ │outbox_   │ │procedimie │ │comunicaciones │  │  │
│  │  │+attempts │ │events    │ │nto_* + f  │ │_outbox + aud  │  │  │
│  │  │+DLQ      │ │          │ │ases+trans │ │               │  │  │
│  │  └──────────┘ └──────────┘ └───────────┘ └───────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐  │  │
│  │  │ocr_resul │ │ai_task_  │ │documentos │ │plantillas_corr │  │  │
│  │  │tados     │ │routing   │ │_expediente│ │eo + versiones  │  │  │
│  │  └──────────┘ └──────────┘ └───────────┘ └───────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  External Integrations                                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐                    │  │
│  │  │ Vercel   │ │ Resend   │ │ Tesseract │                    │  │
│  │  │ Blob     │ │ (correos)│ │ .js (OCR) │                    │  │
│  │  └──────────┘ └──────────┘ └───────────┘                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Subsistemas detallados

### 1. Workflow engine (`lib/sgie/workflow.ts`)

Define procedimiento como plantilla versionada con fases y transiciones:

```
tipos_procedimiento
  └─ procedimiento_versiones (v1, v2...)
       ├─ procedimiento_fases (orden, slug, nombre)
       └─ procedimiento_transiciones (desde → hacia, actores_permitidos)

expediente
  └─ expediente_fases (instancia por expediente: entrada/salida)
```

- `instanciarWorkflow()`: clona fases activas de un procedimiento en `expediente_fases`. La primera fase se marca como `activa` (entradaEn != null).
- `transitarFase()`: valida que la transición esté permitida, que el actor tenga el rol adecuado, y ejecuta la transición en una transacción DB que actualiza salida de origen + entrada de destino + historial.
- `obtenerFaseActual()`: consulta la fase sin `salidaEn` para un expediente.
- Las transiciones se definen con `actoresPermitidos` (`abogado`, `admin`, `sistema`).

### 2. Job queue durable (`lib/sgie/jobs-db.ts`)

Jobs con estado `pendiente → en_proceso → completado | dead_lettered`.

Tablas:
- `jobs_sgie` (ampliada en 0034 con `next_run_at`, `locked_at`, `lock_expires_at`, `worker_id`, `priority`, `idempotency_key`)
- `job_attempts` (historial de intentos)
- `dead_letter_jobs` (DLQ)

Operaciones:
- `encolarJob()`: con idempotencia por `idempotencyKey` y `onConflictDoNothing` por (tipo, refId, ventana_temporal)
- `reclamarJobs()`: `UPDATE ... FOR UPDATE SKIP LOCKED` con límite por worker. Usa `ORDER BY priority DESC, creado_en ASC`.
- `fallarJob()`: si `intentos < maxIntentos`, calcula `nextRunAt` con backoff exponencial: `2^n * 60s base + 30% jitter`, máximo 24h. Si excede, mueve a DLQ.
- `completarJob()`: libera locks y marca completo.
- `recuperarLocksAbandonados()`: limpia jobs en `en_proceso` con lock expirado.
- `reintentarJob()`: resetea a pendiente con contador 0.

### 3. Transactional outbox (`lib/sgie/outbox.ts`)

Eventos de dominio insertados en la misma transacción DB que la operación que los origina.

Tabla: `outbox_events` con `status ∈ {pending, enviando, completed, failed}`.

Eventos definidos:
- `case.created` — caso creado
- `workflow.instantiated` — workflow instanciado
- `document.uploaded` — documento subido
- `document.processing.requested` — procesamiento solicitado
- `document.processed` — documento procesado
- `document.review.required` — revisión humana requerida
- `requirement.completed` — requisito cumplido
- `communication.requested` — comunicación solicitada
- `communication.cancelled` — comunicación cancelada

`despacharEventos()` procesa los pendientes con el mismo patrón `FOR UPDATE SKIP LOCKED`.

### 4. Subida atómica (`lib/sgie/upload-atomico.ts`)

Dos operaciones críticas con garantías atómicas:

**`reservarEnlaceAtomicamente()`**: `UPDATE enlaces_magicos SET usos_actuales = usos_actuales + 1 WHERE usos_actuales < usos_maximos AND ... RETURNING *`. Previene race conditions: dos requests simultáneas solo una gana porque la cláusula WHERE incluye la condición de usos y el incremento es atómico.

**`registrarDocumentoAtomico()`**: transacción DB que:
1. Verifica duplicado por hash intra-expediente → si existe, retorna el existente.
2. Si el hash existe en otro expediente, marca como `duplicado`.
3. Inserta el documento en `documentos_expediente`.
4. Crea outbox event `document.uploaded`.
5. Encola job `extraccion_texto` (con `onConflictDoNothing`).
6. Si el registro falla, `compensarBlobHuerfano()` encola evento `blob.cleanup`.

### 5. Pipeline documental

El cron `GET /api/cron/sgie/procesar` orquesta el pipeline:

```
CRON_SECRET authorization
  ↓
recuperarLocksAbandonados(15 min)
  ↓
reclamarJobs(5) ← FOR UPDATE SKIP LOCKED
  ↓
para cada job:
  ├─ extraccion_texto → procesarDocumento() → estado: texto_extraido
  ├─ clasificacion    → procesarDocumento() → estado: clasificado
  ├─ ia_extraccion    → procesarDocumentoConIa() → estado: ia_procesado
  ├─ correo_envio     → (resuelto directamente)
  └─ recordatorio     → (resuelto por motor)
  ↓
despacharEventos(5)
  ↓
procesarRecordatoriosPendientes()
```

### 6. OCR (`lib/sgie/ocr/provider.ts`, `lib/sgie/ocr/tesseract.ts`)

**Provider pattern**: interfaz `OcrProvider` con método `processDocument()`. Dos implementaciones:

- **`StubOcrProvider`** (default): devuelve `{ success: false }`. El documento queda en `ocr_pendiente` con auditoría. **Nunca inventa texto**.
- **`TesseractOcrProvider`**: activo cuando `OCR_PROVIDER=tesseract`. Usa `tesseract.js` para imágenes (JPEG, PNG, WebP, TIFF, BMP) y `pdfjs-dist` + OffscreenCanvas para PDFs. Lenguaje configurable vía `TESSERACT_LANGUAGE` (default `spa`). Por página: ratio de confianza 0–100.

La tabla `ocr_resultados` almacena: documento_id, texto_extraido, método, confianza, páginas, duración_ms.

### 7. AI Router (`lib/sgie/ia-router.ts`)

**Estrategias de enrutamiento**, en orden de prioridad:

| Prioridad | Estrategia | Cuándo |
|-----------|-----------|--------|
| 1 | `deterministic` | Config explícita o tipo simple (identidad, RTN, comprobante) |
| 2 | `heuristic` | Texto muy corto (<200 chars) o modo heurístico configurado |
| 3 | `deepseek` | Default para extracción/summary/verification |
| 4 | `deepseek_pro` | Complejidad alta (>2000 chars) |
| 5 | `human` | Confianza heurística baja (<threshold) o modo humano |

**Flujo de ejecución** (`ejecutarTarea()`):
1. `routingDecision()` evalúa contexto y determina estrategia.
2. Registra en `ai_task_routing` con estado `pending`.
3. `ejecutarEstrategia()`: según estrategia, llama a clasificación heurística, `llamarIaDocumental()`, o deriva a humano.
4. Si confianza < `humanReviewThreshold` (65%), marca `requiereRevisionHumana`.
5. `revisarTarea()` permite aprobar, rechazar o corregir resultados.

**Modos de operación** (vía `DOCUMENT_AI_MODE`):
- `ai`: todas las tareas usan DeepSeek directamente.
- `disabled`: todas las tareas son determinísticas.
- (vacío): clasificación heurística, extracción/summary/verification con DeepSeek.

### 8. Comunicaciones (`lib/sgie/correos-db.ts`)

**Plantillas versionadas** (`plantillas_correo` → `plantilla_correo_versiones`): CRUD completo con interpolación segura de variables (HTML escapado). Estados: `borrador`, `activa`, `desactivada`.

**Envío idempotente**: `enviarCorreo()` inserta en `correos_enviados` con `onConflictDoNothing` por (expediente_id, plantilla_slug, ventana_temporal). Si ya existe, retorna `duplicado: true`.

**Outbox de comunicaciones** (`comunicaciones_outbox`): cola con estados `pending → sending → sent | failed | cancelled`. `procesarOutboxComunicaciones()` procesa con reintentos (max 3). Soporta `programadoPara` para envíos diferidos.

**Webhooks Resend**: `webhookResend()` procesa `email.delivered`, `email.bounced`, `email.complaint`, `email.opened`, `email.clicked`. Actualiza `correos_enviados` con tracking y registra en `webhook_receipts`.

**Auditoría**: `comunicaciones_auditoria` registra cada transición de estado con actor, estados anterior/nuevo y metadata.

### 9. Observabilidad (`lib/sgie/observabilidad.ts`)

`obtenerMetricasOperativas()` retorna dashboard completo:
- Jobs: pendientes, en_proceso, fallidos, completados, dead_letter, mas_antiguo
- Outbox: pendientes, fallidos, completados
- Documentos: recibidos, pendientes, procesando, revisión_requerida, procesados
- Comunicaciones: pendientes, enviadas, retrasadas, rebotadas, fallidas, canceladas
- Workers: última_ejecución, configurado

`obtenerEstadoIntegraciones()` retorna estado de OCR, IA, Resend y Blob.

## Integración con Fase 1

| Componente Fase 1 | Integración Fase 2 |
|-------------------|-------------------|
| `usuarios` / JWT / proxy | Reutilizado sin cambios. Auth vía `requireAbogado`, CSRF validado. |
| `expedientes` / `requisitos_expediente` | `expediente_fases` FK a `expedientes`. `documentos_expediente` y `enlaces_magicos` FK a `expedientes`. |
| `access-service` | `assertCaseAccess()` usado en rutas de documentos. |
| `auditoria-sgie` (`logSgie`) | Todas las mutaciones Fase 2 registran auditoría. |
| Estados usuario (activo/bloqueado/SGIE) | Workers usan `00000000-0000-0000-0000-000000000000` para acciones de sistema. |
| Rate limiting | Endpoints de carga y procesamiento reutilizan `rateLimit`. |

## Tabla de tablas creadas

| Migración | Tabla | Propósito |
|-----------|-------|-----------|
| 0034 | `procedimiento_versiones` | Versiones de plantillas de procedimiento |
| 0034 | `procedimiento_fases` | Fases dentro de una versión |
| 0034 | `procedimiento_transiciones` | Reglas de transición entre fases |
| 0034 | `expediente_fases` | Instancias de fase por expediente |
| 0034 | `outbox_events` | Eventos de dominio transaccionales |
| 0034 | `job_attempts` | Historial de intentos de jobs |
| 0034 | `dead_letter_jobs` | Jobs fallidos definitivamente |
| 0034 | `comunicaciones_outbox` | Cola de comunicaciones |
| 0034 | `comunicaciones_aprobaciones` | Aprobaciones de comunicaciones |
| 0034 | `webhook_receipts` | Recepción de webhooks |
| 0035 | `ocr_resultados` | Resultados de OCR |
| 0035 | `ai_task_routing` | Enrutamiento de tareas IA |
| 0036 | `plantilla_correo_versiones` | Versionado de plantillas de correo |
| 0036 | `comunicaciones_auditoria` | Pista de auditoría de comunicaciones |

### Columnas añadidas a tablas existentes

- `jobs_sgie`: `next_run_at`, `locked_at`, `lock_expires_at`, `worker_id`, `last_error_code`, `dead_lettered_at`, `correlation_id`, `pipeline`, `priority`, `idempotency_key`
- `documentos_expediente`: `pipeline_status`, `pipeline_error`, `ocr_required`, `ocr_completed`, `ai_required`, `ai_completed`, `correlation_id`
- `document_text_pages`: `ocr_provider`, `ocr_confidence`, `rotation`, `illegible`
- `correos_enviados`: `delivery_status`, `bounced`, `bounce_type`, `bounce_reason`, `complaint`, `opened_at`, `clicked_at`, `suppressed`, `correlation_id`
- `plantillas_correo`: `categoria`, `requiere_aprobacion`, `nivel_aprobacion`
- `comunicaciones_outbox`: `suppressed`, `notas`, `resend_id`, `aprobacion_requerida`, `aprobada_por`, `aprobada_en`, `correlation_id`, `cliente_id`, `plantilla_slug`, `variables`

## Seguridad

- **Jobs cron**: autenticación vía `CRON_SECRET` en header `Authorization: Bearer <secret>`. Sin CRON_SECRET configurado, retorna 500.
- **Carga pública**: rate limit 10 requests por 15 minutos por IP. Enlace mágico validado por token hash SHA-256. Revocado y expirado comprobados en DB.
- **Procesamiento documento**: requireAuth + requireAbogado + CSRF. Verificación de asignación/permiso de expediente.
- **Rechazo documento**: requireAbogado + CSRF + Zod validation + verificación de acceso.
- **OCR stub**: nunca inventa texto. Si no hay OCR real, el documento queda en `ocr_pendiente` con auditoría.
- **IA Router**: las credenciales DeepSeek se leen de entorno, nunca se hardcodean. `IA_DOCUMENTAL_MODE=disabled` desactiva llamadas externas.
- **Secretos**: todas las API keys via `process.env`. Sin exponer en logs ni respuestas.
- **Idempotencia**: jobs y correos usan `idempotencyKey` y `onConflictDoNothing` para evitar duplicados.

## Idempotencia y concurrencia

| Componente | Mecanismo |
|-----------|-----------|
| Encologar job | `idempotencyKey` único + `onConflictDoNothing` por (tipo, refId, ventana_temporal) |
| Reclamar job | `FOR UPDATE SKIP LOCKED` — dos workers no reciben el mismo job |
| Locks abandonados | `recuperarLocksAbandonados()` libera jobs con `lock_expires_at` vencido |
| Reserva de enlace | `UPDATE ... SET usos_actuales = usos_actuales + 1 WHERE usos_actuales < usos_maximos` — atómico, sin race |
| Registro documento | Transacción DB: verificación de duplicado por hash + inserción + outbox + job |
| Envío de correo | `onConflictDoNothing` por (expediente_id, plantilla_slug, ventana_temporal) |
| Backoff | Exponencial `2^n * 60s` + jitter 30%, máximo 24h |
| Dead-letter | 3 intentos por defecto, luego DLQ con payload y error original |

## Variables de entorno nuevas

- `CRON_SECRET` — secreto para endpoint de procesamiento batch
- `OCR_PROVIDER` — proveedor OCR (default `stub`, opción `tesseract`)
- `TESSERACT_LANGUAGE` — idioma Tesseract (default `spa`)
- `DOCUMENT_AI_MODE` — modo IA (`ai`, `disabled`, o vacío para híbrido)
- `DOCUMENT_AI_PRO_MODEL` — modelo para tareas complejas (default `deepseek-chat`)
- `DOCUMENT_AI_HUMAN_REVIEW_THRESHOLD` — umbral de confianza para revisión humana (default 65)
- `DOCUMENT_AI_VERSION_PROMPT` — versión de prompt (default `v2.0`)
