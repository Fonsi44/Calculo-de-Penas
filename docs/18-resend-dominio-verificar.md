# Resend - Verificar dominio de correo

> **Participantes**: Abogado (pasos A, registros DNS) + Desarrollador (pasos B)
> **Tiempo**: ~20 min abogado (solo en producción) + ~10 min desarrollador
> **Objetivo**: Los correos salgan desde el dominio del bufete

---

## 🔬 MODO ACTUAL (local, dominio ya verificado)

El dominio `pinedayasocioshn.com` ya está verificado en Resend ✅ (verificado desde 2026-06-05).
Se puede usar `no-reply@pinedayasocioshn.com` ya, no es necesario esperar a producción.

| Recurso | Valor actual |
|---|---|
| Dominio verificado | ✅ `pinedayasocioshn.com` (sending enabled) |
| Remitente (From) | `onboarding@resend.dev` o `no-reply@pinedayasocioshn.com` |
| API key actual | `re_XKSMA2fX_3nsVqhucNJpynwkjRrB6w9Rn` (nombre: "opencode") |

## ⏭️ Configuración actual .env.local

```env
# .env.local (configuración vigente)
RESEND_API_KEY=re_XKSMA2fX_3nsVqhucNJpynwkjRrB6w9Rn
RESEND_FROM_EMAIL=onboarding@resend.dev
CONTACT_NOTIFICATION_EMAIL=contacto@pinedayasocioshn.com
```

Los formularios de contacto/consulta envían correos desde `onboarding@resend.dev`.
Para cambiar al dominio propio, solo hay que poner `RESEND_FROM_EMAIL=no-reply@pinedayasocioshn.com`.

## ⚠️ Estado actual: dominio verificado pero envía con 403

Verificado contra la API real de Resend el 2026-06-07:

| Paso | Estado | Detalle |
|------|--------|---------|
| Dominio agregado | ✅ | `pinedayasocioshn.com` (ID: `2a8517f6-bf2f-4515-928c-1261a9d7af3a`) |
| DNS configurado | ✅ | MX, TXT, CNAME |
| Dominio verificado | ✅ `verified` | Región: `eu-west-1`, sending: `enabled` |
| API key creada | ✅ | `re_XKSMA2fX_3nsVqhucNJpynwkjRrB6w9Rn` (nombre: "opencode") |
| Envío con onboarding@resend.dev | ✅ | Funciona (ID: `f7ee91ad-65e1-4eb5-8829-c734434e6826`) |
| Envío con no-reply@dominio | ❌ **403** | `"The domain is not verified"` — incoherencia con GET /domains |

> **⚠️ Problema**: La API reporta el dominio como `verified` con `sending: enabled`, pero al enviar desde `no-reply@pinedayasocioshn.com` responde `403 Domain not verified`. Posible causa: DNS no propagado del todo, o requiere re-verificar. Mientras tanto, seguir usando `onboarding@resend.dev`.

### Para probar el dominio propio cuando esté resuelto

```env
RESEND_FROM_EMAIL=no-reply@pinedayasocioshn.com
```

Luego probar con:
```powershell
Invoke-WebRequest -Uri "https://api.resend.com/emails" -Headers @{Authorization="Bearer re_XKSMA2fX_3nsVqhucNJpynwkjRrB6w9Rn"; "Content-Type"="application/json"} -Method Post -Body '{"from":"no-reply@pinedayasocioshn.com","to":["alfonsroiget@gmail.com"],"subject":"Test","text":"test"}'
```

### API endpoints documentados (verificados)

| Endpoint | Método | Funciona |
|----------|--------|----------|
| `GET /domains` | Listar dominios | ✅ 200 |
| `GET /api-keys` | Listar API keys | ✅ 200 |
| `POST /emails` | Enviar email | ✅ 200 |

### API keys guardadas en .env.local

```env
# Resend (envío emails)
RESEND_API_KEY=re_XKSMA2fX_3nsVqhucNJpynwkjRrB6w9Rn

# ImprovMX (forward correo entrante → Gmail)
IMPROVMX_API_KEY=sk_a2c2ac63d74a42dab7cd8cea5e20a614
IMPROVMX_DOMAIN=pinedayasociadoshn.com
```

### Referencia: pasos originales de configuración

Si en el futuro hay que agregar otro dominio o renovar la configuración:

**A1.** Ir a https://resend.com e iniciar sesión con `alfonsroiget@gmail.com`
**A2.** Agregar dominio → **Domains** → **Add Domain**
**A3.** Resend muestra 3 registros DNS (MX, TXT, CNAME). Agregarlos en el proveedor DNS.
**A4.** Volver a Resend → **Verify**
**A5.** Crear API key → **API Keys** → **Create API Key** (permiso: Sending access)

**B1.** Actualizar `.env.local`:
```env
RESEND_API_KEY=<nueva_key>
RESEND_FROM_EMAIL=no-reply@midominio.com
CONTACT_NOTIFICATION_EMAIL=contacto@midominio.com
```
**B2.** Probar envío. Verificar que el correo llega al destinatario.

