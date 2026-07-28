---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Validación staging — cierre de Fase 2

Fecha: 18 de julio de 2026. Commit: `c74840d`.

## Prerrequisitos

- Base de datos PostgreSQL aislada (Neon branch efímera recomendada).
- Variables de guard: `ALLOW_TEST_DATABASE=true`, `E2E_ENV=staging`.
- `CRON_SECRET` configurado para probar endpoint de procesamiento.
- Opcional: `OCR_PROVIDER=tesseract`, `RESEND_API_KEY` para validación real.

No incluir cadenas de conexión ni contraseñas en archivos o logs.

## Cómo validar cada subsistema

### 1. Migraciones (0034 + 0035 + 0036)

```bash
# Verificar que las migraciones SQL existen y son idempotentes
# Las tablas deben crearse con IF NOT EXISTS, columnas con ADD COLUMN IF NOT EXISTS

# Opcional: aplicar contra staging
psql $DATABASE_URL < drizzle/migrations/0034_fase2_workflows_outbox_jobs.sql
psql $DATABASE_URL < drizzle/migrations/0035_fase2_documents_ocr_ai.sql
psql $DATABASE_URL < drizzle/migrations/0036_fase2_communications.sql

# Verificar tablas creadas
psql $DATABASE_URL -c "\dt procedimiento_* outbox_events job_attempts dead_letter_jobs comunicaciones_* webhook_receipts ocr_resultados ai_task_routing plantilla_correo_versiones comunicaciones_auditoria"

# Verificar columnas añadidas
psql $DATABASE_URL -c "\d jobs_sgie"
psql $DATABASE_URL -c "\d documentos_expediente"
psql $DATABASE_URL -c "\d correos_enviados"
psql $DATABASE_URL -c "\d comunicaciones_outbox"
```

### 2. Workflow engine

```bash
# Verificar que se puede instanciar un workflow desde un tipo de procedimiento
# Verificar creación de procedimiento_versiones, procedimiento_fases, procedimiento_transiciones
# Verificar que transitarFase() solo permite transiciones definidas
# Verificar que actores_permitidos restringe según rol

# Verificar que obtenerFaseActual() retorna la fase activa correcta
# Verificar que obtenerWorkflow() retorna fases + transiciones
```

### 3. Job queue durable

```bash
# Verificar encolado con idempotencyKey
# Verificar onConflictDoNothing por (tipo, refId, ventana_temporal)
# Verificar reclamación con FOR UPDATE SKIP LOCKED (workers paralelos)
# Verificar backoff: job fallido → nextRunAt = ahora + 2^n * 60s + jitter
# Verificar dead-letter después de maxIntentos (default 3)
# Verificar recuperarLocksAbandonados con lock_expires_at vencido
# Verificar reintentarJob resetea contador y error

# Verificar métricas: obtenerMetricas() retorna conteos correctos
```

### 4. Transactional outbox

```bash
# Verificar que outbox event se crea en misma transacción que el documento
# Verificar estados: pending → enviando → completed | failed
# Verificar que despacharEventos() procesa con FOR UPDATE SKIP LOCKED
# Verificar que recuperarEventosBloqueados() libera eventos atascados
# Verificar obtenerMetricasOutbox() retorna conteos
```

### 5. Subida atómica y carga documental

```bash
# Verificar reserva atómica de enlace mágico (race condition: 2 requests simultáneas)
# Verificar que usos_actuales se incrementa solo si < usos_maximos
# Verificar que enlace revocado o expirado retorna null
# Verificar que carga multipart funciona con rate limit (10/15min por IP)
# Verificar deduplicación por hash: mismo hash mismo expediente → retorna existente
# Verificar hash en otro expediente → estado=duplicado
# Verificar que outbox event + job se crean en la misma transacción
# Verificar compensarBlobHuerfano() en caso de error posterior a subida
```

### 6. Pipeline documental (cron)

