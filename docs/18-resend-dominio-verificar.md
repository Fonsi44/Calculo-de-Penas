# Resend — Configuración verificada

> **Estado**: ✅ Completado y funcional
> **Última verificación**: 12 junio 2026

## Dominio verificado

| Recurso | Valor |
|---------|-------|
| Dominio | ✅ `pinedayasociadoshn.com` |
| Status | `verified` |
| Sending | `enabled` |
| DKIM | ✅ Verificado |
| SPF | ✅ Verificado |
| Región | `eu-west-1` |

## API Key

| Recurso | Valor |
|---------|-------|
| Key | `re_UwGMchvK_Fr9kcd65nVM2cBvqujb9kHCw` |
| Nombre | `kilo-code` |
| Permiso | Sending access |

## Variables de entorno

```env
# Obligatorias
RESEND_API_KEY=re_UwGMchvK_Fr9kcd65nVM2cBvqujb9kHCw
RESEND_FROM_EMAIL=no-reply@pinedayasocioshn.com
CONTACT_NOTIFICATION_EMAIL=alfonsroiget@gmail.com
```

**IMPORTANTE**: `no-reply@pinedayasocioshn.com` (sin 'd' entre 'socia' y 'dos'). NO usar `no-reply@pinedayasocioshn.com` (sin 'd') ni `onboarding@resend.dev`.

## Historial de errores resueltos

### Error 1: RESEND_API_KEY no configurada
- **Problema**: La variable no existía en ningún `.env` local
- **Solución**: Añadida a `.env.local` y Vercel production

### Error 2: From domain incorrecto
- **Problema**: Se usaba `onboarding@resend.dev` (default) o `no-reply@pinedayasocioshn.com` (sin 'd')
- **Solución**: Corregido a `no-reply@pinedayasocioshn.com`

### Error 3: Email asíncrono sin trazabilidad
- **Problema**: `sendConsultaEmail()` se ejecutaba en `.then()` después de responder, sin persistencia del resultado
- **Solución**: Ahora es síncrono, actualiza `email_status`/`email_id`/`email_error` en DB

## Nuevas columnas en DB

Tabla `solicitudes_consulta`:

| Columna | Tipo | Propósito |
|---------|------|-----------|
| `email_status` | varchar(20) | `pending`, `sent`, `failed`, `skipped` |
| `email_id` | varchar(255) | ID devuelto por Resend |
| `email_error` | text | Mensaje de error si falló |

## Prueba manual

```powershell
$headers = @{Authorization="Bearer re_UwGMchvK_Fr9kcd65nVM2cBvqujb9kHCw"}
$body = @{
  from="Pineda y Asociados <no-reply@pinedayasocioshn.com>"
  to=@("alfonsroiget@gmail.com")
  subject="Test desde Resend"
  text="Si ves esto, funciona"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.resend.com/emails" -Method POST `
  -Headers $headers -Body $body -ContentType "application/json"
```

## DMARC pendiente

El registro DMARC no está configurado. Aunque el envío funciona sin él, Gmail puede aplicar políticas más restrictivas. Recomendación:

```dns
_dmarc.pinedayasocioshn.com  TXT  "v=DMARC1; p=quarantine; sp=quarantine; rua=mailto:dmarc@forwarding.pinedayasocioshn.com; ruf=mailto:dmarc@forwarding.pinedayasocioshn.com; pct=100"
```

Esto mejora la entregabilidad en Gmail. Añadir en el DNS del dominio.
