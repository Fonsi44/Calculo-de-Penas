# Twenty CRM — Pipelines, modelos de datos y lógica de negocio

> **Para:** Desarrollador
> **Propósito:** Configurar los pipelines de captación y casos activos en Twenty con todos los campos personalizados y reglas de transición
> **Depende de:** Twenty instalado y funcionando (docs/19)

---

## 1. Resumen

Twenty CRM tendrá 3 pipelines:

| Pipeline | Propósito | Etapas |
|---|---|---|
| Captación | Leads nuevos hasta contrato firmado | 6 etapas |
| Caso Activo | Casos en gestión legal | 5 etapas |
| Cerrados | Archivo de leads/casos finalizados | 7 etapas de salida |

---

## 2. Crear objetos personalizados en Twenty

Twenty permite crear objetos personalizados desde la API REST. Ejecuta estos comandos desde PowerShell (o Postman).

### 2.1 Obtener API key de Twenty

```powershell
# En la UI de Twenty: Settings > API > Crear API key
# O vía API:
curl -X POST http://localhost:3000/rest/access-token
```

Guarda la key como variable de entorno:

```powershell
$env:TWENTY_API_KEY = "tu-api-key-aqui"
$env:TWENTY_API_URL = "http://localhost:3000"
```

### 2.2 Crear objeto "Documento"

```powershell
$body = @{
    nameSingular = "documento"
    namePlural = "documentos"
    labelSingular = "Documento"
    labelPlural = "Documentos"
    icon = "IconFile"
} | ConvertTo-Json

curl -X POST "$env:TWENTY_API_URL/rest/metadata/objects" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:TWENTY_API_KEY" `
  -d $body
```

### 2.3 Agregar campos al objeto "Documento"

Campos necesarios:

| Nombre | Tipo | Descripción |
|---|---|---|
| dealId | relation (FK a Deal) | Caso al que pertenece |
| name | text | Nombre descriptivo |
| category | select: requested_by_lawyer, uploaded_by_client, other | Quién lo solicitó |
| status | select: pending, submitted, accepted, rejected | Estado actual |
| version | number | Versión del documento |
| fileUrl | text | URL del archivo |
| fileName | text | Nombre del archivo original |
| fileSize | number | Bytes |
| rejectionReason | select: blurry, incorrect, incomplete, expired, other | Motivo de rechazo |
| rejectionNote | text | Nota del abogado al rechazar |
| isRequiredForCase | boolean | Si fue solicitado por el abogado |

```powershell
# Ejemplo de creación de campo (repetir para cada campo)
$field = @{
    objectName = "documento"
    name = "status"
    label = "Estado"
    type = "select"
    options = @("pending", "submitted", "accepted", "rejected")
} | ConvertTo-Json

curl -X POST "$env:TWENTY_API_URL/rest/metadata/fields" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:TWENTY_API_KEY" `
  -d $field
```

### 2.4 Crear objeto "Cita"

```powershell
$body = @{
    nameSingular = "cita"
    namePlural = "citas"
    labelSingular = "Cita"
    labelPlural = "Citas"
    icon = "IconCalendar"
} | ConvertTo-Json

curl -X POST "$env:TWENTY_API_URL/rest/metadata/objects" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:TWENTY_API_KEY" `
  -d $body
```

Campos de "Cita":

| Nombre | Tipo | Descripción |
|---|---|---|
| dealId | relation | FK a Deal |
| contactId | relation | FK a Contact |
| scheduledAt | datetime | Fecha y hora |
| durationMinutes | number | Duración (default 30) |
| modality | select: phone, office, home_visit | Modalidad |
| status | select: scheduled, confirmed_by_client, completed, cancelled, rescheduled, no_show | Estado |
| notes | text | Notas del abogado |

### 2.5 Crear objeto "LawyerAvailability"

```powershell
$body = @{
    nameSingular = "disponibilidad"
    namePlural = "disponibilidades"
    labelSingular = "Disponibilidad"
    labelPlural = "Disponibilidades"
    icon = "IconClock"
} | ConvertTo-Json

curl -X POST "$env:TWENTY_API_URL/rest/metadata/objects" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:TWENTY_API_KEY" `
  -d $body
