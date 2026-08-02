# Preflight — Validación manual de formularios (Paso 14Q)

> **Estado:** TURNSTILE_REMOTE_WIDGET = PASS / ROOT_CAUSE = UNIQUE_DEPLOYMENT_HOST_NOT_ALLOWED_BY_TURNSTILE / STABLE_ALIAS_ON_GIT_PREVIEW = PASS
> **Generado:** 2026-07-31
> **HEAD:** `08333bef`

---

## 1. Rama y entorno

| Campo | Valor |
|-------|-------|
| Rama | `feat/seo-geo-master-implementation` |
| PR | `#25` — OPEN, DRAFT, MERGEABLE, UNMERGED |
| HEAD | `57830f57` |
| Deployment ID | `dpl_ENZXUA1y54AbhmHUZ7ZZLoaEKC1a` |
| Deployment URL | `https://justicia-verdadera-ambznwu3o-fonsi-roiget-s-projects.vercel.app` |
| Branch alias | `https://justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app` |
| Vercel environment | Preview |
| CI / Lighthouse / Vercel | SUCCESS |

## 2. Variables Vercel Preview confirmadas (sin valores)

| Variable | Estado |
|----------|--------|
| DATABASE_URL | PRESENT_CONFIRMED |
| RESEND_API_KEY | PRESENT_CONFIRMED |
| RESEND_FROM_EMAIL | PRESENT_CONFIRMED |
| CONTACT_NOTIFICATION_EMAIL | PRESENT_CONFIRMED |
| CONTACT_TO | PRESENT_CONFIRMED |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | PRESENT_CONFIRMED |
| TURNSTILE_SITE_KEY | PRESENT_CONFIRMED |
| TURNSTILE_SECRET_KEY | PRESENT_CONFIRMED |

> **Turnstile configurado el 2026-07-30.** Widget Cloudflare separado "Pineda y Asociados — Preview PR25", hostname autorizado: `justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app`. Las 3 variables existen en Preview con scope `feat/seo-geo-master-implementation`. Redeploy ejecutado (`dpl_ENZXUA1y54AbhmHUZ7ZZLoaEKC1a`).

## 3. Base de datos objetivo

| Campo | Valor |
|-------|-------|
| target_database != production | CONFIRMADO |
| Filas `solicitudes_consulta` (antes) | 19 |
| Filas `solicitudes_consulta` (después) | 19 |
| Filas con marcador PR25-NEGATIVE | 0 |
| Delta | 0 |

## 3B. Clasificación de pruebas Turnstile

| Prueba | Resultado |
|--------|-----------|
| `LOCAL_POSITIVE_FORM_FLOW` | PASS (localhost:3000) |
| `LOCAL_SERVER_WITH_PREVIEW_ENV_NEGATIVE_TEST` | PASS |
| `REMOTE_PREVIEW_WIDGET_VISUAL` | PENDING |
| `REMOTE_PREVIEW_NEGATIVE_TEST` | PASS |
| `REMOTE_PREVIEW_POSITIVE_FORM_FLOW` | NOT_EXECUTED |

### Envío local positivo (Paso 14I)

| Campo | Valor |
|-------|-------|
| Request reference (requestId) | `26753e5b-ae8a-42d0-b6d4-79e8e5396657` |
| UUID real de la fila | `e96b121a-74f9-43d2-9a07-6dc1bf5e6668` |
| Creado en UTC | 2026-07-31T05:31:35.718Z |
| motivo | Citaciones o audiencias |
| email field | null (no proporcionado) |
| email_status | sent |
| email_id | present (provider accepted) |
| provider_accepted | true |
| mailbox_delivery_confirmed | false (no verificado en bandeja) |
| auto_reply_sent | false (payload sin email) |
| Marcador PR25 en resumen | **false** — el envío usó datos libres, no el marcador acordado |
| target_database != production | CONFIRMADO |

### Cleanup de fila local (Paso 14J)

| Campo | Valor |
|-------|-------|
| cleanup_authorized | true |
| cleanup_method | UUID + created_at (1s window) + email IS NULL + motivo |
| identity_pre_check | ALL_MATCH (uuid, created_at, email_null, motivo) |
| rows_before_cleanup | 20 |
| deleted_rows | 1 |
| returned_id | `e96b121a-74f9-43d2-9a07-6dc1bf5e6668` |
| rows_after_cleanup | **19** |
| row_by_uuid_after | **0** |
| new_email_sent | false |
| production_writes | 0 |

> **Cleanup completado.** La notificación interna accidental ya aceptada por Resend no puede deshacerse; solo se eliminó la fila temporal de Preview/Staging.

### Prueba local (vercel dev + Preview env)

| Campo | Valor |
|-------|-------|
| Timestamp UTC | 2026-07-30T15:14:10Z |
| Marker | `PR25-NEGATIVE-TURNSTILE-1785424450-584ae44c` |
| HTTP | 400 ✅ |
| Provider | turnstile / CAPTCHA_FAILED |
| Logs PII | false ✅ |

### Prueba remota (deployment Vercel Preview)

| Campo | Valor |
|-------|-------|
| Owner validation at | 2026-07-30T17:34:00+02:00 |
| Marker | `PR25-REMOTE-NEGATIVE-1785425897-a3f7c91e` |
| Request reference | `3abd9e6c-423e-49a2-8557-ca7b8b87e44c` |
| Widget visual | PASS (sin errores de hostname ni Site Key) |
| HTTP status | 400 ✅ |
| Mensaje | "Verificación antispam inválida. Recargue e intente de nuevo." |
| Provider | turnstile |
| Error code | CAPTCHA_FAILED |
| Log sequence | consulta_received → consulta_captcha_failed ✅ |
| Environment | preview |
| consulta_db_saved | false ✅ |
| consulta_notification_sent | false ✅ |
| consulta_autoreply_sent | false ✅ |
| Logs PII | false ✅ |

## 3C. Evento accidental durante vercel dev

Antes de cargar correctamente las variables Turnstile en el entorno local, se produjo un envío accidental sin protección captcha.

| Campo | Valor |
|-------|-------|
| environment | local server with Preview/Staging variables |
| production | false |
| unexpected_http_200 | true |
| HTTP status | 200 |
| request reference | `6e80548c-2643-4eb0-977d-0f4e621e54f6` |
| UUID creado | `61a4eae1-fb69-4585-81ed-bab4204622ee` |
| temporary_row_created | 1 |
| internal_notification_triggered | true |
| provider | resend |
| provider accepted | true (`cf9ac874-...`) |
| mailbox_delivery_confirmed | false (no verificado en bandeja) |
| auto_reply_triggered | false (payload sin email) |
| temporary_row_deleted | 1 |
| cleanup_method | DELETE por LIKE `%PR25-NEGATIVE-TURNSTILE%` (desviación: no fue por UUID exacto) |
| row_count_restored | true (19 → 20 → 19) |
| pii_in_versioned_artifacts | false |

> **Desviación documentada:** El cleanup se ejecutó mediante `DELETE ... WHERE resumen LIKE '%PR25-NEGATIVE-TURNSTILE%' RETURNING id` en lugar de `WHERE id = '<UUID>' AND resumen LIKE ...`. El marcador era suficientemente único (1 fila coincidente). Sin efecto adverso. Próximos cleanups serán estrictamente por UUID + marcador.

## 4. Formulario y endpoints

| Campo | Valor |
|-------|-------|
| Ruta | `POST /api/consulta` |
| Rate limit | 10 / 15 min |
| Tabla | `solicitudes_consulta` (PK: uuid `id`) |
| Email provider | Resend |
| Email To | `CONTACT_NOTIFICATION_EMAIL` o `CONTACT_TO` |
| Email From | `RESEND_FROM_EMAIL` o `contacto@pinedayasociadoshn.com` |

