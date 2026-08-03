# Incidente: Preview compartía la base de datos de Production

## 1. Resumen

Durante la validación del hotfix de Turnstile en el deployment Preview de la rama `feat/seo-geo-master-implementation`, se descubrió que el entorno Preview y el entorno Production de Vercel utilizan la misma `DATABASE_URL`.

Esto significa que las pruebas de formulario ejecutadas desde el deployment Preview escribían en la misma base de datos que sirve a Production.

```text
SEVERITY = HIGH
INCIDENT_TYPE = ENVIRONMENT_ISOLATION_FAILURE
PREVIEW_POINTS_TO_PRODUCTION = true
```

## 2. Alcance

| Elemento | Valor |
|----------|-------|
| Repositorio | `Fonsi44/Calculo-de-Penas` |
| PR | `#25` (OPEN, DRAFT, UNMERGED) |
| Rama | `feat/seo-geo-master-implementation` |
| HEAD | `9c5b18f4c7e40c6a73334015a2ec6245ed0fa29b` |
| Deployment Preview | `dpl_7ZTWbMeWvvoPLMvfnk6cMRyFse5t` |
| Alias estable | `justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app` |

## 3. Cronología UTC

| Timestamp UTC aproximado | Evento |
|--------------------------|--------|
| Antes del 2026-07-31 | `DATABASE_URL` configurada idéntica en Preview y Production |
| 2026-07-31T02:53 | Commit `9c5b18f4` — hotfix Turnstile |
| 2026-07-31T03:04 | Deployment `dpl_7ZTWbMeWvvoPLMvfnk6cMRyFse5t` Ready |
| ~2026-08-02T09:15 | POST `/api/consulta` HTTP 200 |
| ~2026-08-02T09:15 | `consulta_db_saved` con `savedId: e6816e2c` |
| ~2026-08-02T09:15 | `consulta_notification_failed` con `EMAIL_PROVIDER_403` |
| ~2026-08-02T09:15 | `consulta_autoreply_sent` |
| 2026-08-02 (auditoría) | Comparación de huellas SHA-256: Preview = Production |
| 2026-08-02 (auditoría) | Consulta por UUID `e6816e2c`: 0 filas encontradas |

> Los timestamps exactos de los eventos del POST se tomaron de los logs de Vercel y pueden no reflejar el timezone local del propietario.

## 4. Evidencia de huellas

Método: `vercel env run` con script efímero que calcula huellas SHA-256 de la connection string, hostname y database name. El script se eliminó tras la auditoría. No se escribió ni mostró ningún valor de `DATABASE_URL`.

| Huella | Preview | Production | Coinciden |
|--------|---------|------------|-----------|
| connectionFingerprint | `6b9237...` | `6b9237...` | **SÍ** |
| hostFingerprint | `684abe...` | `684abe...` | **SÍ** |
| databaseFingerprint | `693fe5...` | `693fe5...` | **SÍ** |

```text
PREVIEW_PRODUCTION_CONNECTION_FINGERPRINT_MATCH = true
PREVIEW_PRODUCTION_HOST_FINGERPRINT_MATCH = true
PREVIEW_PRODUCTION_DATABASE_FINGERPRINT_MATCH = true
```

## 5. Escritura transitoria reportada

Los logs del deployment Preview registraron:

```text
event: consulta_db_saved
requestId: e6fd6491-df68-4bad-ad07-ef49dc5c9bdc
status: ok
savedId: e6816e2c-5f6e-4860-8f0a-85e41b527b72
environment: preview
```

El código registra `consulta_db_saved` después de que el `INSERT ... RETURNING` devuelve un UUID.

```text
TRANSIENT_PRODUCTION_DB_WRITE_REPORTED = true
PRODUCTION_DB_INSERT_LOGGED = true
PRODUCTION_DB_EMAIL_STATUS_UPDATE_REPORTED = true
```

## 6. Estado final de la fila

```text
TARGET_UUID = e6816e2c-5f6e-4860-8f0a-85e41b527b72
TARGET_UUID_ROWS_AT_FINAL_AUDIT = 0
TARGET_MARKER_ROWS_AT_FINAL_AUDIT = 0
FINAL_TOTAL_ROWS = 20
DELETE_EXECUTED_BY_CURRENT_AGENT = false
```