```

Campos de "Disponibilidad":

| Nombre | Tipo | Descripción |
|---|---|---|
| userId | relation | FK a User (Twenty) |
| dayOfWeek | number | 0=Domingo...6=Sábado |
| startTime | time | Ej: "07:00" |
| endTime | time | Ej: "20:00" |
| slotDurationMinutes | number | Default 30 |
| breakStart | time nullable | Ej: "12:00" |
| breakEnd | time nullable | Ej: "13:00" |
| modalities | multiselect | phone, office, home_visit |
| isActive | boolean | Default true |

---

## 3. Agregar campos personalizados a objetos nativos

### 3.1 Campos en Contact

```powershell
# Agregar leadSource a Contact
$field = @{
    objectName = "person"
    name = "leadSource"
    label = "Origen del lead"
    type = "select"
    options = @("web", "phone_call", "whatsapp", "referral", "walk_in", "other")
} | ConvertTo-Json

curl -X POST "$env:TWENTY_API_URL/rest/metadata/fields" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:TWENTY_API_KEY" `
  -d $field
```

Repetir para cada campo:

| Objeto | Campo | Tipo |
|---|---|---|
| person | identityDocument | text (DNI) |
| person | dateOfBirth | date |
| person | occupation | text |
| person | magicLinkToken | text (encrypted) |
| person | magicLinkExpiresAt | datetime |
| person | confirmedAt | datetime |

### 3.2 Campos en Deal

| Objeto | Campo | Tipo |
|---|---|---|
| deal | caseNumber | text (auto: LEX-YYYY-NNN) |
| deal | legalArea | select (14 áreas) |
| deal | procedureType | text (máx 500) |
| deal | procedureCatalogRef | text nullable |
| deal | urgency | select: high, medium, low |
| deal | caseSummary | text (máx 5000) |
| deal | budgetStatus | select: not_sent, sent, accepted, rejected, expired |
| deal | budgetFilePath | text |
| deal | budgetSentAt | datetime |
| deal | budgetAcceptedAt | datetime |
| deal | contractStatus | select: pending, sent, signed |
| deal | nextImportantDate | date |
| deal | nextImportantType | select: hearing, deadline, appointment, filing |

---

## 4. Crear pipelines

### 4.1 Pipeline "Captación"

```powershell
# Crear pipeline de Captación
$pipeline = @{
    name = "Captación"
    objectName = "deal"
    stages = @(
        @{ name = "Nuevo contacto"; position = 0 }
        @{ name = "Contactado"; position = 1 }
        @{ name = "Consulta agendada"; position = 2 }
        @{ name = "Consulta realizada"; position = 3 }
        @{ name = "Presupuesto enviado"; position = 4 }
        @{ name = "Contrato firmado"; position = 5 }
    )
} | ConvertTo-Json

curl -X POST "$env:TWENTY_API_URL/rest/pipelines" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:TWENTY_API_KEY" `
  -d $pipeline
```

### 4.2 Pipeline "Caso Activo"

```powershell
$pipeline = @{
    name = "Caso Activo"
    objectName = "deal"
    stages = @(
        @{ name = "Apertura"; position = 0 }
        @{ name = "Instrucción"; position = 1 }
        @{ name = "Procesal"; position = 2 }
        @{ name = "Seguimiento"; position = 3 }
        @{ name = "Cierre"; position = 4 }
    )
} | ConvertTo-Json

curl -X POST "$env:TWENTY_API_URL/rest/pipelines" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:TWENTY_API_KEY" `
  -d $pipeline
```

### 4.3 Pipeline "Cerrados"

```powershell
$pipeline = @{
    name = "Cerrados"
    objectName = "deal"
    stages = @(
        @{ name = "Exitoso"; position = 0 }
        @{ name = "Sin éxito"; position = 1 }
        @{ name = "Duplicado"; position = 2 }
        @{ name = "Abandonado"; position = 3 }
        @{ name = "No aceptado"; position = 4 }
        @{ name = "Presupuesto rechazado"; position = 5 }
        @{ name = "Cancelado por cliente"; position = 6 }
    )
} | ConvertTo-Json

