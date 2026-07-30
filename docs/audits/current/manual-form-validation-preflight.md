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

## 15. Plan de desbloqueo de Turnstile en Preview

### Hostname Preview estable

| Campo | Valor |
|-------|-------|
| Branch alias (estable) | `justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app` |
| Deployment específico actual | `justicia-verdadera-rlwviejm9-fonsi-roiget-s-projects.vercel.app` |
| Dominio controlado | `pinedayasociadoshn.com` (solo Production) |
| HOSTNAME_SOURCE | `vercel_inspect` (alias de rama Vercel) |
| OWNER_CONTROLLED | `false` (subdominio de `vercel.app`) |
| STABLE_ACROSS_REDEPLOYS | `true` (alias de rama Git) |

> ⚠️ El alias de rama es estable entre redeploys, pero es un subdominio de `vercel.app`. Turnstile recomienda no autorizar `vercel.app`. Se recomienda configurar un subdominio controlado como `preview.pinedayasociadoshn.com` para un entorno Preview permanente y seguro.

### Opción recomendada: Widget Preview separado

**NO reutilizar** automáticamente el widget y secreto de Production. Motivos:
- Turnstile restringe cada widget a hostnames autorizados.
- El widget de Production está autorizado para `pinedayasociadoshn.com` — no funcionará en `*.vercel.app`.
- Copiar el secreto de Production a Preview aumenta el alcance de exposición.
- Entornos staging/preview y Production deben estar separados.

**Plan:**
1. Crear un widget Cloudflare Turnstile separado: "Pineda y Asociados — Preview"
2. Autorizar el hostname Preview exacto en Cloudflare
3. Configurar las 3 variables solo en Vercel Preview (scope: `feat/seo-geo-master-implementation`)
4. Redeploy de la rama (las variables no se aplican a deployments existentes)
5. Verificar widget visible y backend con variables presentes

### Alternativa: Claves oficiales de test de Cloudflare

Cloudflare proporciona claves dummy para pruebas. Ventajas: validan integración, envío positivo/negativo, persistencia, correo. Limitaciones: no validan widget real, restricciones de hostname ni challenge adaptativo. Resultado debe etiquetarse `TURNSTILE_INTEGRATION_TEST=PASS; TURNSTILE_REAL_PREVIEW_WIDGET=NOT_TESTED`.

### Redeploy obligatorio

Añadir variables en Vercel no modifica deployments existentes. Tras configurar, se requiere nuevo Preview deployment. El deployment actual (`justicia-verdadera-rlwviejm9-fonsi-roiget-s-projects.vercel.app`) no recibirá las variables.

### Referencias de commit

| Campo | SHA |
|-------|-----|
| `code_head` (último código probado) | `6fba987c` |
| `preflight_commit` (este documento) | `79379912` |

### Checklist Turnstile Preview (añadida a `docs/ops/final-manual-production-checklist.md`)

```
[ ] Confirmar que el widget configurado corresponde al entorno objetivo.
[ ] Confirmar que el hostname exacto está autorizado en Cloudflare.
[ ] Confirmar que Preview usa un widget/secret separado de Production,
    salvo decisión expresa documentada del propietario.
[ ] Confirmar que el deployment fue recreado después de añadir variables.
```

### Veredicto de setup Turnstile

```
TURNSTILE_PREVIEW_SETUP_BLOCKED
```

**Bloqueo:** No existe widget Preview separado ni hostname autorizado. Se requiere acción del propietario en Cloudflare y Vercel.

### Autorización necesaria

Si el propietario opta por widget Preview separado:
```
AUTORIZO CONFIGURAR TURNSTILE PREVIEW SEPARADO:
- crear un widget Cloudflare exclusivo para Preview
- autorizar únicamente el hostname Preview exacto indicado
- configurar las 3 variables solo en Vercel Preview
- limitar las variables a feat/seo-geo-master-implementation si es posible
- crear un nuevo deployment Preview
NO Production
NO envíos todavía
```
