# WhatsApp Business — Configuración del abogado

> **Participantes**: Abogado (pasos 1-5) + Desarrollador (paso 6)
> **Tiempo total**: ~45 min (abogado) + ~30 min (desarrollador)
> **Objetivo**: El número del bufete recibe y envía WhatsApps automatizados desde el CRM

## 🔬 MODO PRUEBAS (local, sin web pública)

Durante las pruebas locales se usan datos personales. Al pasar a producción se cambian:

| Recurso | Pruebas (local) |
|---|---|
| Email notificaciones | alfonsroiget@gmail.com |
| Teléfono WhatsApp | +34 661911574 |
| URL callback webhook | http://localhost:3000/api/whatsapp |

Los pasos siguientes ya reflejan los valores de pruebas locales.

---

## 🔷 SECCIÓN A — ABOGADO (no técnico, desde su teléfono)

*Sigue estos pasos en tu teléfono Android o iPhone. No necesitas conocimientos técnicos.*

### A1. Descargar WhatsApp Business

| Dispositivo | Dónde |
|---|---|
| Android | Google Play Store — buscar "WhatsApp Business" |
| iPhone | App Store — buscar "WhatsApp Business" |

Icono: **B** blanca sobre fondo verde oscuro (NO el de teléfono blanco que es WhatsApp normal).

### A2. Verificar número del bufete

- Abre WhatsApp Business
- Acepta términos
- País: **España (+34)**
- Número: **661 91 15 74** (display Meta: +34 661 91 15 74, API E.164: +34661911574)
- Llega un SMS con código de 6 dígitos — escríbelo
- Cuando pregunte "Restaurar historial": pulsa **NO** (es línea nueva)

### A3. Configurar perfil profesional

En WhatsApp Business: tres puntos (Android) / Configuración (iPhone) → Configuración del negocio → Perfil.

| Campo | Valor |
|---|---|
| Nombre | Pineda y Asociados |
| Categoría | Professional Services (PROF_SERVICES) |
| Descripción | Bufete multidisciplinario en Nacaome, Valle. Derecho penal, familia, laboral, civil, mercantil y más. |
| Correo | alfonsroiget@gmail.com |
| Web | https://pinedayasociadoshn.com |
| Dirección | Barrio El Centro, 100 mts del Parque Central, Nacaome, Valle |
| Horario | Lun–Sáb 7:00–20:00 |

Foto de perfil: usa el logo del bufete (está en `public/logo.png`).

### A4. Mensajes automáticos

**Mensaje de ausencia**: Configuración del negocio → Mensaje de ausencia → Activar:

*"Gracias por contactar a Pineda y Asociados. Actualmente estamos fuera del horario de atención. Te responderemos en cuanto estemos disponibles (lunes a sábado, 7:00 a 20:00). Si es una emergencia legal, indícalo en tu mensaje."*

**Respuestas rápidas**: Configuración del negocio → Respuestas rápidas → Crear:

| Atajo | Contenido |
|---|---|
| /saludo | Hola, gracias por contactar a Pineda y Asociados. Soy [nombre], abogado del bufete. ¿En qué podemos ayudarte? Cuéntanos brevemente tu caso y te orientaremos sin compromiso. |
| /direccion | Estamos en Barrio El Centro, 100 mts del Parque Central, Nacaome, Valle. Horario: lunes a sábado 7:00-20:00. ¿Te esperamos? |
| /cita | Podemos agendar una cita. Dinos qué día y hora te viene bien. Consultas: presenciales, videollamada o telefónicas. |

### A5. Entregar al desarrollador

Cuando tengas WhatsApp Business funcionando, entrega estos datos al desarrollador:

- [ ] Número verificado: +34 661 911 574
- [ ] Acceso al correo alfonsroiget@gmail.com (para código Meta)

---

## 🔷 SECCIÓN B — DESARROLLADOR (implementación técnica)

*Después de que el abogado complete la sección A, implementa la integración.*

### B1. Verificar número en Meta for Developers

El abogado debe completar docs/17 (Meta Business) para obtener:
- `WHATSAPP_ACCESS_TOKEN` — token permanente
- `WHATSAPP_PHONE_NUMBER_ID` — ID del número
- `WHATSAPP_BUSINESS_ACCOUNT_ID` — ID de cuenta comercial

### B2. Variables de entorno

Ya configuradas en `.env.local` (ver docs/17 paso A7):
- `WHATSAPP_PHONE_NUMBER_ID=1201622436357912`
- `WHATSAPP_BUSINESS_ACCOUNT_ID=1603799175088577`
- `WHATSAPP_ACCESS_TOKEN` — token de docs/17
- `WHATSAPP_API_VERSION=v25.0`
- `WHATSAPP_VERIFY_TOKEN=lex-honduras-wa-verify-2026`

### B3. Endpoint webhook

Crear `app/api/whatsapp/route.ts`:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ ok: true });
}
```

### B4. Proxy.ts — ya está configurado

`/api/whatsapp` ya está en `PUBLIC_API_EXACT` en `proxy.ts` (línea 15). No es necesario modificarlo.

### B5. Configurar Webhook en Meta for Developers

En developers.facebook.com → App → WhatsApp → Configuration → Webhook:
- **Callback URL**: `http://localhost:3000/api/whatsapp`
- **Verify Token**: `lex-honduras-wa-verify-2026`
- **Webhook fields**: marcar `messages`, `message_deliveries`, `message_reads`
- Tocar **Verify and Save**

---

## ✅ Progreso

- [ ] A1: WhatsApp Business descargado (abogado)
- [ ] A2: Número verificado (abogado)
- [ ] A3: Perfil profesional configurado (abogado)
- [ ] A4: Mensajes automáticos creados (abogado)
- [ ] A5: Token + IDs entregados al desarrollador (abogado)
- [ ] B1: Número registrado en Meta for Developers (dev)
- [ ] B2: Variables de entorno configuradas (dev)
- [ ] B3: Endpoint /api/whatsapp creado (dev)
- [ ] B4: Proxy.ts actualizado (dev)
- [ ] B5: Webhook configurado en Meta (dev)