curl -X POST "$env:TWENTY_API_URL/rest/pipelines" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:TWENTY_API_KEY" `
  -d $pipeline
```

---

## 5. Bridge API — Conexión con Twenty

Crear `lib/twenty-client.ts`:

```typescript
// lib/twenty-client.ts
// Cliente HTTP para la REST API de Twenty CRM

const TWENTY_API_URL = process.env.TWENTY_API_URL || 'http://localhost:3000';
const TWENTY_API_KEY = process.env.TWENTY_API_KEY;

interface TwentyOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string>;
  etag?: string;  // Para optimistic locking
}

export async function twentyFetch<T>(endpoint: string, options: TwentyOptions = {}): Promise<T> {
  const url = new URL(`${TWENTY_API_URL}/rest/${endpoint}`);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TWENTY_API_KEY}`,
  };
  if (options.etag) headers['If-Match'] = options.etag;

  const response = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twenty API error ${response.status}: ${error}`);
  }

  const etag = response.headers.get('ETag');
  const data = await response.json();

  return { ...data, etag } as T;
}
```

---

## 6. Webhooks — Recibir eventos de Twenty

Crear `app/api/twenty/webhook/route.ts`:

```typescript
// app/api/twenty/webhook/route.ts
// Twenty envía POST aquí cuando ocurren eventos

import { NextResponse } from 'next/server';
import { handleDealCreated, handleDealUpdated } from '@/lib/twenty-handlers';

export async function POST(request: Request) {
  const signature = request.headers.get('X-Twenty-Signature');
  // Verificar firma aquí (si Twenty la provee)

  const event = await request.json();
  
  switch (event.type) {
    case 'deal.created':
      await handleDealCreated(event.data);
      break;
    case 'deal.updated':
      await handleDealUpdated(event.data);
      break;
    case 'document.updated':
      await handleDocumentUpdated(event.data);
      break;
    default:
      console.log('[twenty-webhook] Evento no manejado:', event.type);
  }

  return NextResponse.json({ received: true });
}
```

Configurar el webhook en Twenty:

```powershell
# Registrar webhook en Twenty
$webhook = @{
    targetUrl = "http://localhost:3001/api/twenty/webhook"  # URL de tu Next.js dev
    operations = @("create", "update")
    objectName = "deal"
} | ConvertTo-Json

curl -X POST "$env:TWENTY_API_URL/rest/webhooks" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:TWENTY_API_KEY" `
  -d $webhook