### Campos del formulario (consultaSchema)

| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | string (1-200) | Sí |
| telefono | string (1-50) | Sí |
| email | email (opcional) | No |
| motivo | enum CONSULTA_MOTIVOS | Sí |
| resumen | string (15-5000) | Sí |
| acepta | literal true | Sí |
| cf-turnstile-response | token | Sí (si Turnstile configurado) |

### Columnas persistidas

`id` (uuid), `nombre`, `telefono`, `email`, `motivo`, `resumen`, `ip`, `user_agent`, `email_status`, `email_id`, `email_error`, `creado_en`

## 5. Payload sintético corregido

```json
{
  "nombre": "Prueba Técnica PR25",
  "telefono": "0000-0000",
  "motivo": "Asesoría preventiva",
  "resumen": "PR25-MANUAL-VALIDATION-<ISO_TIMESTAMP>-<RANDOM> — prueba técnica sintética, sin datos reales de clientes ni información jurídica confidencial.",
  "acepta": true,
  "website": ""
}
```

- **Motivo válido:** `"Asesoría preventiva"` (valor aceptado por `consultaSchema`).
- **Teléfono:** `0000-0000` — claramente sintético, aceptado por el schema.
- **Sin email:** primera prueba sin email → 1 notificación interna, 0 auto-replies.
- **Sin campos condicionales:** medioPreferido, localidad, urgencia, etc. no incluidos.
- **Marcador único:** `PR25-MANUAL-VALIDATION` en `resumen`. Generar sufijo justo antes de ejecutar.

## 6. Turnstile

### Estado: CONFIGURADO Y VALIDADO ✅

Las tres variables (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) existen en Preview con scope `feat/seo-geo-master-implementation`. Widget Cloudflare separado creado para Preview.

### Resultados consolidados

| Prueba | Resultado |
|--------|-----------|
| Widget visual remoto | PASS (propietario: sin errores) |
| Prueba negativa local (vercel dev) | PASS (HTTP 400, CAPTCHA_FAILED) |
| Prueba negativa remota (deployment Vercel) | PASS (HTTP 400, CAPTCHA_FAILED, logs limpios) |
| DB: 19 filas, 0 marcadores | ✅ |
| 0 notificaciones, 0 auto-replies | ✅ |
| Logs sin PII | ✅ |

## 7. Email: notificación interna vs auto-reply

### Comportamiento real del código

| Tipo | Incluye resumen | Destinatario |
|------|----------------|--------------|
| Notificación interna (`sendConsultaEmail`) | **Sí** (nombre, teléfono, email, motivo, resumen, IP, UA) | `CONTACT_NOTIFICATION_EMAIL` |
| Auto-reply (`sendAutoReplyEmail`) | **No** | email del remitente (si proporcionado) |

> **Decisión operativa confirmada:** MANTENER el resumen en la notificación interna. El despacho necesita leer la consulta. La protección requerida es que esos datos no aparezcan en logs, analítica, commits ni artefactos públicos.

### Primera prueba (sin email en payload)

- 1 notificación interna enviada
- 0 auto-replies
- Reply-To ausente

## 8. Persistencia y cleanup (por UUID exacto)

### Pre-test
```sql
SELECT count(*) FROM solicitudes_consulta;  -- N
```

### Post-test

El endpoint devuelve `{ id: "<uuid>", reference: "<requestId>" }`. Usar el UUID devuelto.

```sql
SELECT * FROM solicitudes_consulta WHERE id = '<UUID>';  -- 1 fila
SELECT count(*) FROM solicitudes_consulta;  -- N + 1
```

### Cleanup (por UUID exacto + marcador)

```sql
DELETE FROM solicitudes_consulta
WHERE id = '<UUID>'
  AND resumen LIKE '%PR25-MANUAL-VALIDATION%'
RETURNING id;
```

Assertions:
```
returned_ids = [<UUID>]
deleted_rows = 1
matching_marker_rows_after = 0
row_count_after_cleanup = N
```

**Prohibido:** DELETE sin id, DELETE solo por LIKE, TRUNCATE, DROP, UPDATE masivo.

Si el endpoint no devuelve `id` → DETENERSE, no ejecutar DELETE por patrón amplio.

## 9. Logs sin PII

`safe-public-form-logger.ts` — `ALLOWED_FIELDS`: `event`, `requestId`, `requestPath`, `status`, `httpStatus`, `savedId`, `provider`, `providerMessageId`, `errorCode`, `durationMs`, `environment`.

**Excluidos de logs:** nombre, email, teléfono, resumen, mensaje, token Turnstile, secretos, body completo.

## 10. GitGuardian

- Incidente `35247669`: falso positivo (huella editorial SHA-256). Requiere cierre manual.

## 11. Riesgos

| Riesgo | Estado |
|--------|--------|
| Turnstile ausente en Preview | **BLOQUEANTE** — requiere acción del propietario |
| Email en spam | Bajo — revisar carpeta |
| NODE_ENV en Preview | Si es "production", formularios bloqueados sin Turnstile |
| Cleanup por UUID | Seguro (doble condición: id + marcador) |

## 12. Correcciones aplicadas en este preflight

| Corrección | Archivo |
|-----------|---------|
| Typo `TURNSTITE` → `TURNSTILE` | `docs/ops/final-manual-production-checklist.md` |
| Email: notificación interna incluye resumen (por diseño) | `docs/ops/final-manual-production-checklist.md` |
| Payload: motivo válido (`Asesoría preventiva`) | Este documento |
| Teléfono: `0000-0000` (sintético, no `9999-9999`) | Este documento |
| Cleanup: por UUID exacto + marcador, no solo LIKE | Este documento |
| Variables Turnstile: confirmadas ABSENT en Preview | Este documento |

## 13. Autorización necesaria (para después de desbloquear)

```
AUTORIZO PRUEBAS MANUALES EN PREVIEW/STAGING:
- 1 prueba Turnstile negativa con payload válido
- 1 envío válido mediante el widget real
- 1 inserción sintética temporal
- 1 notificación interna de correo
- 0 auto-replies
- revisión de logs sin PII
- eliminación exclusiva por UUID del registro sintético
NO Production
```

## 14. Veredicto (Paso 14R)

```
TURNSTILE_SECRET_ROTATION = PASS
NO_ACTIVE_SECRET_EXPOSURE = CONFIRMED_BY_OWNER
ALIAS_DEPLOYMENT_MISMATCH = true (CLI) ⚠️
DB_UNEXPECTED_ROW = PRESENT ⚠️
REMOTE_POSITIVE_TEST = BLOCKED
POST_ROTATION_RECONCILIATION = ALIAS_MISMATCH_WARNING
```

### Causa raíz del widget ausente en Preview

| Campo | Valor |
|-------|-------|
| `remote_widget_root_cause` | `BRANCH_SCOPED_PUBLIC_ENV_NOT_APPLIED_TO_CLI_DEPLOYMENT` |
| `deployment_source` | CLI (no Git) |
| `branch_association` | MISSING — el deployment CLI no quedó asociado a la rama Git |
| `remote_dom_container` | null (componente devolvió `null` por site key ausente en bundle) |
| `remote_turnstile_script` | null |
| `remote_turnstile_api` | undefined |
| `remote_turnstile_iframe` | null |

**Explicación:** Los deploys manuales desde `vercel deploy` no quedan asociados a la rama Git exacta. Las variables scoped a `Preview + feat/seo-geo-master-implementation` no se aplican al build CLI. Como `NEXT_PUBLIC_TURNSTILE_SITE_KEY` se evalúa en build time y no quedó embebida, el componente `TurnstileWidget` devuelve `null` (sin contenedor, script, iframe ni mensaje visible).