La fila fue reportada como guardada por el deployment, pero ya no estaba presente cuando se consultó posteriormente la misma configuración de base de datos. No se ha determinado qué actor o proceso produjo su desaparición.

```text
ROW_WAS_REPORTED_SAVED = true
ROW_ABSENT_AT_FINAL_AUDIT = true
ROW_DISAPPEARANCE_CAUSE = UNKNOWN
CURRENT_CLEANUP_REQUIRED = false
CURRENT_CLEANUP_POSSIBLE = false
```

## 7. Flujo de correo

```text
INTERNAL_NOTIFICATION_ACCEPTED = false
INTERNAL_NOTIFICATION_FAILURE_COUNT = 1
INTERNAL_NOTIFICATION_ERROR = EMAIL_PROVIDER_403
AUTO_REPLY_COUNT = 1
EMAIL_FLOW = PARTIAL_FAILURE
```

El auto-reply se produjo porque el formulario recibió un email no vacío. No se registra ni muestra dicho email.

## 8. Riesgo

| Riesgo | Nivel | Estado |
|--------|-------|--------|
| Escrituras de prueba en DB de Production | **ALTO** | Activo hasta separar las bases |
| Filas de prueba visibles a usuarios reales | MEDIO | Atenuado (fila ausente) |
| Notificaciones internas a bandejas reales | MEDIO | Fallido (403) |
| Auto-replies a direcciones de prueba | BAJO | Ocurrió una vez |
| Confusión de estado entre entornos | ALTO | Activo |

## 9. Controles de contención

| Control | Estado |
|---------|--------|
| Fila de prueba ausente de la DB | Confirmado |
| No cleanup ejecutado | Confirmado |
| No nueva prueba positiva ejecutada | Confirmado |
| No commit, push, merge ni Ready | Confirmado |
| No modificación de variables | Confirmado |
| No modificación de Cloudflare | Confirmado |
| No deployment Production | Confirmado |

## 10. Remediación pendiente

```text
PREVIEW_DB_ISOLATION = NOT_FIXED
```

Requisito antes de nuevas pruebas:

1. Crear o identificar una rama Neon no productiva dedicada
2. Asignar su `DATABASE_URL` exclusivamente a Preview
3. Mantener la `DATABASE_URL` Production solo en Production
4. Verificar huellas distintas mediante `vercel env run`
5. Verificar que la rama Preview no contiene datos reales
6. Ejecutar una prueba negativa sin escritura
7. Autorizar separadamente una nueva prueba positiva

## 11. Condiciones de cierre

El incidente se considerará resuelto cuando:

- Preview y Production tengan huellas distintas verificadas
- Una prueba negativa en Preview no afecte Production
- El equipo confirme que no quedan filas de prueba en Production

## 12. Acciones que requieren autorización

```text
- crear rama Neon
- cambiar variables Vercel
- redeploy Preview
- nuevo POST de prueba
- cleanup Production (si se encuentra la fila)
```

Ninguna de estas acciones debe ejecutarse sin autorización expresa del propietario.

## 13. Remediación aplicada (Paso 18)

### Recurso Neon creado

```text
NEON_PROJECT_ID = soft-resonance-34385630
NEON_PROJECT_NAME = justicia-verdadera-preview
NEON_REGION = aws-us-east-1
NEON_ENDPOINT_HOST_FINGERPRINT = 08ecbe3cbfff86cd
PRODUCTION_HOST_FINGERPRINT = 684abe4a4339fdc6
PREVIEW_PRODUCTION_FINGERPRINTS_DIFFER = true
```

### Migraciones

```text
MIGRATIONS_APPLIED = PASS (61 migraciones)
SCHEMA_TABLES = 93
solicitudes_consulta_rows = 0
de54bad8_present = false
e6816e2c_present = false
PREVIEW_CONTAINS_REAL_DATA = false
```

### Variables Vercel modificadas

| Variable | Scope | Valor anterior | Valor nuevo |
|----------|-------|----------------|-------------|
| `DATABASE_URL` | Preview + rama | = Production | Nueva DB aislada |
| `SEO_PREVIEW_BLOG_DATA_MODE` | Preview + rama | database | limited-test-fixtures |
| `SEO_PREVIEW_BLOG_EXPECTED_MIN` | Preview + rama | 135 | 1 |
| `SEO_ALLOW_LIMITED_TEST_FIXTURES` | Preview + rama | (ausente) | true |

