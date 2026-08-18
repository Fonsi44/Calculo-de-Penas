---
status: current
owner: engineering
created: 2026-07-09
last_reviewed: 2026-08-17
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Email — Resend: operación y mantenimiento

## Flujo del formulario de consulta

```
Usuario → /solicitar-consulta → /api/consulta → lib/email.ts → Resend API → alfonsroiget@gmail.com
                                                      ↕
                                               BD (solicitudes_consulta)
```

1. Cliente rellena formulario en `/solicitar-consulta`
2. `POST /api/consulta` valida con Zod (`lib/validation.ts`)
3. Rate-limiting (10 solicitudes/15min por IP+UA)
4. Cloudflare Turnstile (verificación antispam)
5. Guarda en BD (`solicitudes_consulta` con `emailStatus: 'pending'`)
6. Envía email vía `lib/email.ts:sendConsultaEmail()`:
   - **From:** `contacto@pinedayasociadoshn.com`
   - **To:** `alfonsroiget@gmail.com`
   - **Reply-To:** email real del usuario
   - **Subject:** `[Solicitud de consulta] {motivo} — {nombre}`
7. Si el email se envía correctamente: `emailStatus → 'sent'`
8. Auto-respuesta al usuario con `sendAutoReplyEmail()` si proporcionó email

## Flujo del formulario de contacto

Mismo patrón que consulta pero en `POST /api/contacto` con campo `asunto`.

## Flujo inbound catch-all: *@pinedayasociadoshn.com

```
Cualquier remitente externo → cualquier@dominio@pinedayasociadoshn.com
                                        ↓
                            Resend (inbound MX)
                                        ↓
                            Webhook POST /api/email/inbound
                                        ↓
                            Verificación Svix (RESEND_WEBHOOK_SECRET)
                                        ↓
                            ┌─ ¿Algún destinatario es @pinedayasociadoshn.com?
                            │   NO  → 200 OK (ignorar, no reenviar)
                            │   SÍ  →  Reenvío a alfonsroiget@gmail.com
                            │           (reply_to = remitente original)
                            │           Asunto: [Pineda Inbound: destinatario] original subject
                            └─
```

El sistema funciona como **catch-all**: cualquier dirección `*@pinedayasociadoshn.com` es aceptada y reenviada. No hay filtro por dirección exacta. No es un buzón tradicional: es forwarding mediante Resend Inbound + webhook.

### Comportamiento detallado

1. Alguien envía email a **cualquier** dirección `@pinedayasociadoshn.com` (ej: `info@`, `admin@`, `clientes@`, `random@`)
2. Resend recibe via inbound MX (`inbound-smtp.eu-west-1.amazonaws.com`)
3. Resend dispara webhook `email.received` a `https://www.pinedayasociadoshn.com/api/email/inbound`
   (URL exacta; el typo `pinedayasocioshn.com`, sin «ad», no recibe el webhook)
4. El endpoint verifica la firma Svix (Ed25519) usando `RESEND_WEBHOOK_SECRET`
5. Si la firma es inválida: HTTP 401
6. Si la firma es válida:
   - Revisa todos los destinatarios (`to`, `cc`, `bcc`)
   - Si **ninguno** pertenece a `@pinedayasociadoshn.com`: responde 200 OK sin procesar (evita retries innecesarios)
   - Si **al menos uno** pertenece al dominio: reenvía el contenido completo a `alfonsroiget@gmail.com`
7. El reenvío incluye:
   - **Asunto:** `[Pineda Inbound: info@pinedayasociadoshn.com] Asunto original`
   - **From:** `Pineda y Asociados <contacto@pinedayasociadoshn.com>`
   - **Reply-To:** email real del remitente original (sin spoofing)
   - **Cuerpo HTML + texto plano**
   - **Metadatos de adjuntos** (nombres, tipos)
   - **Fecha original del email**
8. Si el webhook solo trae metadatos sin cuerpo completo, se intenta recuperar vía Resend Receiving API (`GET /emails/receiving/{email_id}`)

### Ejemplos que funcionan

| Dirección | ¿Se reenvía? |
|-----------|-------------|
| `contacto@pinedayasociadoshn.com` | ✅ Sí |
| `info@pinedayasociadoshn.com` | ✅ Sí |
| `admin@pinedayasociadoshn.com` | ✅ Sí |
| `clientes@pinedayasociadoshn.com` | ✅ Sí |
| `cualquiercosa@pinedayasociadoshn.com` | ✅ Sí |
| `test@otrodominio.com` | ❌ No (ignorado) |

## Variables de entorno necesarias

| Variable | Valor (ejemplo) | Obligatoria | Propósito |
|----------|-----------------|-------------|-----------|
| `RESEND_API_KEY` | `re_...` | Sí | API key de Resend |
| `RESEND_FROM_EMAIL` | `contacto@pinedayasociadoshn.com` | Sí | Remitente visible del formulario |
| `CONTACT_FROM` | `contacto@pinedayasociadoshn.com` | No (alias) | Misma función que RESEND_FROM_EMAIL |
| `CONTACT_NOTIFICATION_EMAIL` | `alfonsroiget@gmail.com` | Sí | Destino de notificaciones |
| `CONTACT_TO` | `alfonsroiget@gmail.com` | No (alias) | Misma función que CONTACT_NOTIFICATION_EMAIL |
| `INBOUND_FORWARD_TO` | `alfonsroiget@gmail.com` | Sí | Destino del catch-all inbound |
| `INBOUND_ALLOWED_DOMAIN` | `pinedayasociadoshn.com` | No | Dominio para catch-all (default: pinedayasociadoshn.com) |
| `RESEND_WEBHOOK_SECRET` | `whsec_...` | Sí | Firma del webhook inbound |
| `TURNSTILE_SECRET_KEY` | `0x...` | Sí | Server-side captcha |
| `TURNSTILE_SITE_KEY` | `1x...` | Sí | Server-side captcha |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `1x...` | Sí | Widget cliente captcha |