```bash
# Verificar que el endpoint GET /api/cron/sgie/procesar requiere CRON_SECRET
# Verificar que procesa jobs extraccion_texto, clasificacion, ia_extraccion
# Verificar que despacha eventos outbox pendientes
# Verificar que procesa recordatorios pendientes
# Verificar que recupera locks abandonados

# Probar con diferentes Authorization headers
curl -H "Authorization: Bearer ${CRON_SECRET}" "http://localhost:3000/api/cron/sgie/procesar"
```

### 7. OCR

```bash
# Con OCR_PROVIDER=stub (default):
#   Verificar que processDocument() retorna success:false
#   Verificar que el documento queda en ocr_pendiente

# Con OCR_PROVIDER=tesseract:
#   Verificar OCR de imagen JPEG/PNG
#   Verificar OCR de PDF escaneado
#   Verificar que confianza se reporta 0-100
#   Verificar que tipo MIME no soportado retorna error
```

### 8. AI Router

```bash
# Verificar routingDecision() con diferentes configuraciones:
#   DOCUMENT_AI_MODE=ai → todas a deepseek
#   DOCUMENT_AI_MODE=disabled → todas deterministic
#   Sin config → classification heuristic, extraction/summary/verification deepseek
# Verificar que tipos simples (identidad, RTN) van a deterministic
# Verificar que texto corto va a heuristic
# Verificar que texto largo va a deepseek_pro
# Verificar requiereRevisionHumana según threshold

# Verificar ejecutarTarea() registra en ai_task_routing
# Verificar revisarTarea() puede approved/rejected/corrected
# Verificar obtenerTareasPendientesRevision() retorna solo completed sin revisión
```

### 9. Comunicaciones

```bash
# Verificar CRUD de plantillas (crear, listar, obtener, actualizar)
# Verificar interpolación segura de variables (HTML escapado)
# Verificar envío con plantilla activa → estado enviado
# Verificar idempotencia: mismo (expediente, plantilla, ventana) → duplicado: true
# Verificar envío sin RESEND_API_KEY → estado fallido, error documentado
# Verificar outbox de comunicaciones con procesarOutboxComunicaciones()
# Verificar webhook Resend: delivered, bounced, complaint, opened, clicked
# Verificar auditoría: comunicaciones_auditoria registra transiciones
# Verificar suprimirDestinatario() cancela comunicaciones pendientes
# Verificar cancelarRecordatoriosSiCumplido() al completar requisito
```

### 10. Observabilidad

```bash
# Verificar obtenerMetricasOperativas() retorna todos los campos
# Verificar obtenerEstadoIntegraciones() con y sin config
# Verificar endpoint /api/admin/sgie/metricas con auth admin
# Verificar que el endpoint requiere capacidad audit.read
```

### 11. E2E documental

```bash
node scripts/e2e/fase2-e2e.mjs
# Debe ejecutar todo el flujo: procedimiento → expediente → enlace → subida → outbox → job → IA → comunicación
# El guard.mjs debe pasar antes de escritura
# Fixtures se limpian en finally
```

## Rollback procedure

Las migraciones 0034, 0035 y 0036 son aditivas. Para revertir:

### Reversión completa

