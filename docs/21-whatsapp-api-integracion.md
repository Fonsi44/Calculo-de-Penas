# WhatsApp Cloud API — Guía de integración técnica

> **Para:** Desarrollador
> **Propósito:** Conectar WhatsApp Business API con el CRM para enviar/recibir mensajes automáticos
> **Depende de:** Meta Business configurado (docs/17), Twenty funcionando (docs/19)

---

## 1. Resumen de integración

```
Cliente → WhatsApp → Meta Cloud API → Webhook POST /api/whatsapp
  → Bridge API busca/busca Contact en Twenty
  → Crea lead o registra interacción
  → Bridge API responde al cliente

Abogado → Dashboard → Bridge API → Meta Cloud API → WhatsApp del cliente
```

---

## 2. Variables de entorno

Agregar a `.env.local`:

```env
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=<tu-phone-number-id>    # ID del número
WHATSAPP_BUSINESS_ACCOUNT_ID=<tu-business-account-id> # ID cuenta comercial
WHATSAPP_ACCESS_TOKEN=EAA...                 # Token permanente (docs/17)
WHATSAPP_API_VERSION=v25.0                   # Versión de API Meta
WHATSAPP_VERIFY_TOKEN=<tu-verify-token>
```

Agregar a `.env.example` los mismos campos vacíos.

---

## 3. Webhook endpoint

Crear `app/api/whatsapp/route.ts`:

```typescript
// app/api/whatsapp/route.ts
// Meta llama a este endpoint cuando:
// GET: Verificación del webhook (handshake inicial)
// POST: Mensaje entrante, estado de entrega, etc.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Meta envía GET con mode="subscribe" y verify_token
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Verificar que el webhook viene de Meta
  // (En producción, validar firma X-Hub-Signature-256)

  const message = parseIncomingMessage(body);
  if (!message) {
    return Response.json({ ok: true }); // No era un mensaje (status update, etc.)
  }

  await handleIncomingMessage(message);

  return Response.json({ ok: true });
}
```

---

## 4. Librería WhatsApp (lib/whatsapp.ts)

```typescript
// lib/whatsapp.ts
// Cliente completo para la API de WhatsApp Cloud

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v25.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}`;

// ─── Enviar mensaje de texto ───

export async function sendText(to: string, text: string, previewUrl = false) {
  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text, preview_url: previewUrl },
    }),
  });
  return handleResponse(response);
}

// ─── Enviar plantilla (template) ───

export async function sendTemplate(to: string, templateName: string, params: Record<string, string>, language = 'es') {
  const components = [{
    type: 'body',
    parameters: Object.entries(params).map(([key, value]) => ({
      type: 'text',
      text: value
    }))
  }];

  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components,
      },
    }),
  });
  return handleResponse(response);
}

// ─── Enviar mensaje interactivo (botones) ───

export async function sendButtons(to: string, body: string, buttons: { id: string; title: string }[]) {
  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.map(b => ({
            type: 'reply',
            reply: { id: b.id, title: b.title }
          }))
        }
      },
    }),
  });
  return handleResponse(response);
}

// ─── Enviar documento ───

export async function sendDocument(to: string, url: string, filename: string, caption?: string) {
  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: { link: url, filename, caption },
    }),
  });
  return handleResponse(response);
}

// ─── Parsear mensaje entrante ───

export interface IncomingMessage {
  from: string;          // +34XXXXXXXX
  type: string;          // text, interactive, document, image
  text?: string;
  interactive?: { button_reply: { id: string; title: string } };
  timestamp: string;
  messageId: string;
  profileName?: string;
}

export function parseIncomingMessage(body: any): IncomingMessage | null {
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  if (!value?.messages?.[0]) return null;

  const msg = value.messages[0];
  const profileName = value.contacts?.[0]?.profile?.name;

  return {
    from: msg.from,
    type: msg.type,
    text: msg.text?.body,
    interactive: msg.interactive,
    timestamp: msg.timestamp,
    messageId: msg.id,
    profileName,
  };
}

// ─── Manejar respuesta de Meta ───

async function handleResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    console.error('[WhatsApp API Error]', {
      status: response.status,
      error: data.error,
    });
    return { ok: false, error: data.error };
  }
  return { ok: true, messageId: data.messages?.[0]?.id };
}
```

---

## 5. Manejador de mensajes entrantes

```typescript
// lib/whatsapp-handler.ts

