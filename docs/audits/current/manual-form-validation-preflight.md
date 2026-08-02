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