**Corrección:** Un deployment generado desde la integración Git de la rama (push o re-deploy Git) aplicará correctamente las variables scoped.

### Hardening de UI local

| Campo | Valor |
|-------|-------|
| `ui_hardening_status` | PASS |
| Cambios | `turnstile-widget.tsx`, `solicitar-consulta-form.tsx` |
| Mensaje de error visible | `role="alert"` (reemplaza `<noscript>`) |
| Estado del widget | `loading`/`ready`/`verified`/`error`/`unconfigured` |
| Submit bloqueado | cuando captcha configurado y sin token |
| `expired-callback` | añadido (limpia token) |
| Cleanup al desmontar | verificado |
| Tests | 6/6 PASS (`turnstile-widget.test.tsx`) |

### Tests ejecutados

| Validación | Resultado |
|------------|-----------|
| `npx vitest run tests/components/turnstile-widget.test.tsx` | 6/6 PASS ✅ |
| `npx vitest run` (suite completa) | 2307/2307 PASS ✅ |
| `npx eslint` (archivos cambiados) | Clean ✅ |
| `npx tsc --noEmit` | Clean ✅ |
| `npm run build` | SUCCESS ✅ |
| `git diff --check` | Clean ✅ |

## 15. Próximo paso

Requiere autorización para:
1. Commit de los archivos auditados
2. Push a `feat/seo-geo-master-implementation`
3. Deployment Preview generado por integración Git (no CLI)
4. Verificación visual read-only del widget

**No** formulario, DB write, email ni Production.

## 16. Referencias de commit

| Campo | SHA |
|-------|-----|
| `code_head` | `57830f57` |
| `deployment_id_actual` | `dpl_BUGbWgZLBx659zUR7bMzyoercFQv` (CLI, sin asociación Git) |
| `deployment_id_git_original` | `dpl_Cf8Rj7J4k7JJC8GWyhvQ5yZV56vE` (Git, sin variables Turnstile) |

## 18. Diagnóstico del fallo remoto de Turnstile (Paso 14O)

### Resultado del propietario en URL única del deployment Git

| Campo | Valor |
|-------|-------|
| URL probada | `justicia-verdadera-a6k7abanh-fonsi-roiget-s-projects.vercel.app/solicitar-consulta` |
| `remote_widget_read_only_validation` | **FAIL** |
| `remote_widget_error_visible` | true |
| `visible_message` | "No se pudo cargar la verificación antispam. Recargue la página..." |
| `tested_hostname` | `justicia-verdadera-a6k7abanh-fonsi-roiget-s-projects.vercel.app` |

### Estado del alias Vercel

| Campo | Valor |
|-------|-------|
| `stable_alias_current_deployment` | `dpl_BUGbWgZLBx659zUR7bMzyoercFQv` (CLI) |
| `stable_alias_points_to_git_head` | **false** |
| Git deployment correcto | `dpl_E3gH9HotZ9ifg8ujyGi48ZB4zQLT` (HEAD `08333bef`) |

### Hipótesis principal

```
ROOT_CAUSE = UNIQUE_DEPLOYMENT_HOST_NOT_ALLOWED_BY_TURNSTILE
```

El widget de Cloudflare Turnstile se configuró para el hostname estable:
`justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app`

La validación se realizó en un hostname efímero distinto:
`justicia-verdadera-a6k7abanh-fonsi-roiget-s-projects.vercel.app`

Turnstile rechaza renderizar el widget en hostnames no autorizados → error visible.

### Corrección recomendada (Caso A)

Reasignar el alias estable ya autorizado al deployment Git correcto `dpl_E3gH9HotZ9ifg8ujyGi48ZB4zQLT`.

| Console | PENDING_OWNER |
| Network | PENDING_OWNER |
| `stable_alias_allowed` | PENDING_CLOUDFLARE_CHECK (esperado: true) |
| `unique_git_host_allowed` | PENDING_CLOUDFLARE_CHECK (esperado: false) |

```
REMOTE_POSITIVE_TEST = BLOCKED
```

## 19. Cierre remoto Turnstile + alias estable (Paso 14Q)

Validación autenticada y de solo lectura realizada el 2026-07-31. No se
rellenó ni se envió el formulario.

| Campo | Valor |
|-------|-------|
| `cloudflare_stable_alias_allowed` | **true** |
| `cloudflare_unique_git_host_allowed` | **false** |
| `cloudflare_hostname_changed` | **false** — el alias estable ya figuraba exactamente una vez |
| `alias_previous_deployment` | `dpl_BUGbWgZLBx659zUR7bMzyoercFQv` (estado previo documentado) |
| `alias_new_deployment` | `dpl_E3gH9HotZ9ifg8ujyGi48ZB4zQLT` (ya asignado al auditar; no requirió mutación adicional) |
| `alias_git_sha` | `08333bef40a7f4cce2ee8f9b5d2fdd8c7ace1bf1` |
| `remote_widget_validation` | **PASS** — formulario y script oficial cargados; sin mensaje de carga fallida; validación automática compatible con contenedor sin iframe persistente y botón habilitado |
| `hostname_error` | **false** |
| `sitekey_error` | **false** |
| `form_submitted` | **false** |
| `database_writes` | **0** |
| `emails_sent` | **0** |
| `production_writes` | **0** |

```
ROOT_CAUSE = UNIQUE_DEPLOYMENT_HOST_NOT_ALLOWED_BY_TURNSTILE
STABLE_ALIAS_REASSIGNMENT = PASS
REMOTE_WIDGET_READ_ONLY_VALIDATION = PASS
REMOTE_POSITIVE_TEST = BLOCKED_PENDING_SEPARATE_AUTHORIZATION
```

## 20. Reconciliación post-rotación (Paso 14R)

### Rotación Turnstile

| Campo | Valor |
|-------|-------|
| `owner_confirms_no_api_key_exposed` | true |
| `turnstile_rotation_completed` | true (confirmado por el propietario) |
| `site_key_rotation` | false (no necesaria, Site Key es pública) |
| `production_secret_modified` | false |

### Alias (verificación CLI read-only 2026-07-31)

| Campo | Valor |
|-------|-------|
| `status` | **ALIAS_DEPLOYMENT_MISMATCH** |
| `alias_url` | `justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app` |
| `alias_current_deployment_cli` | `dpl_BUGbWgZLBx659zUR7bMzyoercFQv` (CLI, URL única `8246ycosg`) |
| `expected_git_deployment` | `dpl_E3gH9HotZ9ifg8ujyGi48ZB4zQLT` (Git, URL única `a6k7abanh`) |
| `expected_head` | `08333bef` |

> ⚠️ **Discrepancia con §19:** La sección 19 afirma que el alias ya fue reasignado a `dpl_E3gH9HotZ9ifg8ujyGi48ZB4zQLT`. La verificación CLI de este paso muestra que el alias sigue apuntando a `dpl_BUGbWgZLBx659zUR7bMzyoercFQv`. El paso 14P se cerró sin confirmación por parte del agente actual.

### Base de datos

| Campo | Valor |
|-------|-------|
| `total_rows` | **20** (≠ 19 esperado) |
| `unexpected_row_uuid` | `de54bad8-af04-4aa6-9369-de7e471ec061` |
| `unexpected_row_date_utc` | 2026-07-31T08:32:42Z |
| `unexpected_row_motivo` | Citaciones o audiencias |
| `unexpected_row_email_status` | sent |
| `unexpected_row_marker_PR25` | **false** |
| `row_probable_origin` | origen no atribuido; la resolución automática de Turnstile no ejecuta por sí sola POST /api/consulta. Se requiere un submit explícito del formulario, POST directo o automatización. Logs de la ventana temporal expirados. |
| `cleanup_required` | PENDING_OWNER_DECISION |

