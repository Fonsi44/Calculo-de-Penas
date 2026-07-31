# Preflight — Validación manual de formularios (Paso 14K)

> **Estado:** TURNSTILE_ROOT_CAUSE_CONFIRMED / LOCAL_UI_HARDENING_PASS / WAITING_COMMIT_AND_GIT_PREVIEW_AUTHORIZATION
> **Generado:** 2026-07-31
> **HEAD:** `57830f57`

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

## 14. Veredicto

```
TURNSTILE_ROOT_CAUSE_CONFIRMED
LOCAL_UI_HARDENING_PASS
WAITING_COMMIT_AND_GIT_PREVIEW_AUTHORIZATION
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