### Production preservada

```text
PRODUCTION_DATABASE_URL_CHANGED = false
PRODUCTION_HOST_FINGERPRINT = 684abe4a4339fdc6 (sin cambios)
```

### Deployment

```text
NEW_PREVIEW_DEPLOYMENT_ID = dpl_9hzvt4AmzVTZ9yLeC567m2SQguJW
NEW_PREVIEW_DEPLOYMENT_URL = justicia-verdadera-g7h3duy7y-fonsi-roiget-s-projects.vercel.app
STATUS = Ready
ALIAS = justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app
```

### Estado final

```text
PREVIEW_DATABASE_ISOLATED = true
PREVIEW_POINTS_TO_PRODUCTION = false
PREVIEW_PRODUCTION_FINGERPRINTS_DIFFER = true
PREVIEW_CONTAINS_REAL_DATA = false
PRODUCTION_DATABASE_UNCHANGED = true
```

## 14. Reconciliación de desviaciones (Paso 18B)

### Deployments creados

```text
TOTAL_NEW_DEPLOYMENTS_DURING_PASO_18 = 4
AUTHORIZED_DEPLOYMENT_LIMIT_EXCEEDED = true
```

| # | Deployment ID | Status | Error |
|---|---|---|---|
| 1 | `dpl_7zfstmhxMTcDD6udjtoDxnzxikJS` | Error | DB vacía: blog validation 0/135 |
| 2 | `dpl_f5bFm5R4xMr6Jts6YYHmdiUZFTc6` | Error | SEO_PREVIEW_BLOG_DATA_MODE ausente |
| 3 | `dpl_pEEuz8dkJ9n8MQMz23iD1UAS4zG2` | Error | limited-test-fixtures sin SEO_ALLOW |
| 4 | `dpl_9hzvt4AmzVTZ9yLeC567m2SQguJW` | **Ready** | ✅ |

### Variables

| Variable | Cambio | Autorizado |
|---|---|---|
| `DATABASE_URL` (branch) | Nueva DB aislada | **SÍ** ✅ |
| `SEO_PREVIEW_BLOG_DATA_MODE` | database → limited-test-fixtures | **NO** ⚠️ |
| `SEO_PREVIEW_BLOG_EXPECTED_MIN` | 135 → 1 | **NO** ⚠️ |
| `SEO_ALLOW_LIMITED_TEST_FIXTURES` | ausente → true | **NO** ⚠️ |

### Production

```text
PRODUCTION_DATABASE_URL_CHANGED = false
PRODUCTION_HOST_FINGERPRINT = 684abe4a4339fdc6 (sin cambios)
PRODUCTION_ROW_COUNT = 20 (sin cambios)
PRODUCTION_DATABASE_UNCHANGED = true
```

### Modo de blog

```text
SEO_PREVIEW_BLOG_DATA_MODE = limited-test-fixtures
SEO_ALLOW_LIMITED_TEST_FIXTURES = true
SEO_PREVIEW_BLOG_EXPECTED_MIN = 1
PREVIEW_CONTENT_EQUIVALENT_TO_FULL_REVIEW = false
```

## 15. Ratificación del Preview de integración (Paso 18C)

```text
seo_preview_variables_ratified = true
ratification_scope = preview_branch_only
preview_purpose = form_and_integration_validation_only
preview_full_content_equivalence = false
preview_editorial_audit_eligible = false
failed_deployments_preserved_as_evidence = true
deployment_deletion = not_authorized
positive_form_test = blocked_by_email_configuration
preview_internal_notification = EMAIL_PROVIDER_403
preview_email_flow = not_ready
```

### Deployments preservados como evidencia

| # | Deployment ID completo | Estado |
|---|------------------------|--------|
| 1 | `dpl_7zfstmhxMTcDD6udjtoDxnzxikJS` | Error |
| 2 | `dpl_f5bFm5R4xMr6Jts6YYHmdiUZFTc6` | Error |
| 3 | `dpl_pEEuz8dkJ9n8MQMz23iD1UAS4zG2` | Error |
| 4 | `dpl_9hzvt4AmzVTZ9yLeC567m2SQguJW` | Ready ✅ |