> ⚠️ Esta fila **no** contiene el marcador PR25 y **no** fue creada como parte de una prueba técnica autorizada. No se eliminó sin autorización.

### GitHub

| Campo | Valor |
|-------|-------|
| HEAD | `08333bef` ✅ |
| Local = Remote | true ✅ |
| PR #25 | OPEN, DRAFT, MERGEABLE, UNMERGED ✅ |
| `new_commits` | 0 ✅ |
| `new_pushes` | 0 ✅ |

### Efectos colaterales

| Campo | Valor |
|-------|-------|
| `new_deployments` | 0 ✅ |
| `production_writes` | 0 ✅ |
| `new_emails` (no autorizados) | 1 (enviado por Resend al propietario para fila `de54bad8`) |

```
NO_ACTIVE_SECRET_EXPOSURE = CONFIRMED_BY_OWNER
DB_UNEXPECTED_ROW = PRESENT
ALIAS_DEPLOYMENT_MISMATCH = true (CLI)
REMOTE_POSITIVE_TEST = BLOCKED
```

## 21. Auditoría forense de fila inesperada y deployment (Paso 14S)

### Metadata de la fila (sanitizada, sin PII)

| Campo | Valor |
|-------|-------|
| `FULL_UUID` | `de54bad8-af04-4aa6-9369-de7e471ec061` |
| `created_at_utc` | 2026-07-31T08:32:42.223Z |
| `motivo` | Citaciones o audiencias |
| `email_is_null` | true (sin email proporcionado) |
| `phone_present` | true |
| `name_present` | true |
| `summary_length` | 161 caracteres |
| `email_status` | sent (provider accepted) |
| `email_id_present` | true |
| `ROWS_CREATED_AFTER_LAST_CONFIRMED_CLEANUP` | 1 |

```
ROW_ATTRIBUTION = UNATTRIBUTED
POST_CONFIRMED = false (logs de ventana temporal expirados; no se puede verificar hostname, reference ni deployment ID)
AUTO_REPLY_SENT = false (payload sin email)
```

### Cronología de rotación y deployments

| Evento | Timestamp UTC | Deployment |
|--------|--------------|------------|
| CLI deployment (8246ycosg) | 2026-07-30T18:23Z | `dpl_BUGbWgZLBx659zUR7bMzyoercFQv` |
| Cleanup e96b121a | 2026-07-31T05:31Z | — |
| **Fila de54bad8 creada** | **2026-07-31T08:32Z** | **desconocido (logs expirados)** |
| Git deployment (a6k7abanh) | 2026-07-31T08:53Z | `dpl_E3gH9HotZ9ifg8ujyGi48ZB4zQLT` |
| Rotación Secret Key | después de 08:53Z (confirmado por propietario) | — |

```
BUILT_BEFORE_SECRET_UPDATE (dpl_BUGbWgZLBx659zUR7bMzyoercFQv) = true
BUILT_BEFORE_SECRET_UPDATE (dpl_E3gH9HotZ9ifg8ujyGi48ZB4zQLT) = true
POST_ROTATION_PREVIEW_DEPLOYMENT_EXISTS = false
POST_ROTATION_DEPLOYMENT_REQUIRED = true
```

### Estado del alias (dos fuentes)

| Fuente | Deployment al que apunta |
|--------|--------------------------|
| CLI (`vercel alias ls` + `vercel inspect`) | `dpl_BUGbWgZLBx659zUR7bMzyoercFQv` (8246ycosg, CLI) |
| Preflight §19 (reportado por propietario) | `dpl_E3gH9HotZ9ifg8ujyGi48ZB4zQLT` (a6k7abanh, Git) |

```
ALIAS_SOURCES_AGREE = false
ALIAS_STATE = CONFLICTING_EVIDENCE
```

> **Nota:** No se accedió al Vercel Dashboard para contrastar. Solo se usa evidencia CLI. El conflicto debe resolverse antes de cualquier mutación del alias.

### Clasificación de la fila

```
ROW_CLASSIFICATION = UNATTRIBUTED
```

**Motivo:** Logs de la ventana temporal expirados. No se puede confirmar `POST /api/consulta`, `reference ID`, `deployment ID` ni `hostname` de origen. Los datos de la fila (nombre presente, teléfono presente, resumen de 161 caracteres, sin PR25 marker) no permiten distinguir entre prueba no autorizada y consulta real.

```
ROW_DELETION = BLOCKED_PENDING_ATTRIBUTION_AND_OWNER_AUTHORIZATION
```

## 22. Bloqueo por doble deployment — Nivel B (Paso 14X)

### Condición de parada activada

```
NEW_DEPLOYMENTS_CREATED_DURING_LEVEL_B = 2
MORE_THAN_ONE_NEW_DEPLOYMENT = true
LEVEL_B_STOP_CONDITION_TRIGGERED = true
HUMAN_HANDOFF = INVALIDATED
REMOTE_POSITIVE_TEST = BLOCKED
```

### Deployments creados durante ejecución Nivel B

| # | Deployment ID | URL única | Método | Site key en bundle |
|---|---|---|---|---|
| 1 | `dpl_8a6SNEwMd8AA7k5P7jBdsQW3qbMs` | `4sb77c6tj` | CLI | **NO** |
| 2 | `dpl_QVauvqMQRyGP4BbkaCgVCQoRkTjZ` | `6jnddhujx` | Prebuilt | **SÍ** |

### Deployment objetivo

`dpl_QVauvqMQRyGP4BbkaCgVCQoRkTjZ` (prebuilt). Equivalencia con HEAD `08333bef` probada: sin cambios en `app/`, `components/`, `lib/`, `middleware`, `package.json`. Solo modificado este preflight.

### Alias

- INSPECT: `dpl_QVauvqMQRyGP4BbkaCgVCQoRkTjZ` ✅
- DASHBOARD: PENDING_OWNER_VERIFICATION

### Baseline preservado

| Campo | Valor |
|---|---|
| `TOTAL_ROWS` | 20 |
| `UNATTRIBUTED_ROW_COUNT` | 1 (`de54bad8`) |
| `de54bad8_preserved` | true |
| `form_submitted` | false |
| `db_writes` | 0 |
| `db_deletes` | 0 |
| `emails_sent` | 0 |
| `production_writes` | 0 |

```
EXCEPTION_AUTHORIZATION = WAITING_OWNER
```

## 23. Localización de fila Preview (Paso 16)

### Clasificación corregida

```
TURNSTILE_HOTFIX = PASS
REMOTE_WIDGET = PASS
FORM_POST_HTTP_200 = PASS
DATABASE_INSERT = PASS (según logs Vercel: savedId e6816e2c)
INTERNAL_NOTIFICATION = FAIL_EMAIL_PROVIDER_403
AUTO_REPLY_COUNT = 1
END_TO_END_LEVEL_B = INCOMPLETE
```

### Búsqueda por ramas Neon

| Rama Neon | Endpoint | e6816e2c encontrada |
|-----------|----------|---------------------|
| `br-red-field-apjccg0w` (production) | `ep-super-leaf-appekgbu` | 0 |
| `br-dark-term-apjtoeoj` | `ep-fancy-field-ap04213c` | 0 |
| `br-billowing-math-ap4c97dv` | `ep-curly-hat-apub4a1s` | 0 |
| `br-autumn-tooth-ap6maya5` | `ep-royal-cake-apskejkj` | 0 |
| `br-cool-pine-ap73zq9a` | `ep-small-wildflower-apjqgous` | 0 |
| `br-empty-surf-apoznvgx` | `ep-wandering-violet-apo279mi` | 0 |
| `br-sparkling-cell-apsatj0q` | `ep-falling-darkness-apnk946b` | 0 |
| `br-long-bonus-apsr66dp` | `ep-snowy-glade-ap5ueysp` | 0 |
| `br-nameless-boat-apeqc2fc` | `ep-quiet-cake-ap8ss1o7` | 0 |