export async function handleIncomingMessage(msg: IncomingMessage) {
  // 1. Normalizar teléfono
  const telefono = normalizePhone(msg.from);

  // 2. Buscar Contact en Twenty
  const contact = await findContactByPhone(telefono);

  if (!contact) {
    // 3. Nuevo lead — crear en Twenty
    const newContact = await createContactInTwenty({
      name: msg.profileName || 'WhatsApp lead',
      telefono: telefono,
      leadSource: 'whatsapp',
    });

    const newDeal = await createDealInTwenty({
      contactId: newContact.id,
      name: `WhatsApp - ${msg.profileName || 'Lead'}`,
      pipelineId: 'captacion',
      stageId: 'nuevo_contacto',
      // Sin asignar (va al pool)
    });

    // 4. Enviar bienvenida automática
    await sendTemplate(telefono, 'bienvenida_lead', {
      '1': msg.profileName || 'cliente',
      '2': 'Pineda y Asociados',
    });
  } else {
    // 5. Contacto existente — registrar interacción
    await logInteraction(contact.id, {
      type: 'whatsapp',
      content: msg.text || '[mensaje interactivo]',
      timestamp: msg.timestamp,
    });

    // 6. Actualizar deals activos del contacto
    const activeDeals = await getActiveDeals(contact.id);
    // Notificar al abogado en su dashboard
  }
}

function normalizePhone(phone: string): string {
  // Eliminar +, espacios, guiones
  let clean = phone.replace(/[\s\-\+]/g, '');
  // Si empieza con 34, agregar +
  if (clean.startsWith('34') && !clean.startsWith('+')) {
    clean = '+' + clean;
  }
  // Si solo tiene 9 dígitos (móvil español sin código país), asumir +34
  if (/^\d{9}$/.test(clean)) {
    clean = '+34' + clean;
  }
  return clean;
}
```

---

## 6. Configurar webhook en Meta for Developers

**Número WhatsApp**: display `+34 6XX XX XX XX` · API E.164 `+346XXXXXXXX` · Phone ID `<WHATSAPP_PHONE_NUMBER_ID>`

**Pasos del abogado (ya hizo docs/17):**
- Creó app en developers.facebook.com
- Registró el número de WhatsApp
- Obtuvo token permanente

**Pasos del desarrollador:**

1. Ir a https://developers.facebook.com → Apps → "Pineda y Asociados - CRM"
2. Menú izquierdo: **WhatsApp** → **Configuration**
3. En **Webhook**, tocar **Edit**:

| Campo | Valor |
|---|---|
| Callback URL | `http://localhost:3000/api/whatsapp` |
| Verify Token | `<WHATSAPP_VERIFY_TOKEN>` |
| Webhook fields | Marcar: `messages`, `message_deliveries`, `message_reads` |

4. Tocar **Verify and Save**
5. En la misma página, en **Webhook fields**, tocar **Manage** y suscribirse a `messages`

### Para desarrollo local

Meta no puede alcanzar `localhost`. Usar un túnel:

```powershell
# Opción 1: ngrok (gratuito)
ngrok http 3000

# Opción 2: cloudflared (gratuito)
cloudflared tunnel --url http://localhost:3000
```

Copiar la URL generada (ej: `https://abc123.ngrok.io`) y usarla como Callback URL temporal.

---

## 7. Plantillas de mensaje (requieren aprobación Meta)

Estas plantillas deben crearse en WhatsApp Manager y ser aprobadas por Meta.

### 7.1 Crear plantillas

Las plantillas se crean en WhatsApp Manager (UI), no vía API (Meta rechaza templates creados por API automáticamente).

1. Ir a https://business.facebook.com → WhatsApp Manager
2. Seleccionar cuenta comercial → **Plantillas de mensajes**
3. Crear cada plantilla con ejemplos de contenido para aprobación:

| Plantilla | Categoría | Variables | Propósito |
|---|---|---|---|
| bienvenida_lead | UTILITY | {{1}} nombre, {{2}} bufete | Primer contacto automático |
| cita_confirmada | UTILITY | {{1}} fecha, {{2}} hora, {{3}} abogado | Confirmar cita |
| recordatorio_cita | UTILITY | {{1}} fecha, {{2}} hora | 24h antes |
| documento_solicitado | UTILITY | {{1}} nombre_doc | Pedir documento |
| documento_rechazado | UTILITY | {{1}} nombre_doc, {{2}} motivo | Rechazo + motivo |
| presupuesto_enviado | MARKETING | {{1}} monto | Avisar presupuesto listo |
| presupuesto_aceptado | MARKETING | {{1}} caso_numero | Bienvenida al caso |
| caso_actualizacion | UTILITY | {{1}} etapa | Cambio de etapa |
| magic_link_reenvio | UTILITY | {{1}} link | Reenvío de enlace |

> ⚠️ **Tiempo de aprobación**: 24-48h. Las plantillas se testean con el webhook en local (docs/21 sección 6).

### 7.2 Ejemplo: plantilla "bienvenida_lead"

```
🔔 PINEDA Y ASOCIADOS

Hola {{1}}, gracias por contactarnos.

Hemos recibido tu solicitud y uno de nuestros abogados te atenderá pronto.

Mientras tanto, puedes conocer más sobre nuestros servicios en:
https://pinedayasociadoshn.com

📞 +34 6XX XXX XXX
```