```

---

## 7. Pool de leads — Asignación atómica

Crear `app/api/twenty/deals/assign/route.ts`:

```typescript
// PUT /api/twenty/deals/:id/assign
// Asigna un deal a un abogado con optimistic locking

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { lawyerId } = await request.json();
  
  // Paso 1: Obtener deal actual con ETag
  const deal = await twentyFetch(`deals/${params.id}`);
  
  // Paso 2: Verificar que no esté asignado
  if (deal.assignedUserId) {
    return Response.json({
      ok: false,
      error: 'LEAD_ALREADY_ASSIGNED',
      assignedTo: deal.assignedUserId
    }, { status: 409 });
  }
  
  try {
    // Paso 3: Asignar con ETag (optimistic locking)
    const updated = await twentyFetch(`deals/${params.id}`, {
      method: 'PATCH',
      body: {
        assignedUserId: lawyerId,
        stageId: 'contactado' // Avanza automático
      },
      etag: deal.etag
    });
    
    // Paso 4: Log de auditoría
    await auditLog.create({
      action: 'lead.assigned',
      actorId: lawyerId,
      resourceId: params.id
    });
    
    return Response.json({ ok: true, deal: updated });
    
  } catch (err) {
    if (err.message.includes('412')) {
      return Response.json({
        ok: false,
        error: 'RACE_CONDITION',
        message: 'El lead fue asignado por otro abogado mientras lo tomabas'
      }, { status: 412 });
    }
    throw err;
  }
}
```

---

## 8. Reglas de transición entre etapas

Estas reglas se implementan en el handler de webhook `deal.updated`:

### Pipeline Captación

| Desde | Hacia | Guard (validación) |
|---|---|---|
| Nuevo contacto | Contactado | Automático al asignar abogado |
| Contactado | Consulta agendada | Debe existir cita agendada |
| Consulta agendada | Consulta realizada | Debe tener resumen (caseSummary) |
| Consulta realizada | Presupuesto enviado | legalArea + procedureType requeridos |
| Presupuesto enviado | Contrato firmado | budgetStatus = accepted |
| Cualquiera | Cerrados | Motivo de salida requerido |

```typescript
// lib/twenty-handlers.ts
const CAPTACION_TRANSITIONS: Record<string, TransitionRule> = {
  'contactado': {
    canAdvanceTo: ['consulta_agendada', 'no_interesado'],
    validate: (deal) => {
      if (deal.stageId === 'consulta_agendada' && !deal.appointmentScheduledAt) {
        return { ok: false, error: 'Se requiere agendar una cita antes de avanzar' };
      }
      return { ok: true };
    }
  },
  'consulta_realizada': {
    canAdvanceTo: ['presupuesto_enviado', 'no_tomamos_caso'],
    validate: (deal) => {
      if (!deal.legalArea) return { ok: false, error: 'Seleccione el área legal' };
      if (!deal.procedureType) return { ok: false, error: 'Describa el tipo de procedimiento' };
      return { ok: true };
    }
  },
};
```

---

## 9. Generador de número de caso

```typescript
// lib/case-number.ts
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  const [result] = await db.execute(sql`
    SELECT COALESCE(MAX(seq), 0) + 1 as next_seq
    FROM case_number_sequence
    WHERE year = ${year}
    FOR UPDATE  -- Bloqueo de fila para evitar duplicados
  `);
  
  // Guardar el nuevo seq
  await db.execute(sql`
    INSERT INTO case_number_sequence (year, seq)
    VALUES (${year}, ${result.next_seq})
    ON CONFLICT (year) DO UPDATE SET seq = ${result.next_seq}
  `);
  
  return `LEX-${year}-${String(result.next_seq).padStart(3, '0')}`;
}

// Tabla auxiliar en DB:
// CREATE TABLE case_number_sequence (
//   year INTEGER PRIMARY KEY,
//   seq INTEGER NOT NULL DEFAULT 0
// );
```

---

## 10. Actualizar formulario web /api/consulta

Modificar `app/api/consulta/route.ts` para que además de enviar email, cree Contact + Deal en Twenty:

```typescript
// En app/api/consulta/route.ts (añadir al final)
import { createContactInTwenty, createDealInTwenty } from '@/lib/twenty-client';

// Después de enviar email...
const twentyContact = await createContactInTwenty({
  name: parsed.data.nombre,
  telefono: parsed.data.telefono,
  email: parsed.data.email,
  leadSource: 'web',
});

const twentyDeal = await createDealInTwenty({
  contactId: twentyContact.id,
  name: `Lead web - ${parsed.data.nombre}`,
  pipelineId: 'captacion',
  stageId: 'nuevo_contacto',
  // Sin assignedUserId (visible en pool)
});

// Log
console.log('[consulta] Lead creado en Twenty:', twentyDeal.id);
```

---

## Progreso

- [ ] 1. Obtener API key de Twenty
- [ ] 2. Crear objeto Documento con campos
- [ ] 3. Crear objeto Cita con campos
- [ ] 4. Crear objeto LawyerAvailability con campos
- [ ] 5. Agregar campos personalizados a Contact
- [ ] 6. Agregar campos personalizados a Deal
- [ ] 7. Crear pipeline Captación (6 etapas)
- [ ] 8. Crear pipeline Caso Activo (5 etapas)
- [ ] 9. Crear pipeline Cerrados (7 etapas)
- [ ] 10. Crear lib/twenty-client.ts
- [ ] 11. Crear webhook endpoint /api/twenty/webhook
- [ ] 12. Registrar webhook en Twenty
- [ ] 13. Implementar pool de leads con optimistic locking
- [ ] 14. Implementar reglas de transición entre etapas
- [ ] 15. Crear generador de número de caso LEX-YYYY-NNN
- [ ] 16. Actualizar /api/consulta para crear leads en Twenty