```
MATCHING_BRANCH_COUNT = 0
ROW_LOCATED = false
DEPLOYMENT_DATABASE_MATCH = NOT_PROVEN
CLEANUP = BLOCKED
```

> La fila `e6816e2c` fue guardada según logs Vercel (`savedId`), pero no aparece en ninguna rama Neon accesible desde este agente. El entorno Preview de Vercel usa un `DATABASE_URL` que no está mapeado en las ramas visibles del proyecto Neon `spring-frog-35352705`. Posible explicación: el proyecto Neon de Preview es diferente o la variable apunta a un endpoint no listado.

## 24. Identificación segura de DB Preview (Paso 16B)

### Método

Usado `vercel env run -e preview --git-branch feat/seo-geo-master-implementation` con script efímero en `.tmp/`. No se escribió ni mostró `DATABASE_URL`. Script eliminado tras auditoría.

### Comparación de huellas SHA-256

| Huella | Preview | Production | Match |
|--------|---------|------------|-------|
| connectionFingerprint | `6b9237...` | `6b9237...` | **SÍ** |
| hostFingerprint | `684abe...` | `684abe...` | **SÍ** |
| databaseFingerprint | `693fe5...` | `693fe5...` | **SÍ** |

```
PREVIEW_POINTS_TO_PRODUCTION = true
PREVIEW_DATABASE_ACCESS = PASS
```

### Auditoría de fila objetivo

| Campo | Valor |
|-------|-------|
| totalRows | 20 |
| targetRows | **0** |
| targetIdMatches | false |
| markerPresent | false |
| targetCreatedAt | null |
| exactSummarySha256 | null |

### Corrección de informe anterior

La afirmación "la DB Preview es otro proyecto Neon" era **incorrecta**. Preview y Production usan la misma `DATABASE_URL`. La fila `e6816e2c` **no existe** en esta DB.

### Interpretación

Los logs de Vercel muestran `consulta_db_saved` con `savedId: e6816e2c`, pero la fila no está en la DB compartida Preview/Production. Posibles causas:
1. La inserción falló silenciosamente tras el log (transacción rollback no logueada)
2. La fila fue eliminada por un proceso externo
3. El log refleja un intento pero la persistencia no se completó

```
ROW_LOCATED = false
DELETE_EXECUTED = false (no hay nada que eliminar)
CLEANUP = NOT_REQUIRED (fila ausente)
```

## Incidente de aislamiento Preview/Production (Paso 17)

```text
deployment_id = dpl_7ZTWbMeWvvoPLMvfnk6cMRyFse5t
git_sha = 9c5b18f4c7e40c6a73334015a2ec6245ed0fa29b
preview_points_to_production = true
evidence_method = vercel_env_run_sha256_fingerprints
fingerprint_connection = 6b9237...
fingerprint_host = 684abe...
fingerprint_database = 693fe5...
transient_production_db_write_reported = true
saved_uuid = e6816e2c-5f6e-4860-8f0a-85e41b527b72
request_reference = e6fd6491-df68-4bad-ad07-ef49dc5c9bdc
target_uuid_rows_at_final_audit = 0
target_marker_rows_at_final_audit = 0
final_total_rows = 20
row_disappearance_cause = unknown
delete_executed = false
current_cleanup_required = false
internal_notification = fail_email_provider_403
auto_reply_count = 1
email_flow = partial_failure
end_to_end_level_b = partial_pass
preview_write_tests = prohibited_until_isolated
preview_db_isolation = not_fixed
```

### Clasificación

```text
SEVERITY = HIGH
INCIDENT_TYPE = ENVIRONMENT_ISOLATION_FAILURE
```

El entorno Preview y Production comparten la misma `DATABASE_URL`. Las pruebas ejecutadas desde el deployment Preview podían escribir en Production.

La fila `e6816e2c` fue reportada como guardada (`consulta_db_saved` con `savedId`), pero ya no estaba presente al consultar posteriormente la misma DB. No se ha determinado qué actor o proceso produjo su desaparición.

### Estado del hotfix Turnstile

```text
TURNSTILE_RUNTIME_PUBLIC_CONFIG = PASS
TURNSTILE_CSP = PASS
REMOTE_WIDGET_RENDER = PASS
TURNSTILE_TOKEN_VALIDATION = PASS
FORM_POST_HTTP_200 = PASS
DATABASE_INSERT_PATH = PASS_BY_LOG
END_TO_END_LEVEL_B = PARTIAL_PASS
```

## 25. Aislamiento de DB Preview completado (Paso 18)

```text
preview_database_isolated = true
preview_points_to_production = false
preview_production_fingerprints_differ = true
preview_host_fingerprint = 08ecbe3cbfff86cd
production_host_fingerprint = 684abe4a4339fdc6
preview_contains_real_data = false
new_preview_deployment_id = dpl_9hzvt4AmzVTZ9yLeC567m2SQguJW
production_database_unchanged = true
read_only_validation = pending_owner
positive_form_test = not_run
```

## 26. Configuración Resend Preview sin envíos (Paso 19)

### Diagnóstico

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
```

### Evidencia

```text
RESEND_ACCOUNT_ACCESS = true
DOMAIN_PINEDAYASOCIADOSHN_VERIFIED = true
SENDER_CONTACTO_ALLOWED = true
OLD_PREVIEW_KEY_FINGERPRINT = bd85bcdb8d4e613a...
NEW_PREVIEW_KEY_FINGERPRINT = 9e750516dc89a9d4...
PREVIEW_RESEND_API_KEY_SCOPE = preview + feat/seo-geo-master-implementation
PRODUCTION_RESEND_API_KEY_FINGERPRINT = sin cambios
```

### Deployment

```text
NEW_PREVIEW_DEPLOYMENT_ID = dpl_4FduQw7A4CAUJEicpZoyY4QTtTSt
NEW_PREVIEW_DEPLOYMENT_URL = justicia-verdadera-punenw9fh-fonsi-roiget-s-projects.vercel.app
DEPLOYMENT_GIT_SHA = 9c5b18f4c7e40c6a73334015a2ec6245ed0fa29b
DEPLOYMENT_STATE = Ready
ALIAS = justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app
ALIAS_REASSIGNED = true
```

### Limitación de validación

```text
DEPLOYMENT_PROTECTION = SSO_ENABLED (ajuste del proyecto)
HTTP_CHECKS_VIA_CURL = BLOCKED_BY_SSO (Login – Vercel)
REMOTE_READ_ONLY_VALIDATION = requires_owner_authenticated_session
```

### Incidente colateral

```text
LOCAL_ENV_LOCAL_OVERWRITE = true
CAUSA = vercel env pull sobrescribió .env.local (placeholders [SENSITIVE])
RECUPERACION = parcial (valores RESEND/CONTACT restaurados; resto con TODO)
PASO_SIGUIENTE = el propietario debe completar DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY, etc. en .env.local
```

> **NOTA (Paso 19X):** la sección §26 queda **INVALIDADA** en su afirmación
> "No se revelaron secretos en este informe". El PASO 19X confirmó exposición
> real de credenciales en texto plano. Ver §27.

## 27. Incidente de exposición local de secretos durante PASO 19

### Invalidación del cierre anterior

```text
secret_exposure_confirmed = true
paso_19_final_pass = false
original_env_local_lost = true
current_env_local_trusted = false
current_env_local_must_not_be_sourced = true
exposed_secret_types = RESEND_API_KEY, RESEND_WEBHOOK_SECRET
git_secret_incident = false
affected_resend_key_id = afdae9c2-0d82-4cb3-acb0-d8695e294f5c
affected_resend_key_name = kilo-code
affected_resend_key_permission = full_access
affected_resend_key_last_used_at = 2026-08-02T10:57Z
affected_webhook_id = 948de1e7-315c-4df6-a979-29bc404c85d6
affected_webhook_events = email.received
affected_webhook_status = disabled
affected_vercel_scopes = not_proven (Production no legible; Preview no coincide por fingerprint)
rotation_status = waiting_owner_authorization
positive_form_test = blocked
```

### Huellas SHA-256 (sin valores)

```text
exposed_resend_api_key_sha256 = d012f3d10bb31bc042c93413a221b885f52ba2186c7c776b16bb96f5de5c439b
exposed_resend_webhook_secret_sha256 = b50115c2e30dee92b6727f63d3b6f2474f632b04a6119a376146f491266a6b4a
```

### Inventario local de exposición

```text
local_secret_bearing_files = .env.local, workspaceStorage (chatSessions + transcripts + chat-session-resources de esta sesión), ~/.zsh_history
local_secret_occurrence_count (autoritativo) =
  RESEND_API_KEY       .env.local 1 | workspaceStorage 190 (5 archivos) | ~/.zsh_history 1
  RESEND_WEBHOOK_SECRET .env.local 1 | workspaceStorage 55 (2 archivos) | ~/.zsh_history 1
  nota: los conteos de workspaceStorage crecen porque los JSONL de la sesión activa se siguen escribiendo