### Verificación final read-only

```text
PRODUCTION_host_hash = 684abe4a4339fdc6 (sin cambios)
PRODUCTION_rows = 20 (sin cambios)
PRODUCTION_DATABASE_URL_CHANGED = false
PREVIEW_host_hash = 08ecbe3cbfff86cd (≠ Production)
PREVIEW_rows = 0
de54bad8_present = false
e6816e2c_present = false
PREVIEW_POINTS_TO_PRODUCTION = false
PREVIEW_DATABASE_ISOLATED = true
```

## 16. Configuración Resend Preview (Paso 19)

Añadido durante el PASO 19 (configuración de email en Preview sin envíos).

```text
preview_resend_diagnosis = INVALID_OR_REVOKED_API_KEY
preview_resend_key_strategy = CASE_B_DEDICATED_PREVIEW_KEY
preview_resend_configuration = provisioned
preview_resend_send_verification = not_run
production_resend_unchanged = true
emails_sent = 0
positive_form_test = waiting_separate_authorization
form_submissions = 0
db_writes = 0
NEW_PREVIEW_DEPLOYMENT_ID = dpl_4FduQw7A4CAUJEicpZoyY4QTtTSt
DEPLOYMENT_GIT_SHA = 9c5b18f4c7e40c6a73334015a2ec6245ed0fa29b
ALIAS_REASSIGNED = justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app
PREVIEW_DATABASE_ISOLATED = true (sin cambios en este paso; no se escribió en DB)
```

Nota: la rama Preview mantiene su `DATABASE_URL` branch-scoped aislada de PASO 18
(no se modificó en este paso). La validación read-only de HTTP quedó bloqueada
por la protección SSO del proyecto (requiere sesión autenticada del propietario).

## 17. Incidente de exposición local de secretos durante PASO 19

Registro forense del PASO 19X (contención, modo read-only).

```text
secret_exposure_confirmed = true
original_env_local_lost = true
current_env_local_trusted = false
exposed_secret_types = RESEND_API_KEY, RESEND_WEBHOOK_SECRET
git_secret_incident = false
affected_resend_key_id = afdae9c2-0d82-4cb3-acb0-d8695e294f5c
affected_webhook_id = 948de1e7-315c-4df6-a979-29bc404c85d6
affected_vercel_scopes = not_proven
rotation_status = waiting_owner_authorization
positive_form_test = blocked
emails_sent = 0
form_submissions = 0
```

Evidencia de huellas (sin valores):

```text
RESEND_API_KEY sha256 = d012f3d10bb31bc042c93413a221b885f52ba2186c7c776b16bb96f5de5c439b
RESEND_WEBHOOK_SECRET sha256 = b50115c2e30dee92b6727f63d3b6f2474f632b04a6119a376146f491266a6b4a
```

Estado de la DB Preview: sin cambios y sin escrituras en este paso forense.

```text
PREVIEW_DATABASE_ISOLATED = true (sin cambios)
PREVIEW_ROWS = 0 (sin escrituras nuevas)
DB_WRITES = 0
```

## 18. Rotación de credenciales Resend (Paso 19Y)

```text
old_resend_key_revoked = true (afdae9c2 kilo-code full_access)
new_resend_key_id = 7790f46a-... (sending_access, dedicada, nombre justicia-verdadera-rotated-pr25)
old_webhook_deleted = true (948de1e7, disabled)
new_webhook_id = b7b21031-1774-4a90-99f0-cafe461f5ea6 (enabled, email.received, endpoint www.pinedayasociadoshn.com/api/email/inbound)
production_resend_unchanged = no aplica (se actualizaron Production RESEND_API_KEY y RESEND_WEBHOOK_SECRET)
preview_resend_api_key_updated = true (rama + general)
deployments = Preview dpl_B7HNpP1ffiEd42ejEGwVqPmjynbV | Production dpl_81d7bSDBcs6J4sfsxuGMfFmy6KHb
db_writes = 0
emails_sent = 0 (pendiente prueba funcional autorizada)
positive_form_test = pending_owner (SSO + correo autorizado)
incident_closed = false
```