### 7.3 Envío de plantilla desde el código

```typescript
await sendTemplate('+34XXXXXXXX', 'bienvenida_lead', {
  '1': 'Juan',
  '2': 'Pineda y Asociados',
});
```

---

## 8. Manejo de errores y reintentos

```typescript
// lib/whatsapp-retry.ts

export async function sendWithRetry(
  sendFn: () => Promise<{ ok: boolean; error?: any }>,
  maxRetries = 3
): Promise<{ ok: boolean; error?: any }> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await sendFn();
    if (result.ok) return result;

    const code = result.error?.code;

    // Errores permanentes: no reintentar
    const permanentErrors = [100, 101, 102, 103, 200, 201, 202];
    if (permanentErrors.includes(code)) {
      console.error('[WhatsApp] Error permanente:', code, result.error);
      return { ok: false, error: result.error };
    }

    // Rate limit (429)
    if (code === 429) {
      const retryAfter = result.error?.error_data?.retry_after || 5;
      console.warn(`[WhatsApp] Rate limit, esperando ${retryAfter}s`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }

    // Error transitorio: backoff exponencial
    const waitMs = Math.pow(2, i) * 1000;
    console.warn(`[WhatsApp] Reintento ${i + 1}/${maxRetries} en ${waitMs}ms`);
    await new Promise(r => setTimeout(r, waitMs));
  }

  // Si todo falla, enviar email como backup
  return { ok: false, error: 'Max retries exceeded - email backup sent' };
}
```

---

## 9. Notificaciones automáticas (disparadores)

```typescript
// lib/notification-service.ts
// Servicio central que decide qué notificación enviar

type TriggerEvent =
  | 'appointment.scheduled'
  | 'appointment.reminder_24h'
  | 'document.requested'
  | 'document.rejected'
  | 'budget.sent'
  | 'budget.accepted'
  | 'lead.contacted'
  | 'case.status_update';

export async function notify(event: TriggerEvent, data: Record<string, any>) {
  const template = await getWhatsAppTemplate(event);
  if (!template) {
    console.warn(`[notify] No template for event: ${event}`);
    return;
  }

  // Construir variables desde los datos
  const variables = mapTemplateVariables(template.variables, data);

  // Enviar WhatsApp (con retry + fallback a email)
  const result = await sendWithRetry(() =>
    sendTemplate(data.phone, template.templateName, variables)
  );

  if (!result.ok) {
    // Fallback a email
    await sendEmailBackup(data.email, event, variables);
    console.log('[notify] WhatsApp falló, email backup enviado');
  }

  // Log
  await auditLog.create({
    action: `notification.${event}`,
    actorId: 'system',
    resourceId: data.dealId,
    metadata: { channel: result.ok ? 'whatsapp' : 'email' },
  });
}
```

---

## 10. Conversación interactiva (árbol básico)

Cuando el cliente responde un mensaje interactivo, Meta envía un POST con `interactive.button_reply`. El webhook puede implementar un árbol simple:

```typescript
// En handleIncomingMessage, después de identificar el contacto:
if (msg.interactive?.button_reply) {
  const buttonId = msg.interactive.button_reply.id;

  switch (buttonId) {
    case 'info_penal':
      await sendText(telefono, 'Nuestros servicios de derecho penal incluyen: defensa en proceso penal, querellas, recursos de apelación, medidas sustitutivas y más. ¿Quieres agendar una consulta?');
      await sendButtons(telefono, '¿Qué deseas hacer?', [
        { id: 'agendar', title: 'Agendar consulta' },
        { id: 'mas_info', title: 'Más información' },
      ]);
      break;
    case 'agendar':
      // Mostrar slots disponibles
      const slots = await getAvailableSlots(lawyerId, '2026-06-08', 'phone');
      // ...
      break;
  }
}
```

---

## Progreso

- [ ] 1. Agregar variables de WhatsApp a .env.local
- [ ] 2. Crear app/api/whatsapp/route.ts (GET + POST)
- [ ] 3. Crear lib/whatsapp.ts (sendText, sendTemplate, sendButtons, sendDocument)
- [ ] 4. Crear lib/whatsapp-handler.ts (procesar mensajes entrantes)
- [ ] 5. Implementar normalización de teléfonos (+34)
- [ ] 6. Configurar webhook en Meta for Developers
- [ ] 7. Probar handshake con ngrok/cloudflared
- [ ] 8. Crear plantillas en WhatsApp Manager y esperar aprobación
- [ ] 9. Crear lib/whatsapp-retry.ts (reintentos + fallback email)
- [ ] 10. Crear lib/notification-service.ts (disparadores de notificaciones)
- [ ] 11. Probar flujo completo: mensaje entrante → crear lead → responder
- [ ] 12. Probar plantillas aprobadas
- [ ] 13. Probar mensajes interactivos (botones)