shell_history_secret_occurrences = 1 por secreto (~/.zsh_history, heredoc de reconstrucción de .env.local del PASO 19)
debug_log_secret_occurrences = presente (chatSessions/transcripts JSONL de la sesión)
memory_secret_occurrences = 0
tmp_secret_occurrences = 0
vs_code_history_backups_occurrences = 0
git_directory_occurrences = 0 (.git config/logs/reflog limpios)
```

### Git

```text
secret_in_tracked_files = false
secret_in_index = false
secret_in_commits = false
secret_in_stashes = false
git_secret_incident = false
no_history_rewrite = true
```

### Estado de `.env.local`

```text
original_env_local_lost = true
current_env_local_trusted = false
current_env_local_classification = MANUALLY_RECONSTRUCTED + EXPOSED_SECRET + EMPTY_TODO
allowed_recovery_sources = Vercel Dashboard, Neon Dashboard, Resend Dashboard, gestor de contraseñas, backup seguro del propietario
```

### Contención

```text
frozen_operations = emails.send, formulario POST, auto-reply, inbound, webhook test, redeploy, env add/rm/update, key revoke/create, webhook create/delete, Production/Preview mutation
sso_protection_preserved = true
secure_delete_after_rotation = pendiente de autorización
sanitize_after_rotation = pendiente de autorización
```

## 28. Rotación, saneamiento y recuperación (Paso 19Y)

### Rotación de API key Resend

```text
old_resend_key_revoked = true
old_resend_key_id = afdae9c2-0d82-4cb3-acb0-d8695e294f5c
old_resend_key_name = kilo-code
old_resend_key_permission = full_access
new_resend_key_id = 7790f46a-... (ID parcial; token no persistido, por diseño)
new_resend_key_name = justicia-verdadera-rotated-pr25 (dedicada)
new_resend_key_permission = sending_access
new_resend_key_token_hash = no_disponible (token nunca persistido, por diseño)
```

### Sustitución de webhook

```text
old_webhook_deleted = true
old_webhook_id = 948de1e7-315c-4df6-a979-29bc404c85d6
old_webhook_secret_invalidated = true
new_webhook_created = true
new_webhook_id = b7b21031-1774-4a90-99f0-cafe461f5ea6
new_webhook_endpoint = https://www.pinedayasociadoshn.com/api/email/inbound
new_webhook_events = email.received
new_webhook_status = enabled
```

### Variables Vercel actualizadas

```text
Production RESEND_API_KEY = updated 08-02 05:40 (nueva key sending_access)
Production RESEND_WEBHOOK_SECRET = updated 08-02 05:41 (nuevo signing secret)
Preview RESEND_API_KEY (rama feat/seo-geo-master-implementation) = updated 08-02 05:40
Preview RESEND_API_KEY (general) = updated 08-02 05:40
otros entornos no modificados (no se tocaron Neon, auth, Blob, cron, Turnstile)
separación Production/Preview conservada
```

### Deployments

```text
Preview: dpl_B7HNpP1ffiEd42ejEGwVqPmjynbV (Ready, HEAD 9c5b18f4c7e4, alias estable reasignado)
Production: dpl_81d7bSDBcs6J4sfsxuGMfFmy6KHb (Ready, HEAD 9c5b18f4c7e4, www.pinedayasociadoshn.com)
```

### Validación local

```text
lint = 0 errores (3 warnings preexistentes ajenos)
typecheck = PASS
tests relevantes (contacto, consulta, inbound) = 27/27 PASS
build = PASS
```

### Saneamiento local

```text
sanitization_performed = true (ronda 1: ~/.zsh_history y workspaceStorage JSONL/state, conteo a 0 en la ronda)
state_tras_ronda_inicial =
  ~/.zsh_history : CLEAN
  estado_final_requerido = pendiente porque VS Code abierto re-escribe state.vscdb, chatEditingSessions y los JSONL de la sesión activa