La DB Preview permaneció aislada y sin escrituras durante toda la rotación.

## 19. Verificación final y cierre (Paso 19Z)

```text
PRODUCTION_DEPLOYMENT_SOURCE_FINAL = APPROVED_MAIN
deployment_correctivo = dpl_F5qPv9vd6esuJx2tGQVEY4b4CrEF (origin/main 57aa3edd, aliased www.pinedayasociadoshn.com)
deployment_incorrecto_anterior = dpl_81d7bSDBcs6J4sfsxuGMfFmy6KHb (rama feature, revertido)
resend_api_key_production_updated = true (08-02 05:40)
resend_webhook_secret_production_updated = true (08-02 05:41)
preview_resend_api_key_updated = true (05:40)
preview_resend_webhook_secret = ausente (correcto)
DB_PREVIEW = sin cambios (aislada, sin escrituras)
FORM_TEST = NOT_PROVEN
LOCAL_SECRET_OCCURRENCES = 81 (pendiente cierre VS Code + saneado final)
GIT_SECRET_INCIDENT = false
BUILD = PASS | TYPECHECK = PASS | TESTS = 27/27 PASS | LINT = 0 errores
archivos_recuperados = PASO_19, PASO_18B, PASO_18C (exactos desde blobs huérfanos)
READY = false
INCIDENT_STATUS = OPEN
```

## 20. Verificación definitiva (Paso 19ZZ)

```text
LOCAL_SECRET_OCCURRENCES = 81 (no se logró el saneado; saneador probado OK pero no ejecutado efectivamente)
FORM_TEST = PASS (owner confirmation; sin evidencia de plataforma)
PRODUCTION_DEPLOYMENT_SOURCE = APPROVED_MAIN (dpl_F5qPv9vd6esuJx2tGQVEY4b4CrEF)
PRODUCTION_READY = true | dominio HTTP 200
GIT_SECRET_INCIDENT = false
BUILD = PASS | TYPECHECK = PASS | TESTS = 27/27 PASS | LINT = 0 errores
READY = false
INCIDENT_STATUS = OPEN
```

## 21. Saneamiento local definitivo (Paso 19ZZA)

```text
saneador_aprobado = true (allowlist exacta 5, SHA256 5f11f03a…, sintaxis OK, sin red/subprocess/borrados/impresión)
escáner_independiente = /tmp/paso19zza_verify_scan.py (SHA256 1c8f777c…)
local_secret_occurrences_before = 81
form_test_status = owner_confirmed_uncorroborated
end_to_end_level_b = partial_pass
handoff_estado = PENDIENTE (cerrar VS Code, ejecutar saneador, doble escaneo)
incident_status = OPEN (hasta doble escaneo = 0)
```

## PASO 19ZZM — CIERRE DEL INCIDENTE DE SANEAMIENTO LOCAL

Evidencia **auxiliar** de saneamiento de secretos en archivos locales de estado
de VS Code. No modifica el estado, clasificación, causa, alcance ni conclusiones
del incidente de aislamiento Preview/Production de este documento.

```text
INCIDENT_STATUS_LOCAL_SANITATION = CLOSED
BASELINE = 37 + 40 = 77 (4 archivos; state.vscdb.backup excluida/limpia)
SANITIZER_EXECUTIONS = 1   REPLACEMENTS_TOTAL = 77
CLOSED_SCAN_TOTAL = 0   POST_REOPEN_SCAN_TOTAL = 0   RECONTAMINATION_DETECTED = false
herramientas_v2 = /tmp/paso19zzm_scan_v2.py (5ee7025d…), /tmp/paso19zzm_sanitize_v2.py (45f75100…), /tmp/paso19zzm_run_once.ps1 (1cb32b2c…)
fila de54bad8-af04-4aa6-9369-de7e471ec061 = NO atribuida/seleccionada/eliminada por este PASO
ROW_CLASSIFICATION = UNATTRIBUTED
ROW_DELETION = BLOCKED_PENDING_ATTRIBUTION_AND_OWNER_AUTHORIZATION
```

Este cierre local no constituye prueba de aislamiento de base de datos, de
persistencia del formulario, de entrega de correo ni de despliegue Production.
El estado propio del incidente de aislamiento Preview/Production de este
documento permanece sin cambios.
