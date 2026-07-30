# Preflight — Validación manual de formularios (Paso 14, corregido)

> **Estado:** PREFLIGHT_BLOCKED — Turnstile ausente en Vercel Preview.
> **Generado:** 2026-07-30
> **HEAD:** `6fba987c`

---

## 1. Rama y entorno

| Campo | Valor |
|-------|-------|
| Rama | `feat/seo-geo-master-implementation` |
| PR | `#25` — OPEN, DRAFT, MERGEABLE, UNMERGED |
| HEAD | `6fba987c` |
| Preview URL | `https://justicia-verdadera-rlwviejm9-fonsi-roiget-s-projects.vercel.app` |
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
| TURNSTILE_SITE_KEY | ABSENT_CONFIRMED |
| TURNSTILE_SECRET_KEY | ABSENT_CONFIRMED |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | ABSENT_CONFIRMED |

> **Turnstile solo existe en Production.** En Preview, `isCaptchaEnabled()` = false → si `NODE_ENV=production`, `verifyTurnstileToken()` devuelve `false` (fail-closed) y todos los envíos de formulario serán rechazados. Si `NODE_ENV=development`, se hace bypass (inseguro para pruebas realistas).
>
> **Bloqueo:** no se puede probar Turnstile contra Preview. Para desbloquear, el propietario debe copiar las 3 variables de Turnstile a Preview en Vercel Dashboard.

## 3. Base de datos objetivo

| Campo | Valor |
|-------|-------|
| Rama Neon staging | `br-orange-moon-ass3ksjl` |
| Rama producción | `br-still-...` (diferente, confirmado) |
| target_database != production | CONFIRMADO |
| Filas `solicitudes_consulta` | 0 |

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

### Estado: BLOQUEADO

Las tres variables (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) solo existen en Production. En Preview están ausentes.

### Plan negativo (cuando se desbloquee)

Payload válido en todos los campos excepto `cf-turnstile-response`:
- Sin token → HTTP 400, `consulta_captcha_failed`, 0 inserciones, 0 emails.
- Token vacío → ídem.
- Token inválido → ídem.

### Plan positivo (cuando se desbloquee)

Navegador autenticado en Preview, widget real, token real de Cloudflare.

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
PREFLIGHT_BLOCKED
```

**Motivo:** Las tres variables de Turnstile (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) están ausentes en Vercel Preview. Solo existen en Production.

**Acción requerida del propietario:** Copiar las 3 variables de Turnstile al entorno Preview en Vercel Dashboard (Project Settings → Environment Variables → Preview). No se requieren valores nuevos; se pueden usar los mismos de Production para validación.

Una vez desbloqueado, el preflight estará `PREFLIGHT_READY` y se podrá solicitar autorización para ejecutar las pruebas.