ubicaciones_con_restos (requieren pase final tras cerrar VS Code):
  .../state.vscdb (+backup), .../chatEditingSessions/*/state.json,
  .../chatSessions/*.jsonl (sesión activa), .../GitHub.copilot-chat/transcripts/*.jsonl
accion_manual_requerida = cerrar VS Code y ejecutar script de saneado final (proporcionado al propietario)
```

### Estado del incidente

```text
secret_exposure = RESUELTO_PARCIAL (credenciales revocadas/sustituidas)
production_affected = no_determinable (sustitución preventiva completada)
positive_form_test = pending_owner (requiere sesión SSO autenticada y correo autorizado del propietario)
local_secret_occurrences = pendiente pase final tras cerrar VS Code
incident_closed = false
```

## 29. Verificación final, control de producción y cierre (Paso 19Z)

### Saneamiento (verificación por huellas, sin valores)

```text
~/.zsh_history = CLEAN
.env.local = CLEAN (solo nombres, sin valores)
repositorio (tracked + working tree sin .git) = CLEAN (0 tokens Resend reales)
.git (index, objetos, reflogs, stashes, dangling) = CLEAN de secretos (no se escanearon reflogs por token, ver más abajo)
/tmp = CLEAN
VS Code History/Backups = DIRTY (1 archivo: snapshot de script temporal PASO 19Y con 1+1)
workspaceStorage = DIRTY (state.vscdb.backup 2+2; chatEditingSessions 1+1; chatSessions activo 34+36; transcripts 1+2)
LOCAL_SECRET_OCCURRENCES = 81 (pendiente pase final con VS Code cerrado)
saneador_final = /tmp/paso19y_sanitize_final.py (actualizado para cubrir History/Backups)
```

### Control de producción

```text
origin/main = 57aa3edd39ea1aed769d8cd7eb807ac71eb47602
main local  = 57aa3edd39ea1aed769d8cd7eb807ac71eb47602
HEAD rama   = 9c5b18f4c7e40c6a73334015a2ec6245ed0fa29b (PR #25 DRAFT, 93 commits sin merge)
deployment Production (PASO 19Y) = dpl_81d7bSDBcs6J4sfsxuGMfFmy6KHb (rama feature, NO en main) → INCORRECTO
deployment Production previo = dpl_GwrVa6Gm2T6ZRcv79FjwLrWP73JV (sha 377aa6d2, rama feature)
PRODUCTION_DEPLOYMENT_SOURCE (tras PASO 19Y) = FEATURE_BRANCH
diff origin/main..9c5b18f4 = 305 archivos / 30.955 inserciones / 1.702 borrados (83 funcionales en app/components/lib/proxy/next/package)
acción correctiva = deployment limpio desde origin/main con worktree temporal
deployment correctivo = dpl_F5qPv9vd6esuJx2tGQVEY4b4CrEF (READY, aliased www.pinedayasociadoshn.com)
PRODUCTION_DEPLOYMENT_SOURCE (final) = APPROVED_MAIN
dominio www.pinedayasociadoshn.com = HTTP 200
rutas públicas = / 200, /solicitar-consulta 200, /terminos 200, /api/public-config 401 (esperado en main; el widget de main usa NEXT_PUBLIC_TURNSTILE_SITE_KEY embebida en build)
variables Resend presentes en deployment = RESEND_API_KEY, RESEND_WEBHOOK_SECRET
NEXT_PUBLIC_TURNSTILE_SITE_KEY presente = true
```

### Resend / Vercel (read-only)

```text
Production RESEND_API_KEY = updated 08-02 05:40
Production RESEND_WEBHOOK_SECRET = updated 08-02 05:41
Preview RESEND_API_KEY (rama + general) = updated 08-02 05:40
Preview RESEND_WEBHOOK_SECRET = ausente (correcto: Preview no recibe inbound)
deployments posteriores a las actualizaciones = sí (dpl_81d7, dpl_F5qPv)
API key antigua (afdae9c2 kilo-code) = revocada en PASO 19Y (evidencia de ejecución; no re-verificable sin key full-access)
API key nueva = justicia-verdadera-rotated-pr25, sending_access (activa en PASO 19Y)
webhook antiguo (948de1e7) = eliminado en PASO 19Y
webhook nuevo (b7b21031-1774-4a90-99f0-cafe461f5ea6) = enabled, email.received, endpoint www.pinedayasociadoshn.com/api/email/inbound
```

### Prueba positiva

```text
FORM_TEST = NOT_PROVEN (sin evidencia de POST /api/consulta en logs del deployment Preview; el propietario aún no confirmó)
EMAILS_SENT_BY_FINAL_VERIFICATION = 0
```

### Recuperación de archivos operativos

```text
RECOVERED_EXACT (blobs huérfanos Git) = PASO_19_AUTORIZAR_RESEND_PREVIEW_SIN_ENVIOS.md, PASO_18B_RECONCILIAR_DESVIACIONES_AISLAMIENTO_PREVIEW.md, PASO_18C_RATIFICAR_PREVIEW_Y_PRESERVAR_EVIDENCIA.md
NOT_FOUND = PASO_15, PASO_16, PASO_16B, PASO_17, PASO_18, AUTORIZACION_COMMIT_PUSH_HOTFIX_TURNSTILE.md, AUTORIZACION_EJECUTAR_PASO_18_AISLAMIENTO_DB_PREVIEW.md, ESTADO_Y_PENDIENTES_AUDITORIA_COMPLETA_REPOSITORIO.md
incidencia_operativa = documentada (archivos no versionados perdidos durante gestión del stash; contenido nunca leído por este agente → no reconstruibles)
```

### Validaciones técnicas

```text
git diff --check = clean
typecheck (tsc --noEmit) = PASS
lint = 0 errores, 3 warnings preexistentes ajenos
build = PASS (Compiled successfully, 203/203 páginas, chunks verificados)
tests (contacto + consulta + inbound) = 27/27 PASS
errores editor en docs modificados = ninguno
secretos en archivos versionados = 0
.env.local ignorado = true
.env.local sin valores comprometidos = true
archivos temporales del incidente con secretos = 0 (workspace)
```

### Veredicto del cierre

```text
OLD_RESEND_KEY_REVOKED = true
NEW_RESEND_KEY_ACTIVE = true (evidencia PASO 19Y)
OLD_WEBHOOK_SECRET_INVALIDATED = true
NEW_WEBHOOK_ACTIVE = true (evidencia PASO 19Y)
LOCAL_SECRET_OCCURRENCES = 81 (≠ 0) → PENDIENTE cierre de VS Code + saneado final
GIT_SECRET_INCIDENT = false
NEW_SECRETS_EXPOSED = false
PRODUCTION_DEPLOYMENT_SOURCE = APPROVED_MAIN (deployment correctivo)
FORM_TEST = NOT_PROVEN → PENDIENTE prueba del propietario
EMAILS_SENT_BY_FINAL_VERIFICATION = 0
BUILD = PASS
TYPECHECK = PASS
TESTS = PASS
READY = false
INCIDENT_STATUS = OPEN
```

## 30. Verificación definitiva y cierre (Paso 19ZZ)

### Saneamiento definitivo (verificación por hashes, sin valores)

```text
~/.zsh_history = CLEAN
.env.local = CLEAN
Repositorio (tracked + no tracked) = CLEAN
.git (objetos, index, reflogs, stashes, dangling) = CLEAN
/tmp = CLEAN
VS Code History = DIRTY (1 snapshot: d012f3d1 x1, b50115c2 x1)
VS Code Backups = CLEAN
workspaceStorage (todos los del proyecto) = DIRTY (4 archivos):
  state.vscdb.backup (d012f3d1 x2, b50115c2 x2)
  chatEditingSessions/state.json (x1, x1)
  chatSessions/*.jsonl (d012f3d1 x34, b50115c2 x36)
  transcripts/*.jsonl (x1, x2)
LOCAL_SECRET_OCCURRENCES = 81  (RESEND_API_KEY_OLD 39 + RESEND_WEBHOOK_SECRET_OLD 42)
```

### Diagnóstico del saneador

```text
saneador_logic_test = PASS (copia de state.vscdb.backup redactada → CLEAN)
saneador_ejecutado_efectivamente = false
evidencia = state.vscdb.backup (mtime 05:45) y snapshot History (mtime 05:42) anteriores a la creación del saneador (06:01); conteo idéntico a PASO 19Z (81)
causa = el saneador no llegó a modificarse/ejecutarse sobre los archivos; la sesión activa de VS Code reescribe state.vscdb/chatSessions/transcripts
READY = false (LOCAL_SECRET_OCCURRENCES ≠ 0)
```

### Prueba positiva del formulario

```text
PLATFORM_LOG_EVIDENCE = unavailable (deployment Preview dpl_B7HNpP1ffiEd42ejEGwVqPmjynbV: 348 eventos, 0 runtime post-build, 0 marcadores consulta/email)
RUNTIME_LOG_MARKERS = 0
FORM_TEST_OWNER_CONFIRMATION = true
FORM_TEST_PLATFORM_CORROBORATION = false
FORM_TEST_STATUS = OWNER_CONFIRMED_UNCORROBORATED
END_TO_END_LEVEL_B = PARTIAL_PASS
EMAILS_SENT_BY_PASO_19ZZ = 0
```

> **Corrección (Paso 19ZZA):** el valor `FORM_TEST = PASS` de la versión previa
> de §30 quedó sustituido por `FORM_TEST_STATUS = OWNER_CONFIRMED_UNCORROBORATED`.
> No debe registrarse como evidencia técnica completa mientras
> `PLATFORM_LOG_EVIDENCE = unavailable`. El saneamiento local no convierte
> Level B en PASS.

### Production

```text
origin/main = 57aa3edd39ea1aed769d8cd7eb807ac71eb47602
deployment activo = dpl_F5qPv9vd6esuJx2tGQVEY4b4CrEF (READY, correctivo de main)
PRODUCTION_DEPLOYMENT_SOURCE = APPROVED_MAIN
dominio www.pinedayasociadoshn.com = HTTP 200 (/, /solicitar-consulta, /terminos)
```

### Resend / Vercel

```text
Production RESEND_API_KEY = updated 08-02 05:40
Production RESEND_WEBHOOK_SECRET = updated 08-02 05:41
Preview RESEND_API_KEY (rama + general) presente; RESEND_WEBHOOK_SECRET ausente (correcto)
clave antigua afdae9c2 = revocada (evidencia PASO 19Y; no re-verificable sin key full-access)
clave nueva justicia-verdadera-rotated-pr25 = sending_access, activa (evidencia PASO 19Y + funcionalidad de envío)
webhook antiguo 948de1e7 = eliminado
webhook nuevo b7b21031-1774-4a90-99f0-cafe461f5ea6 = enabled, email.received, endpoint www.pinedayasociadoshn.com/api/email/inbound
```

### Validaciones técnicas

```text
git diff --check = clean
typecheck = PASS
lint = 0 errores (3 warnings preexistentes)
tests (contacto + consulta + inbound) = 27/27 PASS
build = PASS (Compiled successfully, 203 páginas)
secretos nuevos = 0
errores editor en docs = ninguno
```

### Cierre

```text
LOCAL_SECRET_OCCURRENCES = 81 (≠ 0) → CRITERIO NO CUMPLIDO
READY = false
INCIDENT_STATUS = OPEN
```

## 31. Saneamiento local definitivo (Paso 19ZZA)

### Preflight del saneador

```text
SANITIZER_EXISTS = true
SANITIZER_SHA256 = 5f11f03a3b421f3973109063b1faa8917dd3d562c9323b38182685e3e77412db
SANITIZER_SYNTAX_VALID = true
SANITIZER_ALLOWLIST_EXACT = true (5 rutas únicas, todas presentes)
SANITIZER_NETWORK_CALLS = 0
SANITIZER_SUBPROCESS_CALLS = 0
SANITIZER_DIRECTORY_DELETIONS = 0 (solo limpieza atómica de temp en error)
SANITIZER_SECRET_PRINTING = 0
```

Nota: la versión previa del saneador (SHA bfb37d0b…) recorría directorios y no
cumplía la allowlist exacta; fue sustituida por la versión conforme.

### Allowlist (5 archivos)

```text
~/Library/Application Support/Code/User/History/-55278e1f/VLgE.py
~/Library/Application Support/Code/User/workspaceStorage/acab349739015ad908c35e609cc1417a/state.vscdb.backup
~/Library/Application Support/Code/User/workspaceStorage/acab349739015ad908c35e609cc1417a/chatEditingSessions/70c6bdc3-8584-4513-b234-b998a770f518/state.json
~/Library/Application Support/Code/User/workspaceStorage/acab349739015ad908c35e609cc1417a/chatSessions/70c6bdc3-8584-4513-b234-b998a770f518.jsonl
~/Library/Application Support/Code/User/workspaceStorage/acab349739015ad908c35e609cc1417a/GitHub.copilot-chat/transcripts/70c6bdc3-8584-4513-b234-b998a770f518.jsonl
```

### Escáner independiente

```text
SCANNER_PATH = /tmp/paso19zza_verify_scan.py
SCANNER_EXISTS = true
SCANNER_SHA256 = 1c8f777c7c9ec845cb0efed226c2dc394f46f9d266733bdaba61ebe1722ede2e
SCANNER_SYNTAX_VALID = true
```

### Estado antes del handoff

```text
local_secret_occurrences_before = 81
tmp_secret_artifacts_before = 4 (/tmp/p19zza_copy.bin — copia de prueba, eliminada)
form_test_status = owner_confirmed_uncorroborated
end_to_end_level_b = partial_pass
handoff_estado = PENDIENTE (requiere cerrar VS Code y ejecutar saneador)
```

### Veredicto del cierre (pendiente ejecución)

```text
CLOSED_VSCODE_LOCAL_SECRET_OCCURRENCES_AFTER = PENDIENTE
POST_REOPEN_LOCAL_SECRET_OCCURRENCES_AFTER = PENDIENTE
RECONTAMINATION_DETECTED = PENDIENTE
INCIDENT_STATUS = OPEN (hasta doble escaneo = 0)
```

## PASO 19ZZM — CIERRE DEL INCIDENTE DE SANEAMIENTO LOCAL

### Evidencia verificada (resultado del orquestador, CLAVE=VALOR)

```text
INCIDENT_STATUS_LOCAL_SANITATION = CLOSED
BASELINE_KEY_OCCURRENCES = 37
BASELINE_WEBHOOK_OCCURRENCES = 40
BASELINE_TOTAL = 77
SANITIZER_EXECUTIONS = 1
REPLACEMENTS_TOTAL = 77
CLOSED_SCAN_TOTAL = 0
POST_REOPEN_SCAN_TOTAL = 0
RECONTAMINATION_DETECTED = false
STOP_REASON = absent
SECRET_VALUES_PRINTED = false
TEMP_FILES_REMAINING = 0
REPOSITORY_MUTATION_BY_SANITIZER = false
```

> Correspondencias de nombres en el resultado del orquestador (significado
> inequívoco): `SANITIZER_EXECUTIONS` ⟷ `SANITIZER_RUN_COUNT`;
> `BASELINE_KEY_OCCURRENCES` ⟷ `BASELINE_KEY`;
> `BASELINE_WEBHOOK_OCCURRENCES` ⟷ `BASELINE_WEBHOOK`;
> `BASELINE_TOTAL` ⟷ `BASELINE_TARGET_TOTAL`;
> `CLOSED_SCAN_TOTAL` ⟷ `CLOSED_GRAND_TOTAL`;
> `POST_REOPEN_SCAN_TOTAL` ⟷ `POST_REOPEN_GRAND_TOTAL`.
> `RECONTAMINATION_DETECTED = false` es derivable de escaneos 0/0/0;
> `STOP_REASON = absent` (clave ausente); `SECRET_VALUES_PRINTED = false` por
> diseño del orquestador; `TEMP_FILES_REMAINING = 0` verificado;
> `REPOSITORY_MUTATION_BY_SANITIZER = false` (HEAD sin cambios).

### Herramientas V2 (SHA-256 completos verificados)

```text
SCAN_V2      = 5ee7025d4ba0fee6ae3f106b7966a7fb136cb33d38411b199c8aa9a0f479d7de
SANITIZE_V2  = 45f7510007caa9f0271d0ecc6cc23d0bdd5372e36b8d21f0ae858dfc7dd3dafa
RUN_ONCE_PS1 = 1cb32b2c7d3513ccb65381466ab5db2fa023257e20d29e6c3bca47f53cdbf165
```

### Hechos (resumen factual)

- La primera ejecución (runner V1) se detuvo con `STOP_REASON = BASELINE_CHANGED`
  porque la línea base pasó de 81 a 77 (reducción consistente con reescritura de
  VS Code en `state.vscdb.backup`). El saneador anterior **no se ejecutó**.
- Se prepararon herramientas V2 con allowlist de **cuatro rutas** (VLgE.py,
  chatEditingSessions/state.json, chatSessions jsonl, transcripts jsonl);
  `state.vscdb.backup` quedó excluida por estar limpia.
- Una **única ejecución válida** del orquestador V2 completó **77 sustituciones**
  (37 key + 40 webhook) iguales al baseline cerrado, con escaneo cerrado y
  post-reapertura a cero.

### Clasificaciones (sin cambios)

```text
FORM_TEST_STATUS = OWNER_CONFIRMED_UNCORROBORATED
END_TO_END_LEVEL_B = PARTIAL_PASS
PRODUCTION_DEPLOYMENT_FROM_MAIN_CLAIM = UNSUPPORTED
```

Este PASO cerró **únicamente** el incidente local de persistencia de secretos en
archivos de estado de VS Code. No eleva la validación del formulario a
corroborada por plataforma ni declara validado un despliegue Production desde
main.