Ninguna variable debe contener valores reales en el repositorio. Solo en `.env.local` (gitignorado) y en el hosting (Vercel Secrets).

## Cómo rotar el webhook secret

1. Crear nuevo webhook en Resend (el viejo queda inválido):
   ```bash
   curl -X POST https://api.resend.com/webhooks \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "endpoint": "https://www.pinedayasociadoshn.com/api/email/inbound",
       "events": ["email.received"]
     }'
   ```
2. El response incluye un nuevo `signing_secret` (formato `whsec_...`)
3. Eliminar el webhook viejo:
   ```bash
   curl -X DELETE https://api.resend.com/webhooks/{id_viejo} \
     -H "Authorization: Bearer $RESEND_API_KEY"
   ```
4. Actualizar `RESEND_WEBHOOK_SECRET` en:
   - `.env.local` (local)
   - Vercel → Settings → Environment Variables (Production)
5. Redeploy: `npx vercel --prod --force`

## Cómo probar el formulario

### Manual (navegador)

1. Ir a `https://www.pinedayasociadoshn.com/solicitar-consulta`
2. Rellenar todos los campos obligatorios
3. Pasar el captcha (Turnstile)
4. Enviar
5. Verificar recepción en `alfonsroiget@gmail.com`
6. Verificar que `reply_to` es el email introducido

### Automatizado (API directa)

Requiere un token de Turnstile válido. No se puede bypassear en producción.

### Verificación vía API de Resend

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Pineda y Asociados <contacto@pinedayasociadoshn.com>",
    "to": ["alfonsroiget@gmail.com"],
    "reply_to": "test@example.com",
    "subject": "[Test] Verificación de configuración",
    "text": "Mensaje de prueba."
  }'
```

## Cómo probar el inbound catch-all

El inbound solo se puede probar **enviando un email real** desde un proveedor externo a cualquier dirección del dominio (ej: `test-inbound@pinedayasociadoshn.com`). Resend recibe el email y dispara el webhook.

Para verificar el código localmente (tests unitarios):
```bash
npx vitest run tests/api/email-inbound-catchall.test.ts
```

Para verificar logs en producción:
```bash
npx vercel logs --limit 50
```

### Lo que se verifica en cada reenvío

- **Asunto:** debe comenzar con `[Pineda Inbound: direccion@...]`
- **Reply-To:** debe ser el email del remitente original
- **Contenido:** debe mostrar claramente la dirección original que recibió el email
- **Adjuntos:** se listan metadatos (nombre, tipo) si los hay

## Limitación: adjuntos inbound

El webhook de Resend incluye metadatos de adjuntos (`filename`, `content_type`, `content_disposition`) pero **no el contenido binario**. El reenvío a `alfonsroiget@gmail.com` lista los metadatos pero no incluye los archivos.

Si se necesitan adjuntos completos, habría que:
- Configurar Vercel Blob (ya disponible: `BLOB_READ_WRITE_TOKEN`)
- Decodificar desde el evento de Resend (requiere cambios en `app/api/email/inbound/route.ts`)
- O usar un servicio de forwarding tipo ImapSync / Forward Email

## Limitación: cuerpo completo

El webhook de Resend puede omitir el cuerpo del email en algunos casos. La implementación intenta recuperar el contenido completo vía Receiving API (`client.emails.receiving.get(email_id)`). Si falla, usa el texto/html disponible en el webhook.

## Logs

Los logs del sistema de email se registran con prefijos:
- `[email]` — envíos desde `lib/email.ts`
- `[contacto]` — endpoint `/api/contacto`
- `[consulta]` — endpoint `/api/consulta`
- `[email/inbound]` — webhook inbound en `/api/email/inbound`
- `[captcha]` — verificación Turnstile

Los logs **no exponen** secretos (API keys, tokens, etc.). Los errores se registran sin los valores sensibles.

## Estado actual en producción (Vercel)

| Variable | Estado |
|----------|--------|
| `RESEND_API_KEY` | ✅ Configurada (Encrypted) |
| `RESEND_FROM_EMAIL` | ✅ `contacto@pinedayasociadoshn.com` |
| `CONTACT_FROM` | ✅ `contacto@pinedayasociadoshn.com` |
| `CONTACT_NOTIFICATION_EMAIL` | ✅ `alfonsroiget@gmail.com` |
| `CONTACT_TO` | ✅ `alfonsroiget@gmail.com` |
| `INBOUND_FORWARD_TO` | ✅ `alfonsroiget@gmail.com` |
| `INBOUND_ALLOWED_DOMAIN` | ✅ `pinedayasociadoshn.com` |
| `RESEND_WEBHOOK_SECRET` | ✅ Rotado |
| Webhook inbound (`b7b21031-…`) | ✅ `enabled` (2026-08-17): endpoint canónico `/api/email/inbound`, evento `email.received`. Antes estaba `disabled` y apuntaba al typo `pinedayasocioshn.com` |
| `TURNSTILE_SECRET_KEY` | ✅ Configurada |
| `TURNSTILE_SITE_KEY` | ✅ Configurada |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ Configurada |