```sql
-- 0036: Comunicaciones y versiones
DROP TABLE IF EXISTS comunicaciones_auditoria CASCADE;
DROP TABLE IF EXISTS plantilla_correo_versiones CASCADE;
ALTER TABLE plantillas_correo DROP COLUMN IF EXISTS categoria;
ALTER TABLE plantillas_correo DROP COLUMN IF EXISTS requiere_aprobacion;
ALTER TABLE plantillas_correo DROP COLUMN IF EXISTS nivel_aprobacion;
ALTER TABLE correos_enviados DROP COLUMN IF EXISTS delivery_status;
ALTER TABLE correos_enviados DROP COLUMN IF EXISTS bounced;
ALTER TABLE correos_enviados DROP COLUMN IF EXISTS bounce_type;
ALTER TABLE correos_enviados DROP COLUMN IF EXISTS bounce_reason;
ALTER TABLE correos_enviados DROP COLUMN IF EXISTS complaint;
ALTER TABLE correos_enviados DROP COLUMN IF EXISTS opened_at;
ALTER TABLE correos_enviados DROP COLUMN IF EXISTS clicked_at;
ALTER TABLE correos_enviados DROP COLUMN IF EXISTS suppressed;
ALTER TABLE correos_enviados DROP COLUMN IF EXISTS correlation_id;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS suppressed;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS notas;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS resend_id;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS aprobacion_requerida;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS aprobada_por;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS aprobada_en;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS correlation_id;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS cliente_id;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS plantilla_slug;
ALTER TABLE comunicaciones_outbox DROP COLUMN IF EXISTS variables;

-- 0035: OCR y AI
DROP TABLE IF EXISTS ai_task_routing CASCADE;
DROP TABLE IF EXISTS ocr_resultados CASCADE;
ALTER TABLE documentos_expediente DROP COLUMN IF EXISTS pipeline_status;
ALTER TABLE documentos_expediente DROP COLUMN IF EXISTS pipeline_error;
ALTER TABLE documentos_expediente DROP COLUMN IF EXISTS ocr_required;
ALTER TABLE documentos_expediente DROP COLUMN IF EXISTS ocr_completed;
ALTER TABLE documentos_expediente DROP COLUMN IF EXISTS ai_required;
ALTER TABLE documentos_expediente DROP COLUMN IF EXISTS ai_completed;
ALTER TABLE documentos_expediente DROP COLUMN IF EXISTS correlation_id;
ALTER TABLE document_text_pages DROP COLUMN IF EXISTS ocr_provider;
ALTER TABLE document_text_pages DROP COLUMN IF EXISTS ocr_confidence;
ALTER TABLE document_text_pages DROP COLUMN IF EXISTS rotation;
ALTER TABLE document_text_pages DROP COLUMN IF EXISTS illegible;

-- 0034: Workflow, outbox, jobs
DROP TABLE IF EXISTS webhook_receipts CASCADE;
DROP TABLE IF EXISTS comunicaciones_aprobaciones CASCADE;
DROP TABLE IF EXISTS comunicaciones_outbox CASCADE;
DROP TABLE IF EXISTS dead_letter_jobs CASCADE;
DROP TABLE IF EXISTS job_attempts CASCADE;
DROP TABLE IF EXISTS outbox_events CASCADE;
DROP TABLE IF EXISTS expediente_fases CASCADE;
DROP TABLE IF EXISTS procedimiento_transiciones CASCADE;
DROP TABLE IF EXISTS procedimiento_fases CASCADE;
DROP TABLE IF EXISTS procedimiento_versiones CASCADE;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS next_run_at;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS locked_at;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS lock_expires_at;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS worker_id;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS last_error_code;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS dead_lettered_at;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS correlation_id;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS pipeline;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS priority;
ALTER TABLE jobs_sgie DROP COLUMN IF EXISTS idempotency_key;

-- Nota: ALTER TYPE job_sgie_estado no se puede revertir fácilmente.
-- Si es necesario, crear un nuevo tipo y migrar.
```

### Rollback selectivo

Cada tabla es independiente. Para rollback de un subsistema específico, ejecutar solo las sentencias DROP/ALTER correspondientes a ese subsistema.

## Comandos de validación rápida

```bash
# Verificar que los imports no rompen
npx tsc --noEmit --pretty 2>&1 | head -50

# Verificar lint
npm run lint

# Verificar tests relacionados
npx vitest run lib/sgie/ --reporter=verbose

# Verificar E2E (requiere DB aislada)
node scripts/e2e/fase2-e2e.mjs

# Verificar build
npm run build
```
